const fs = require("fs");
const LError = require("../error/proto");
const ECode = require("../error/code");
const frame = require("../lib/framework");
const KubeClient = require("../utils/k8s_client");
const Service = require("egg").Service;

const k8s_job_utils = require("./k8s_job/utils");
const k8s_job_limit_check = require("./k8s_job/limit_check");
const k8s_job_translate = require("./k8s_job/translate");

const log_service_url = require("../third-service-apis/log-service");

const yaml = require("js-yaml");

class K8sJobService extends Service{
  constructor(...args){
    super(...args);
    this.userModel = this.app.model.User;
    this.jobRecordModel = this.app.model.JobRecord;
    this.organizationModel = this.app.model.Organization;
    this.jobPlatformModel = this.app.model.JobPlatform;

    const kube_config_file = yaml.safeLoad(fs.readFileSync(this.config.k8sConfigPath));

    const kube_config = {
      ca:kube_config_file.clusters[0].cluster["certificate-authority-data"],
      cert:kube_config_file.users[0].user['client-certificate-data'],
      key:kube_config_file.users[0].user["client-key-data"],
      server:kube_config_file.clusters[0].cluster.server
    };


    const app_config = {
      apiVersion:"frameworkcontroller.microsoft.com/v1",
      resourceType:"frameworks"
    }

    this.kube_client = new KubeClient(kube_config,app_config);

    this.log_service_address = log_service_url.config(this.config.logServiceUrl);

  }

  async loadUserJobLimit(){
    return {};
  }

  async getCheckLimit({userName}){
    const jobUserLimits = await this.loadUserJobLimit({ userName });
    const job_default_limits = await  this.service.common.getItem(this.app.config.commonKeys.jobConfig.limitKey);
    return Object.assign(job_default_limits || {}, jobUserLimits);
  }

  async resourceLimitCheck(job,userName){

    const jobLimits = await this.getCheckLimit({ userName });

    const jobResource = k8s_job_utils.computeJobResource(job, jobLimits);

    return k8s_job_limit_check.checkJobLimit(jobResource, jobLimits);

  }

  async _invokeFramework(framework){

    let result = await  this.kube_client.Create(framework.toJson());

    if(result.kind == "Status"){
      throw new LError(ECode.FAILURE,result.message);
    }

    return true;

  }

  async _get_framework_from_k8s(labels){

    let k8s_res = await this.kube_client.List(labels);

    let frameworks = k8s_res.items || [];

    let list = [];

    for(let i=0;i< frameworks.length; i++){

      let framework = k8s_job_translate.to_web_format(frameworks[i],this.config.logServiceUrl);

      list.push(framework);

    }

    return list;
  }

  async _get_framework_from_k8s_by_user(user){
    return await this._get_framework_from_k8s({"platform-user":user});
  }

  async _get_framework_from_k8s_by_jobname(jobName){
    return await this._get_framework_from_k8s({"job-name":jobName});
  }
  /*
  async _assign_log_address(job_detail){
     job_detail.jobStatus.appTrackingUrl = this.log_service_address.framework_log(job_detail.name);
     job_detail.taskRoles = job_detail.taskRoles || {};
     for(let name in job_detail.taskRoles){
         let task_role = job_detail.taskRoles[name];
         let task_role_status = task_role.taskStatuses || [];
         task_role_status.forEach(task => {
             task.containerLog = this.log_service_address.container_log(job_detail.name,task.containerId);
         });
     }
     return job_detail;
  }*/

  async _sync_framework(job){

    let completed = ['FAILED','SUCCEEDED','STOPPED'];

    if(completed.includes(job.job_state)){
      //this._assign_log_address(job.job_detail);
      return job.job_detail;
    }

    const k8s_jobs = await this._get_framework_from_k8s_by_jobname(job.job_name);

    let record = {};

    let job_detail = k8s_jobs[0];

    if (0 == k8s_jobs.length){

      job_detail = job.job_detail || {};
      job_detail.jobStatus  = job_detail.jobStatus || {};
      job_detail.jobStatus.state = "UNKNOWN";

    }

    record.job_detail = job_detail;
    record.job_state = job_detail.jobStatus.state;


    if(completed.includes(record.job_state)){

      let completed_at = null;

      if(job_detail.jobStatus.completedTime){
        try{
          completed_at = new Date(job_detail.jobStatus.completedTime);
        }catch(e){
          completed_at = new Date();
        }
      }else{
        completed_at = new Date();
      }

      record.job_detail.jobStatus.completedTime = completed_at.getTime();
      record.job_detail.jobStatus.appCompletedTime = completed_at.getTime();

    }

    //this._assign_log_address(record.job_detail);

    await job.update(record);

    return record.job_detail;

  }

  async _sync_frameworks(record_list){

    let list = [];

    for(let i=0 ;i< record_list.length;i++){

       let job = record_list[i];

       job.job_detail = await this._sync_framework(job);

       list.push(job);

    }

    return list;
  }

  async syncFrameworks(){
    let records = await this.jobRecordModel.findAll({where:{job_state:{[this.app.Sequelize.Op.notIn]:['FAILED','SUCCEEDED','STOPPED',"UNKNOWN"]}}});
    await this._sync_frameworks(records);
  }


