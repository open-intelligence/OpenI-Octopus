'use strict';

const fs = require('fs');
const utils = require('util');
const uuidv1 = require('uuid/v1');
const { BaseJobService, ECode, LError } = require('../../lib');


class V1JobService extends BaseJobService {

  constructor(...args) {
    super(...args);
    this.K8sJobComponent = this.app.component.K8sJob;
    this.LibTaskSet = this.app.component.LibTaskSet;
    this.jobPlatformModel = this.app.model.JobPlatform;
    this.images = {
      poddiscovery:this.config.dockerImages.poddiscovery
    };
  }

  async runFramework(user_info, job) {
    const libTaskSet = this.LibTaskSet
    , Constants = this.K8sJobComponent.Constants;

    const clusterId = this.config.clusterId || 'default';

    this.K8sJobComponent.utils.checkMinTaskNumber(job);

    await this._initFolders(clusterId, user_info.username, job.jobName);

    const job_id = uuidv1();

    const podgroup = libTaskSet.NewPodGroup();

    const taskset = libTaskSet.NewTaskSet();

    taskset.SetName(job_id);

    taskset.SetConfig(job);

    taskset.SetLabel(Constants.K8S_ORG_ID_LABEL_KEY, user_info.org_id);
    taskset.SetLabel(Constants.K8S_USER_LABEL_KEY, user_info.user_id);
    taskset.SetLabel(Constants.K8S_JOB_TYPE_LABEL_KEY, job.gpuType);
    taskset.SetLabel(Constants.K8S_JOB_NAME_LABEL_KEY, job.jobName);

    taskset.SetRetryAmount(job.retryCount || 0);

    podgroup.SetName(taskset.GetName());

    const task_roles = job.taskRoles || [];

    let minMember = 0;

    for (let i = 0; i < task_roles.length; i++) {

      const role = task_roles[i];

      const task = libTaskSet.NewRole();

      task.SetName(role.name);
      task.SetAnnotation("scheduling.k8s.io/group-name",podgroup.GetName());
      task.SetSchedulerName("kube-batch");
      task.SetMaxFailed(role.minFailedTaskCount);
      task.SetMinSucceeded(role.minSucceededTaskCount);
      task.SetReplicaAmount(role.taskNumber);

      minMember += role.taskNumber;

      let gpuType = (job.gpuType+"").toLowerCase();

      if(gpuType == "debug_cpu"){
        gpuType = "debug";
      }

      task.SetNodeSelector('resourceType', gpuType);

      const container = libTaskSet.NewContainer();

      container.SetCustomResource('nvidia.com/gpu', role.gpuNumber);
      container.SetCpu(role.cpuNumber);
      container.SetMemoryMb(role.memoryMB);
      container.SetCommand('sleep 10;' + role.command);
      container.SetImage(job.image);

      container.Mount(libTaskSet.NewHostPathVolume().SetMountFrom(`/ghome/${user_info.username}`).SetMountTo('/userhome'));
      container.Mount(libTaskSet.NewHostPathVolume().SetMountFrom(`/gmodel/${user_info.username}`).SetMountTo('/model-hub'));
      
      container.Mount(libTaskSet.NewHostPathVolume().SetMountFrom('/gdata').SetMountTo('/gdata')
        .SetReadOnly(true));

      const share_hosts_from = `/ghome/${user_info.username}/share_hosts/${job_id}`;
      const share_hosts_temp_from = `/ghome/${user_info.username}/share_hosts/${job_id}.json`;

      container.Mount(libTaskSet.NewHostPathVolume().SetMountFrom(share_hosts_from).SetMountTo("/etc/hosts").SetReadOnly(true).SetType("FileOrCreate"));

      const initcontainer_sharehosts = libTaskSet.NewContainer();
      initcontainer_sharehosts.SetCommand("/app/poddiscovery");
      initcontainer_sharehosts.Mount(libTaskSet.NewHostPathVolume().SetMountFrom(share_hosts_from).SetMountTo("/etc/hosts").SetType("FileOrCreate"));
      initcontainer_sharehosts.Mount(libTaskSet.NewHostPathVolume().SetMountFrom(share_hosts_temp_from).SetMountTo("/etc/hosts_json.json").SetType("FileOrCreate"));
      initcontainer_sharehosts.SetImage(this.images.poddiscovery);

      task.AddInitContainer(initcontainer_sharehosts);
     　　
      task.SetContainer(container);
     　
      taskset.AddRole(task);
    }

    podgroup.SetMinMember(minMember);

    return await this._invoke_taskset(taskset,podgroup);

  }

  async _initFolders(clusterId, userName) {

    // ghome 已经挂载到各个机器上了

    await utils.promisify(fs.mkdir)(`/ghome/${userName}/share_hosts`, { recursive: true });

    await utils.promisify(fs.mkdir)(`/gmodel/${userName}`, { recursive: true });

  }

  async stopFramework(job_id, user_id) {

    const condition = { where: { job_id } };

    if (user_id) {
      condition.where.user_id = user_id;
    }

    return await this._stop_taskset(condition);

  }

  async getFramework(job_id, user_id) {

    const condition = { where: { job_id } };

    if (user_id) {
      condition.where.user_id = user_id;
    }

    const record = await this._get_taskset(condition);

    if (!record) {
      return null;
    }

    const job_detail = this.K8sJobComponent.convert.to_web_format(record.job_detail);

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

    const framework_list = await this._get_taskset_list(condition);

    const total_size = await this._query_total_size_from_database(total_size_condition)

    return {
      total_size:total_size,
      jobs:framework_list.map(this.K8sJobComponent.convert.record_to_list_item)
    }
  }

  async getWaitingAndRunningFrameworks(user_id){

      const condition = {where:{job_state:{[this.app.Sequelize.Op.or]:["WAITING","RUNNING"]}},order: [['created_at','DESC']]};

      if(user_id){
          condition.where.user_id = user_id;
      }

      const framework_list = await this._get_taskset_list(condition);

      return framework_list.map(this.K8sJobComponent.convert.resourceInfo_to_list_item);
  }

  async getFrameworkConfig(job_id, user_id) {

    const condition = { where: { job_id }, order: [[ 'created_at', 'DESC' ]] };

    if (user_id) {
      condition.where.user_id = user_id;
    }

    let result = null;

    let gpuTypeAction = 'no_debug';

    try {

      const job = await this._get_taskset_from_database(condition);

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
    Object.keys(this.K8sJobComponent.Constants.TASK_STATUS).forEach((statusKey)=>{
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
