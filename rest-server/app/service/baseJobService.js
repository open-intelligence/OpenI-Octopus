
'use strict';

/** *
 * the common job service, implement the basic operations
 */

const fs = require('fs');
const yaml = require('js-yaml');
const Service = require('egg').Service;
const LError = require('../error/proto');
const ECode = require('../error/code');
const K8sFrameworkClient = require('../lib/k8sFrameworkClient');
const k8s_job_utils = require('./k8s_job/utils');
const job_should_fail_reason = require('./k8s_job/should_failed_reason');
const standard_k8s = require("./k8s_job/standard/k8s");

const Constants = require('./k8s_job/constants');


class BaseJobService extends Service {

  constructor(...args) {

    super(...args);

    this.jobRecordModel = this.app.model.JobRecord;
     

    const kube_config_file = yaml.safeLoad(fs.readFileSync(this.config.k8sConfigPath));

    const kube_config = {
      ca: kube_config_file.clusters[0].cluster['certificate-authority-data'],
      cert: kube_config_file.users[0].user['client-certificate-data'],
      key: kube_config_file.users[0].user['client-key-data'],
      server: kube_config_file.clusters[0].cluster.server,
    };

    const Authorization = {
      ca: Buffer.from(kube_config.ca, 'base64').toString(),
      cert: Buffer.from(kube_config.cert, 'base64').toString(),
      key: Buffer.from(kube_config.key, 'base64').toString(),
    };


    this.k8sFrameworkClient = new K8sFrameworkClient();

    this.k8sFrameworkClient.setApiServer(kube_config.server);

    this.k8sFrameworkClient.setAuthCtxProvider(opt => Object.assign(opt, Authorization));

  }

  /**
   * submit job to k8s
   *
   * @param {Framework} framework  framework
   * @return {boolean} result
   * @api protected
   */
  async _invoke_framework(framework) {

    const job_id = framework.GetName();

    const job_record_old = await this.jobRecordModel.findOne({ where: { job_id } });

    if (job_record_old != null) {
      throw new LError(ECode.RESOURCES_OVERLOAD, `job with job_id: ${job_id} is already exist!`);
    }

    const job_name = framework.GetLabel(Constants.K8S_JOB_NAME_LABEL_KEY);
    const user_id = framework.GetLabel(Constants.K8S_USER_LABEL_KEY);
    const org_id = framework.GetLabel(Constants.K8S_ORG_ID_LABEL_KEY);
    const job_type = framework.GetLabel(Constants.K8S_JOB_TYPE_LABEL_KEY);

    if (!job_name || !user_id || !org_id || !job_type) {
      throw new LError(ECode.INVALID_PARAM, 'Please make sure you have set all the labels');
    }

    const job_record = {
      job_id,
      job_name,
      job_type,
      user_id,
      org_id,
      created_at: new Date(),
      resource_usage: framework.GetResourceUsage(),
      job_state: Constants.FRAMEWORK_STATUS.WAITING,
      completed_at: new Date(),
      job_config: framework.GetConfig(),
      job_detail: {},
    };

    await this.jobRecordModel.upsert(job_record);

    const result = await this.k8sFrameworkClient.create(framework.toJson());

    if (result.kind === 'Status') {

      throw new LError(ECode.FAILURE, result.message);

    }

    return job_id;

  }
  /**
   * convert k8s framework data format to standard format
   * @param {Object} framework
   * @return {Object} 
   * @api private
   */
  _standard_framework(framework){
    return  standard_k8s.convert(framework);
  }

  /**
   * check if the pod failed because of some specific reason
   *
   * @param {String} pod_name  name of a pod
   * @return {JSON} rsp
   * @api private
   */
  async _is_pod_failed(pod_name) {

    const opt = {
      url: `${this.k8sFrameworkClient.getApiServer()}/api/v1/namespaces/${this.k8sFrameworkClient.getNamespace()}/pods/${pod_name}`,
      method: 'GET',
      json: true,
    };

    const pod = await this.k8sFrameworkClient.request(opt);

    if (pod.kind === 'Status') {

      return {
        failed: false,
        message: '',
      };

    }

    if (pod.status.phase !== 'Pending') {
      return {
        failed: false,
        message: '',
      };
    }

    let container_status_list = [];

    if (Array.isArray(pod.status.initContainerStatuses)) {
      container_status_list = container_status_list.concat(pod.status.initContainerStatuses);
    }

    if (Array.isArray(pod.status.containerStatuses)) {
      container_status_list = container_status_list.concat(pod.status.containerStatuses);
    }

    const rsp = {
      failed: false,
      message: '',
    };

    for (let i = 0; i < container_status_list.length; i++) {

      const status = container_status_list[i];

      if (undefined === status.state.waiting || status.state.waiting === null) {
        continue;
      }

      if (job_should_fail_reason.includes(status.state.waiting.reason)) {

        rsp.failed = true;
        rsp.message = status.state.waiting.message;
        break;
      }
    }

    return rsp;
  }

