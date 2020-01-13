
'use strict';

/** *
 * the common job service, implement the basic operations
 */
const Service = require('egg').Service;
const LError = require('../error/proto');
const ECode = require('../error/code');
 

class BaseJobService extends Service {

  constructor(...args) {
    super(...args);
    this.jobRecordModel = this.app.model.JobRecord;
    this.k8sTaskSetClient = this.app.k8sTaskSetClient;
    this.k8sPodGroupClient = this.app.k8sPodGroupClient;
    this.K8sJobComponent = this.app.component.K8sJob;
  }

  /**
   * submit job to k8s
   *
   * @param {TaskSet} taskset  
   * @param {PodGroup} podgroup
   * @return {boolean} result
   * @api protected
   */
  async _invoke_taskset(taskset,podgroup) {

    const Constants = this.K8sJobComponent.Constants;

    const job_id = taskset.GetName();

    const job_record_old = await this.jobRecordModel.findOne({ where: { job_id } });

    if (job_record_old != null) {
      throw new LError(ECode.RESOURCES_OVERLOAD, `job with job_id: ${job_id} is already exist!`);
    }

    const rsp = await this.k8sPodGroupClient.create(podgroup.toJson());

    if (rsp.kind === 'Status') {

      throw new LError(ECode.FAILURE, rsp.message);

    }

    const job_name = taskset.GetLabel(Constants.K8S_JOB_NAME_LABEL_KEY);
    const user_id = taskset.GetLabel(Constants.K8S_USER_LABEL_KEY);
    const org_id = taskset.GetLabel(Constants.K8S_ORG_ID_LABEL_KEY);
    const job_type = taskset.GetLabel(Constants.K8S_JOB_TYPE_LABEL_KEY);

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
      resource_usage: taskset.GetResourceUsage(),
      job_state: Constants.TASK_STATUS.WAITING,
      completed_at: new Date(),
      job_config: taskset.GetConfig(),
      job_detail: {},
    };

    await this.jobRecordModel.upsert(job_record);

    const result = await this.k8sTaskSetClient.create(taskset.toJson());

    if (result.kind === 'Status') {
      
      await this.k8sPodGroupClient.deleteByName(podgroup.GetName());

      throw new LError(ECode.FAILURE, result.message);

    }

