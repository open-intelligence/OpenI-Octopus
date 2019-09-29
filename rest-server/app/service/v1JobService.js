'use strict';

const fs = require('fs');
const utils = require('util');
const uuidv1 = require('uuid/v1');
const LError = require('../error/proto');
const ECode = require('../error/code');
const libFramework = require('../lib/framework');

const BaseJobService = require('./baseJobService');
const k8s_job_convert = require('./k8s_job/convert');
const k8s_job_utils = require('./k8s_job/utils');


const Constants = require('./k8s_job/constants');

class V1JobService extends BaseJobService {

  constructor(...args) {
    super(...args);
    this.jobPlatformModel = this.app.model.JobPlatform;
    this.images = {};

    this.images.framenameworkBarrier = this.config.dockerImages.framenameworkBarrier;

  }

  async runFramework(user_info, job) {

    k8s_job_utils.checkMinTaskNumber(job);


    await this._initFrameworkFolders(user_info.username, job.jobName);

    const job_id = uuidv1();

    const framework = libFramework.NewFrameWork();

    framework.SetName(job_id);

    framework.SetConfig(job);

    framework.SetLabel(Constants.K8S_ORG_ID_LABEL_KEY, user_info.org_id);
    framework.SetLabel(Constants.K8S_USER_LABEL_KEY, user_info.user_id);
    framework.SetLabel(Constants.K8S_JOB_TYPE_LABEL_KEY, job.gpuType);
    framework.SetLabel(Constants.K8S_JOB_NAME_LABEL_KEY, job.jobName);

    framework.SetRetryAmount(job.retryCount || 0);

    const task_roles = job.taskRoles || [];

    for (let i = 0; i < task_roles.length; i++) {
      const role = task_roles[i];

      const task = libFramework.NewTaskRole();

      task.SetName(role.name);
      task.SetMinFailed(role.minFailedTaskCount);
      task.SetMinSucceeded(role.minSucceededTaskCount);
      task.SetTaskNumber(role.taskNumber);
      task.SetNodeSelector('resourceType', job.gpuType);

      const container = libFramework.NewContainer();

      container.SetCustomResource('nvidia.com/gpu', role.gpuNumber);
      container.SetCpu(role.cpuNumber);
      container.SetMemoryMb(role.memoryMB);
      container.SetCommand('/mnt/frameworkbarrier/injector.sh;sleep 10;' + role.command);
      container.SetImage(job.image);

      container.Mount(libFramework.NewHostPathVolume().SetMountFrom(`/ghome/${user_info.username}`).SetMountTo('/userhome'));
      container.Mount(libFramework.NewHostPathVolume().SetMountFrom(`/gmodel/${user_info.username}`).SetMountTo('/model-hub'));
      container.Mount(libFramework.NewHostPathVolume().SetMountFrom('/gdata').SetMountTo('/gdata')
        .SetReadOnly(true));


      const init_container = libFramework.NewContainer();
      init_container.SetName('framenameworkbarrier');
      init_container.SetImage(this.images.framenameworkBarrier);
      init_container.Mount(libFramework.NewEmptyDirVolume().SetName('frameworkbarrier-volume').SetMountTo('/mnt/frameworkbarrier'));

      container.Mount(libFramework.NewEmptyDirVolume().SetName('frameworkbarrier-volume').SetMountTo('/mnt/frameworkbarrier'));

      task.SetContainer(container);
      task.AddInitContainer(init_container);

      framework.AddTask(task);
    }


    return await this._invoke_framework(framework);

  }

  async _initFrameworkFolders(userName) {

    // ghome 已经挂载到各个机器上了,包括运行该项目的机器节点

    await utils.promisify(fs.mkdir)(`/ghome/${userName}`, { recursive: true });

    await utils.promisify(fs.mkdir)(`/gmodel/${userName}`, { recursive: true });

  }

  async stopFramework(job_id, user_id) {

    const condition = { where: { job_id } };

    if (user_id) {
      condition.where.user_id = user_id;
    }

    return await this._stop_framework(condition);

  }

  async getFramework(job_id, user_id) {

    const condition = { where: { job_id } };

    if (user_id) {
      condition.where.user_id = user_id;
    }

    const record = await this._get_framework(condition);

    if (!record) {
      return null;
    }

    const job_detail = k8s_job_convert.to_web_format(record.job_detail);

    job_detail.jobStatus.state = record.job_state || job_detail.jobStatus.state;

    job_detail.resource = record.resource_usage;

    job_detail.userinfo = {
      user: record.user_id,
      org_id: record.org_id,
    };

    job_detail.config = record.job_config;

    return job_detail;

  }

  async getFrameworkList(cond,size = 20,offset = 0) {

    const condition = { order: [[ 'created_at', 'DESC' ]] ,limit:size,offset:offset};
    const total_size_condition = {};

    condition.where = cond;
    total_size_condition.where = cond;

    const framework_list = await this._get_framework_list(condition);

    const total_size = await this._query_total_size_from_database(total_size_condition)

    return {
      total_size:total_size,
      jobs:framework_list.map(k8s_job_convert.record_to_list_item)
    }
  }

  async getWaitingAndRunningFrameworks(user_id){

      const condition = {where:{job_state:{[this.app.Sequelize.Op.or]:["WAITING","RUNNING"]}},order: [['created_at','DESC']]};

      if(user_id){
          condition.where.user_id = user_id;
      }

      const framework_list = await this._get_framework_list(condition);

      return framework_list.map(k8s_job_convert.resourceInfo_to_list_item);
  }

  async getFrameworkConfig(job_id, user_id) {

    const condition = { where: { job_id }, order: [[ 'created_at', 'DESC' ]] };

    if (user_id) {
      condition.where.user_id = user_id;
    }

    let result = null;

    let gpuTypeAction = 'no_debug';

    try {

      const job = await this._get_framework_from_database(condition);

      if (!job) {
        return result;
      }

      result = job.job_config;

      const jobPlatforms = await this.jobPlatformModel.findAll({});

      for (const jobTypePlatFormInfo of jobPlatforms) {
        if (jobTypePlatFormInfo.dataValues.platformKey === result.gpuType) {
          gpuTypeAction = jobTypePlatFormInfo.dataValues.action;
          break;
        }
      }

      result.typeAction = gpuTypeAction;

    } catch (e) {
      throw new LError(ECode.NOT_FOUND, e.message);
    }

    return result;
  }

  async getSummaryFrameworkStatus(jobCondition){
    const frameworkStatuses = await this.jobRecordModel.count({
      attributes:['job_state'],
      group:'job_state',
      where:jobCondition,
      raw:true
    });
    let summaryFrameworkStatus = {};
    Object.keys(Constants.FRAMEWORK_STATUS).forEach((statusKey)=>{
      frameworkStatuses.forEach((frameworkStatus)=>{
        if(frameworkStatus.job_state === statusKey){
          summaryFrameworkStatus[statusKey] = frameworkStatus.count;
        }
      });
      if(!summaryFrameworkStatus[statusKey]){
        summaryFrameworkStatus[statusKey] = 0;
      }
    });
    return summaryFrameworkStatus;
  }
}


module.exports = V1JobService;