  /**
   * check if the framework failed  
   * @param {JSON} framework k8s framework object
   * @return {JSON} rsp
   * @api private
   */
  async _is_framework_failed(framework) {
    
    const rsp = {
      failed: false,
      message: '',
    };

    if(!framework.status || !framework.status.attemptStatus || !framework.status.attemptStatus.taskRoleStatuses){
        return rsp;
    }
     
    const task_role_status_list = framework.status.attemptStatus.taskRoleStatuses || [];

    for (let i = 0; i < task_role_status_list.length; i++) {

      const status = task_role_status_list[i].taskStatuses[0] || {};

      if (status.state !== 'AttemptPreparing') {
        continue;
      }

      const pod_name = status.attemptStatus.podName;

      const failed_check = await this._is_pod_failed(pod_name);

      if (failed_check.failed === true) {
        rsp.failed = true;
        rsp.message = failed_check.message;
        break;
      }
    }

    return rsp;

  }

  /**
   * mark a framework as completed when it has already failed
   * @param {JSON} framework k8s framework object
   * @param {String} failure_message  failure message
   * @api private
   */
  _mark_as_completed_when_failed(framework, failure_message) {

    framework.status.state = 'Completed';

    framework.status.attemptStatus = framework.status.attemptStatus || {};

    framework.status.attemptStatus.completionStatus = {
      type: {
        name: 'Failed',
        attributes: [ 'Transient' ],
      },
      diagnostics: failure_message,
      phrase: 'Failed',
      code: 1,
    };

    const completed_at = new Date().toISOString();

    framework.status.attemptStatus.completionTime = completed_at;

    framework.status.completionTime = completed_at;

  }

  /**
   * query framework from k8s by label selector
   * @param {JSON} label_selector  label  selector
   * @return {Array} list ,framework list
   * @api private
   */
  async _query_framework_from_k8s(label_selector) {

    const k8s_res = await this.k8sFrameworkClient.getByLabelSelector(label_selector);

    const framework_list = k8s_res.items || [];

    const list = [];

    for (let i = 0; i < framework_list.length; i++) {

      const framework = framework_list[i];

      const failure_check = await this._is_framework_failed(framework);

      // change the state of the framework manually
      // please make sure what you are doing when you try to modify

      if (failure_check.failed === true) {
        this._mark_as_completed_when_failed(framework, failure_check.message);
      }

      list.push(this._standard_framework(framework));

    }

    return list;
  }

  /**
   * get framework from k8s by framework name
   * @param {String} job_id name of k8s framework
   * @return {JSON} framework  ,the k8s framework object
   * @api private
   */
  async _get_framework_from_k8s_by_id(job_id) {

    const framework = await this.k8sFrameworkClient.getByName(job_id);

    if (framework.kind === 'Status') {
      return null;
    }

    const failure_check = await this._is_framework_failed(framework);

    if (failure_check.failed === true) {
      this._mark_as_completed_when_failed(framework, failure_check.message);
    }
     
    return this._standard_framework(framework);
  }

  /**
   * update job cache in db
   * @param {JSON} record  data to update
   * @api private
   */
  async _update_job_in_db(record) {

    let current_valid_state = [];

    if (record.job_state) {

      current_valid_state = k8s_job_utils.current_valid_state(record.job_state);

    }

    const condition = { where: { job_id: record.job_id } };

    if (current_valid_state.length > 0) {
      condition.where.job_state = { [this.app.Sequelize.Op.in]: current_valid_state };
    }

    await this.jobRecordModel.update(record, condition);
  }