    return job_id;

  }
  /**
   * convert k8s taskset data format to standard format
   * @param {Object} taskset
   * @return {Object} 
   * @api private
   */
  _standard_taskset(taskset){
    return  this.K8sJobComponent.standard.taskset.convert(taskset);
  }

  /**
   * check if the pod failed because of some specific reason
   *
   * @param {String} pod_name  name of a pod
   * @return {JSON} rsp
   * @api private
   */
  async _is_pod_failed(pod_name) {

    let namespace =  this.k8sTaskSetClient.getNamespace();

    const opt = {
      url: `${this.k8sTaskSetClient.getApiServer()}/api/v1/namespaces/${namespace}/pods/${pod_name}`,
      method: 'GET',
      json: true,
    };

    const pod = await this.k8sTaskSetClient.request(opt);

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

      if (this.K8sJobComponent.ShouldFailedReason.includes(status.state.waiting.reason)) {

        rsp.failed = true;
        rsp.message = status.state.waiting.message;
        break;
      }
    }

    return rsp;
  }

  /**
   * check if the taskset failed  
   * @param {JSON} taskset k8s taskset object
   * @return {JSON} rsp
   * @api private
   */
  async _is_taskset_failed(taskset) {
    
    const rsp = {
      failed: false,
      message: '',
    };

    if(!taskset.status || !taskset.status.roleStatus){
        return rsp;
    }
     
    const task_role_status_list = taskset.status.roleStatus || [];

    for (let i = 0; i < task_role_status_list.length; i++) {

      const status = task_role_status_list[i].replicaStatus[0] || {};

      if (status.phase !== 'TaskRoleReplicaAttemptPreparing') {
        continue;
      }

      const pod_name = status.podName;

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
   * mark a taskset as completed when it has already failed
   * @param {JSON} taskset k8s taskset object
   * @param {String} failure_message  failure message
   * @api private
   */
  _mark_as_completed_when_failed(taskset, failure_message) {

    taskset.status.state = 'Failed';

    framework.status.stateMessage =  failure_message;

    const completed_at = new Date().toISOString();

    framework.status.finishAt = completed_at;

  }

  /**
   * query taskset from k8s by label selector
   * @param {JSON} label_selector  label  selector
   * @return {Array} list ,taskset list
   * @api private
   */
  async _query_taskset_from_k8s(label_selector) {

    const k8s_res = await this.k8sTaskSetClient.getByLabelSelector(label_selector);

    const taskset_list = k8s_res.items || [];

    const list = [];

    for (let i = 0; i < taskset_list.length; i++) {

      const taskset = taskset_list[i];

      const failure_check = await this._is_taskset_failed(taskset);

      // change the state of the taskset manually
      // please make sure what you are doing when you try to modify

      if (failure_check.failed === true) {
        this._mark_as_completed_when_failed(taskset, failure_check.message);
      }

      list.push(this._standard_taskset(taskset));

    }

    return list;
  }

  /**
   * get taskset from k8s by taskset name
   * @param {String} job_id name of k8s taskset
   * @return {JSON} taskset  ,the k8s taskset object
   * @api private
   */
  async _get_taskset_from_k8s_by_id(job_id) {

    const taskset = await this.k8sTaskSetClient.getByName(job_id);

    if (taskset.kind === 'Status') {
      return null;
    }

    const failure_check = await this._is_taskset_failed(taskset);

    if (failure_check.failed === true) {
      this._mark_as_completed_when_failed(taskset, failure_check.message);
    }
     
    return this._standard_taskset(taskset);
  }

  /**
   * update job cache in db
   * @param {JSON} record  data to update
   * @api private
   */
  async _update_job_in_db(record) {

    let current_valid_state = [];

    if (record.job_state) {

      current_valid_state = this.K8sJobComponent.utils.current_valid_state(record.job_state);

    }

    const condition = { where: { job_id: record.job_id } };

    if (current_valid_state.length > 0) {
      condition.where.job_state = { [this.app.Sequelize.Op.in]: current_valid_state };
    }

    await this.jobRecordModel.update(record, condition);
  }

  /**
   * sync the state of a taskset

   * @param {JSON} job_cache  job cache in db
   * @return {JSON} taskset , k8s taskset object
   * @api private
   *
   */
  async _sync_taskset(job_cache) {

    if(job_cache.job_detail && job_cache.job_detail.platformSpecificInfo){
      if(job_cache.job_detail.platformSpecificInfo.platform == "yarn"){
        return job_cache.job_detail;
      }

    }
    const Constants = this.K8sJobComponent.Constants;

    const completed = [
      Constants.TASK_STATUS.FAILED,
      Constants.TASK_STATUS.SUCCEEDED,
      Constants.TASK_STATUS.STOPPED,
    ];

    if (completed.includes(job_cache.job_state)) {
      return job_cache.job_detail;
    }

    const taskset = await this._get_taskset_from_k8s_by_id(job_cache.job_id);
     
    const record = {
      job_id: job_cache.job_id,
    };

    if (!taskset) {

      const condition = { where: { job_id:record.job_id} };

      const latest_record = await this.jobRecordModel.findOne(condition);

      if(!latest_record){
        return job_cache.job_detail;
      }

      if(completed.includes(latest_record.job_state)){
        return job_cache.job_detail;
      }
      console.log("mark as stop")
      //can't find job from k8s,mark as `stopped`
      record.job_state = Constants.TASK_STATUS.STOPPED;
    }

    if(taskset){

      record.job_detail = taskset;

      record.job_state = taskset.job.state;
    }

    if (completed.includes(record.job_state)) {

      let completed_at = null;

      if (taskset ) {
        completed_at = taskset.job.finishedAt;
      }

      if (completed_at === null) {
        completed_at = new Date().toISOString();
      }

      record.completed_at = new Date(completed_at);
    }

    await this._update_job_in_db(record);

    if (completed.includes(record.job_state)) {
      await this.k8sPodGroupClient.deleteByName(job_cache.job_id);
      await this.k8sTaskSetClient.deleteByName(job_cache.job_id);
    }

    return taskset === null ? job_cache.job_detail : taskset;
  }

  /**
   * @param {Array} job_cache_list job cache list in db
   * @return {Array} list , job cache list
   * @api private
   */
  async _sync_tasksets(job_cache_list) {

    const list = [];

    for (let i = 0; i < job_cache_list.length; i++) {

      const job = job_cache_list[i];

      job.job_detail = await this._sync_taskset(job);

      list.push(job);

    }

    return list;
  }

  /**
   * sync the state of job in db
   * @api public
   */
  async syncTaskSets() {
    const Constants = this.K8sJobComponent.Constants;

    const completed = [
      Constants.TASK_STATUS.FAILED,
      Constants.TASK_STATUS.SUCCEEDED,
      Constants.TASK_STATUS.STOPPED,
    ];

    const records = await this.jobRecordModel.findAll({ where: { job_state: { [this.app.Sequelize.Op.notIn]: completed } } });

    await this._sync_tasksets(records);

  }

  /**
   * stop a taskset
   * @param {JSON} condition condition to query job cache
   * @param {String} reason 
   * @return {Boolean} success
   * @api protected
   */
  async _stop_taskset(condition,reason) {
    const Constants = this.K8sJobComponent.Constants;
    
    const completed = [
      Constants.TASK_STATUS.FAILED,
      Constants.TASK_STATUS.SUCCEEDED,
      Constants.TASK_STATUS.STOPPED,
    ];

    condition.raw = true;
    condition.where = condition.where || {};
    condition.where.job_state = { [this.app.Sequelize.Op.notIn]: completed };

    const job = await this.jobRecordModel.findOne(condition);

    if (!job) {

      return true;
    }

    const taskset = await this._sync_taskset(job);

    const job_state = taskset.job.state;

    if (completed.includes(job_state)) {
      // alreay completed , no need to stop
      return true;
    }

    const record = {
      job_id: job.job_id,
      job_detail: {},
      job_state: Constants.TASK_STATUS.STOPPED,
      completed_at: new Date(),
    };


    taskset.job.state = Constants.TASK_STATUS.STOPPED;
    taskset.job.exitCode = 1;
    taskset.job.exitDiagnostics = reason|| "Stopped";
    taskset.job.finishedAt = record.completed_at.toISOString();

    record.job_detail = taskset;

    await this._update_job_in_db(record);
    
    await this.k8sPodGroupClient.deleteByName(job.job_id);
    await this.k8sTaskSetClient.deleteByName(job.job_id);

    return true;

  }

  /**
   * get job
   * @param {JSON} condition condition to query job record
   * @return {JSON} job  , job record in db
   * @api protected
   */
  async _get_taskset(condition) {

    condition.raw = true;

    const job = await this.jobRecordModel.findOne(condition);

    if (!job) {
      return null;
    }

    job.job_detail = await this._sync_taskset(job);

    return job;

  }

  /**
   * get job record list from db
   * @param {JSON} condition condition to query job record list
   * @return {Array}  job_list
   * @api protected
   */
  async _get_taskset_list(condition) {

    condition.raw = true;

    let job_list = await this.jobRecordModel.findAll(condition);

    return  await this._sync_tasksets(job_list);
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
  async _get_taskset_from_database(condition) {
    condition.raw = true;
    return  await this.jobRecordModel.findOne(condition);
  }


  /**
   * just get job record list from db ,no need to sync the state from k8s
   * @param {JSON} condition condition to query job record list
   * @return {JSON} job record list
   * @api protected
   */
  async _get_taskset_list_from_database(condition) {
    condition.raw = true;
    return  await this.jobRecordModel.findAll(condition);
  }

}


module.exports = BaseJobService;
