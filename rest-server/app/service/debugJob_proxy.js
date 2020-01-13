'use strict';

const Service = require('egg').Service;

const JobConfig_DB = Symbol('JobProxy#jobConfig_db');
const JobConfig_Types = Symbol('JobProxy#types');
const DebugJobRunning_Times = Symbol('JobProxy#debugJobRunningTimes');

class DebugJobProxyService extends Service {
  constructor(...args) {
    super(...args);
    this[JobConfig_DB] = this.app.jobConfigDB;
    this.K8sJobComponent = this.app.component.K8sJob;
  }

  get [JobConfig_Types]() {
    return 'types';
  }

  get [DebugJobRunning_Times]() {
    return 'debugRunningTimes';
  }

  get getJobConfigDB() {
    return this[JobConfig_DB].read();
  }

  async initDefaultData() {
    await this[JobConfig_DB].defaults(this.getJobConfigState()).write();
  }

  async sync() {
    await this.syncJobList();
  }

  async syncJobList() {
    
    const { service } = this;
    const Constants = this.K8sJobComponent.Constants

    const condition = { where: { job_type: 'debug' ,job_state: Constants.TASK_STATUS.RUNNING} };

    const jobList = await service.v1JobService._get_framework_list_from_database(condition);

    let lastJobConfigTypes = await this.getJobConfigTypes();

    lastJobConfigTypes = lastJobConfigTypes ? lastJobConfigTypes : {};

    let lastDebugJobRunningTimes = await this.getDebugJobRunningTimes();

    lastDebugJobRunningTimes = lastDebugJobRunningTimes ? lastDebugJobRunningTimes : {};

    // console.log("lastDebugJobRunningTimes",lastDebugJobRunningTimes);

    const { jobConfigTypes, debugJobRunningTimes } = await this.processUserJobs(jobList, lastJobConfigTypes,
      lastDebugJobRunningTimes);

    // console.log("new debugJobRunningTimes",debugJobRunningTimes);
    await this[JobConfig_DB].setState(this.getJobConfigState(jobConfigTypes, debugJobRunningTimes)).write();
    // console.timeEnd("syncDebugJobList");
  }

  getJobConfigState(jobConfigTypes = {}, jobRunningTimes = {}) {
    return {
      [this[JobConfig_Types]]: jobConfigTypes,
      [this[DebugJobRunning_Times]]: jobRunningTimes,
    };
  }

  async getJobConfigTypes() {
    const jobConfigDB = await this.getJobConfigDB;
    return await jobConfigDB.get(this[JobConfig_Types]).value();
  }

  async getDebugJobRunningTimes() {
    const jobConfigDB = await this.getJobConfigDB;
    return await jobConfigDB.get(this[DebugJobRunning_Times]).value();
  }

  async processUserJobs(jobs, jobConfigTypes, debugJobRunningTimes) {

    for (const job of jobs) {
      try {
        await this.processDebugJob(job, jobConfigTypes, debugJobRunningTimes);
      } catch (e) {
        // do nothing processDebugJob logic
        this.logger.error(e);
      }
    }

    return { jobConfigTypes, debugJobRunningTimes };
  }


  async processDebugJob(job, jobConfigTypes, debugJobRunningTimes) {
    const Constants = this.K8sJobComponent.Constants
    const jobId = job.job_id;

    const jobState = job.job_state;

    let jobConfigType = jobConfigTypes[jobId];

    if (!jobConfigType){

      jobConfigType = job.job_config.gpuType || job.job_config.kind;

      jobConfigType = jobConfigType != undefined ? jobConfigType.toLowerCase() : undefined;

      jobConfigTypes[jobId] = jobConfigType;
    }

    if(jobConfigType !== "debug" || jobState !== Constants.TASK_STATUS.RUNNING){
      return ;
    }

    if(!(jobId in debugJobRunningTimes)){
      await this.syncJobRunningTime(job,debugJobRunningTimes);
    }

    if( jobId in  debugJobRunningTimes){
      // if a running debug job have docker, watch time to stop it
      await this.stopOvertimeDebugJob(jobId, debugJobRunningTimes[jobId]);
    }
  }

  async syncJobRunningTime(job,debugJobRunningTimes){
    const jobId = job.job_id;
    
    const jobDetail = this.K8sJobComponent.convert.to_web_format(job.job_detail);
    // watch the running debug job when it have a docker
    const tokenLogsUrl = this.config.esService + '/_search';

    for(const taskname in jobDetail.taskRoles){

      const task = jobDetail.taskRoles[taskname];

      const firstContainer = task.taskStatuses[0];

      if(!firstContainer){
        continue;
      }

      const container = firstContainer.containerId;

      const request_opt  = {
        method:"POST",
        contentType:"json",
        data:{
          query: {
            match: {
              'log.file.path': '/var/lib/docker/containers/' +
                                      container + '/' + container + '-json.log',
            },
          },
          size: 100,
          from: 0,
          sort: 'log.offset',
        },
        dataType: 'json',
        timeout: 30000,
      };

      const rawLogResponse = await this.app.curl(tokenLogsUrl, request_opt);

      const logResponse = rawLogResponse.data;

      let found = false;

      if (logResponse.hits) {

        const pageLogList = logResponse.hits.hits;

        for (const logMsgObj of pageLogList) {

          const logMsgText = logMsgObj._source.message;
          const tokenRegex = /\?token=\S*/;
          const matchTokenArray = logMsgText.match(tokenRegex);
          if (matchTokenArray) {
            debugJobRunningTimes[jobId] = Date.now();
            found = true;
            break;
          }
        }
      }

      if(found === true){
        break;
      }
  }

  }


  async stopOvertimeDebugJob(jobId, debugJobRunningTime) {
    
    const nowTimeStamp = Date.now();
    const span = nowTimeStamp - debugJobRunningTime;
    const debugJobDuration = this.config.jobConfigDB.debugJobDurationMsec;
    if (span > debugJobDuration) {
      const condition = { where: { job_id: jobId } };
      await this.service.v1JobService._stop_taskset(condition,"stop debug job because of timeout");
    }
  }
}

module.exports = DebugJobProxyService;