  /**
   * sync the state of a framework

   * @param {JSON} job_cache  job cache in db
   * @return {JSON} framework , k8s framework object
   * @api private
   *
   */
  async _sync_framework(job_cache) {

    if(job_cache.job_detail && job_cache.job_detail.platformSpecificInfo && job_cache.job_detail.platformSpecificInfo.platform !== "k8s"){
      return job_cache.job_detail;
    }
    
    const completed = [
      Constants.FRAMEWORK_STATUS.FAILED,
      Constants.FRAMEWORK_STATUS.SUCCEEDED,
      Constants.FRAMEWORK_STATUS.STOPPED,
    ];

    if (completed.includes(job_cache.job_state)) {
      return job_cache.job_detail;
    }

    const framework = await this._get_framework_from_k8s_by_id(job_cache.job_id);

    const record = {
      job_id: job_cache.job_id,
    };

    if (!framework) {

      const condition = { where: { job_id:record.job_id} };

      const latest_record = await this.jobRecordModel.findOne(condition);

      if(!latest_record){
        return job_cache.job_detail;
      }

      if(completed.includes(latest_record.job_state)){
        return job_cache.job_detail;
      }

      record.job_state = Constants.FRAMEWORK_STATUS.STOPPED;
    }

    if(framework){

      record.job_detail = framework;

      record.job_state = framework.job.state;
    }
   
    if (completed.includes(record.job_state)) {

      let completed_at = null;

      if (framework  ) {
        completed_at = framework.job.finishedAt;
      }

      if (completed_at === null) {
        completed_at = new Date().toISOString();
      }

      record.completed_at = new Date(completed_at);
    }

    await this._update_job_in_db(record);

    if (completed.includes(record.job_state)) {
      await this.k8sFrameworkClient.deleteByName(job_cache.job_id);
    }

    return framework === null ? job_cache.job_detail : framework;
  }

  /**
   * @param {Array} job_cache_list job cache list in db
   * @return {Array} list , job cache list
   * @api private
   */
  async _sync_frameworks(job_cache_list) {

    const list = [];

    for (let i = 0; i < job_cache_list.length; i++) {

      const job = job_cache_list[i];

      job.job_detail = await this._sync_framework(job);

      list.push(job);

    }

    return list;
  }

  /**
   * sync the state of job in db
   * @api public
   */
  async syncFrameworks() {

    const completed = [
      Constants.FRAMEWORK_STATUS.FAILED,
      Constants.FRAMEWORK_STATUS.SUCCEEDED,
      Constants.FRAMEWORK_STATUS.STOPPED,
    ];

    const records = await this.jobRecordModel.findAll({ where: { job_state: { [this.app.Sequelize.Op.notIn]: completed } } });

    await this._sync_frameworks(records);

  }

  /**
   * stop a framework
   * @param {JSON} condition condition to query job cache
   * @param {String} reason 
   * @return {Boolean} success
   * @api protected
   */
  async _stop_framework(condition,reason) {

    const completed = [
      Constants.FRAMEWORK_STATUS.FAILED,
      Constants.FRAMEWORK_STATUS.SUCCEEDED,
      Constants.FRAMEWORK_STATUS.STOPPED,
    ];

    condition.raw = true;
    condition.where = condition.where || {};
    condition.where.job_state = { [this.app.Sequelize.Op.notIn]: completed };

    const job = await this.jobRecordModel.findOne(condition);

    if (!job) {

      return true;
    }

    const framework = await this._sync_framework(job);

    const job_state = framework.job.state;

    if (completed.includes(job_state)) {
      // alreay completed , no need to stop
      return true;
    }

    const record = {
      job_id: job.job_id,
      job_detail: {},
      job_state: Constants.FRAMEWORK_STATUS.STOPPED,
      completed_at: new Date(),
    };


    framework.job.state = Constants.FRAMEWORK_STATUS.STOPPED;
    framework.job.exitCode = 1;
    framework.job.exitDiagnostics = reason|| "Stopped";
    framework.job.finishedAt = record.completed_at.toISOString();

    record.job_detail = framework;

    await this._update_job_in_db(record);

    await this.k8sFrameworkClient.deleteByName(job.job_id);

    return true;

  }

  /**
   * get job
   * @param {JSON} condition condition to query job record
   * @return {JSON} job  , job record in db
   * @api protected
   */
  async _get_framework(condition) {

    condition.raw = true;

    const job = await this.jobRecordModel.findOne(condition);

    if (!job) {
      return null;
    }

    job.job_detail = await this._sync_framework(job);

    return job;

  }

  /**
   * get job record list from db
   * @param {JSON} condition condition to query job record list
   * @return {Array}  job_list
   * @api protected
   */
  async _get_framework_list(condition) {

    condition.raw = true;

    let job_list = await this.jobRecordModel.findAll(condition);

    return  await this._sync_frameworks(job_list);
  }

  async _query_total_size_from_database(condition){
      condition.raw = true;
      return await this.jobRecordModel.count(condition);
  }

  /**
   * just get job record from db ,no need to sync the state from k8s
   * @param {JSON} condition condition to query job record list
   * @return {JSON} job record
   * @api protected
   */
  async _get_framework_from_database(condition) {
    condition.raw = true;
    return  await this.jobRecordModel.findOne(condition);
  }


  /**
   * just get job record list from db ,no need to sync the state from k8s
   * @param {JSON} condition condition to query job record list
   * @return {JSON} job record list
   * @api protected
   */
  async _get_framework_list_from_database(condition) {
    condition.raw = true;
    return  await this.jobRecordModel.findAll(condition);
  }

}


module.exports = BaseJobService;