  async stopFramework(jobName,data){

    const job =  await this.jobRecordModel.findOne({where: { job_name: jobName }});

    if (!job){
      return true;
    }

    if (data.username !== job.user && !data.admin) {
        throw new LError(ECode.OPERATION_FORBIDDEN, `User ${data.username} is not allowed to execute job ${jobName}.`);
    }

    let completed_at = new Date();

    let record = {
      job_state:"STOPPED",
      completed_at:completed_at
    }

    let job_detail = await this._sync_framework(job);

    if(job_detail && job_detail.jobStatus){
      job_detail.jobStatus.state = "STOPPED";
      job_detail.jobStatus.completedTime = completed_at.getTime();
      job_detail.jobStatus.appCompletedTime = completed_at.getTime();
      record.job_detail = job_detail;
    }

    await job.update(record);

    await this.kube_client.Delete(k8s_job_utils.format_framework_name(jobName));

    return true;

  }



  async getFramework(jobName){

    const record =  await this.jobRecordModel.findOne({where: { job_name: jobName }});

    if (!record){
      return null;
    }

    let job_detail = await this._sync_framework(record);

    job_detail.resource = record.resource_usage;

    job_detail.userinfo = {
      user:record.user,
      org_id:record.org_id
    };

    job_detail.config = record.job_config;

    return job_detail;

  }




  async runFramework(user_info,job){

    let job_record_old = await this.jobRecordModel.findOne({where:{job_name:job.jobName}});

    if(null != job_record_old){
       throw new LError(ECode.RESOURCES_OVERLOAD,`job ${job.jobName} is already exist!`);
    }

    let clusterId = this.config.clusterId || "default";

    k8s_job_limit_check.checkMinTaskNumber(job);


    await this._initFrameworkFolders(clusterId,user_info.user,job.jobName);


    const job_record = {
      job_name: job.jobName,
      job_type: job.gpuType,
      user: user_info.user,
      org_id: user_info.org_id,
      created_at: new Date(),
      resource_usage:k8s_job_utils.caculate_resource(job,["cpuNumber","gpuNumber","memoryMB"]),
      job_state:"WAITING",
      completed_at:new Date(),
      job_config:job,
      job_detail:{}
    };

    await this.jobRecordModel.upsert(job_record);

    let framework = frame.NewFrameWork();

    framework.Label("platform-user",user_info.user);
    framework.Label("job-type",job.gpuType);
    framework.Label("job-name",job.jobName);
    framework.Name(k8s_job_utils.format_framework_name(job.jobName));
    framework.Retry(job.retryCount || 0);

    let task_roles = job.taskRoles || [];

    for(let i=0;i<task_roles.length;i++){
        let role = task_roles[i];
        let task = frame.NewTaskRole();

        task.Name(role.name);
        task.MinFailed(role.minFailedTaskCount);
        task.MinSucceeded(role.minSucceededTaskCount);
        task.TaskNumber(role.taskNumber);

        let conatiner = frame.NewContainer();
        conatiner.Gpu(role.gpuNumber);
        conatiner.Cpu(role.cpuNumber);
        conatiner.Memory(role.memoryMB);
        conatiner.Command(role.command);
        conatiner.Image(job.image);

        conatiner.Mount(`/ghome/${user_info.user}`,"/userhome");
        conatiner.Mount(`/gmodel/${user_info.user}`,"/model-hub");
        conatiner.Mount("/gdata","/gdata",{readOnly:true});

        task.Container(conatiner);

        framework.AddTask(task);

    }

    return await this._invokeFramework(framework);

  }

  async _initFrameworkFolders(clusterId,userName,jobName){
    //ghome 已经挂载到各个机器上了

    await k8s_job_utils.promisefy(fs.mkdir)(this.config.userhomeBasePath+userName,{recursive:true});

    await k8s_job_utils.promisefy(fs.mkdir)(this.config.usermodelBasePath+userName,{recursive:true});

  }

  async _get_frameworks_by_user(username){

    let jobs = await this.jobRecordModel.findAll({where:{user:username},order: [['created_at','DESC']]});

    jobs = await this._sync_frameworks(jobs);

    return jobs.map(k8s_job_translate.record_to_list_item);
  }

  async _get_frameworks_resourceInfo_by_user(username){

    let jobs = await this.jobRecordModel.findAll({where:{user:username,job_state:{[this.app.Sequelize.Op.or]:["WAITING","RUNNING"]}},order: [['created_at','DESC']]});

    jobs = await this._sync_frameworks(jobs);

    return jobs.map(k8s_job_translate.resourceInfo_to_list_item);
  }

  async _get_all_frameworks(){

     let jobs = await this.jobRecordModel.findAll({order: [['created_at','DESC']]});

     jobs = await this._sync_frameworks(jobs);

     return jobs.map(k8s_job_translate.record_to_list_item);
  }

  async _get_all_raw_frameworks(){

        let jobs = await this.jobRecordModel.findAll();

        jobs = await this._sync_frameworks(jobs);

        return jobs.map(rawJob => rawJob.dataValues);
  }

  async getFrameworkResourceList({username}){
    return await this._get_frameworks_resourceInfo_by_user(username);
  }

  async getFrameworkList({username}){
    if(username){
      return await this._get_frameworks_by_user(username);
    }
    return await this._get_all_frameworks();
  }

  async getFrameworkConfig(jobName){

      let result = {};
      let gpuTypeAction="no_debug";
      try {

          let job = await this.jobRecordModel.findOne({where:{job_name:jobName}});

          if(job){
              result = job.job_config;
          }

          let jobPlatforms = await this.jobPlatformModel.findAll({

          });

          for(let jobTypePlatFormInfo of jobPlatforms)
          {
              if(jobTypePlatFormInfo.dataValues.platformKey === result.gpuType){
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

}


module.exports = K8sJobService;
