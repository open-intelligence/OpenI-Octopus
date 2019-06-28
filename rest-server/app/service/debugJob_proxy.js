'use strict';

const Service = require('egg').Service;

const JobConfig_DB = Symbol('JobProxy#jobConfig_db');
const JobConfig_Types = Symbol('JobProxy#types');
const DebugJobRunning_Times = Symbol('JobProxy#debugJobRunningTimes');

class DebugJobProxyService extends Service {
    constructor(...args) {
        super(...args);
        this[JobConfig_DB] = this.app.jobConfigDB;
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
        //console.time("syncDebugJobList");
        const { service } = this;

        const jobList = await service.k8sJobService._get_all_raw_frameworks();
        let lastJobConfigTypes = await this.getJobConfigTypes();
        lastJobConfigTypes = lastJobConfigTypes?lastJobConfigTypes:{};
        let lastDebugJobRunningTimes = await this.getDebugJobRunningTimes();
        lastDebugJobRunningTimes = lastDebugJobRunningTimes?lastDebugJobRunningTimes:{};
        //console.log("lastDebugJobRunningTimes",lastDebugJobRunningTimes);
        const {jobConfigTypes,debugJobRunningTimes} = await this.processUserJobs(jobList,lastJobConfigTypes,
            lastDebugJobRunningTimes);
        //console.log("new debugJobRunningTimes",debugJobRunningTimes);
        await this[JobConfig_DB].setState(this.getJobConfigState(jobConfigTypes,debugJobRunningTimes)).write();
        //console.timeEnd("syncDebugJobList");
    }

    getJobConfigState(jobConfigTypes = {},jobRunningTimes={}) {
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

    async processUserJobs(jobs,jobConfigTypes,debugJobRunningTimes) {

        for (const job of jobs) {
            try{
                await this.processDebugJob(job,jobConfigTypes,debugJobRunningTimes);
            }catch (e) {
            //do nothing processDebugJob logic
                this.logger.error(e);
            }
        }

        return {jobConfigTypes,debugJobRunningTimes};
    }

    async processDebugJob(job,jobConfigTypes,debugJobRunningTimes) {
            let jobDetail = job.job_detail;

            let jobName = jobDetail.name;
            let jobState = jobDetail.jobStatus.state;
            let jobExecutionType = jobDetail.jobStatus.executionType;

            let jobConfigType = undefined;

            if(jobConfigTypes[jobName])
            {
                jobConfigType = jobConfigTypes[jobName];
            }else{

                jobConfigType = job.job_config.gpuType;

                jobConfigTypes[jobName] = jobConfigType;
            }

            if(jobConfigType === 'debug' && jobState ==='RUNNING' && jobExecutionType ==='START'){

                if(debugJobRunningTimes[jobName]) {
                    //if a running debug job have docker, watch time to stop it
                    await this.stopOvertimeDebugJob(jobName,debugJobRunningTimes[jobName]);
                }else{
                    //watch the running debug job when it have a docker

                    for (let taskname in jobDetail.taskRoles) {
                        let task = jobDetail.taskRoles[taskname];
                        let firstContainer = task.taskStatuses[0];
                        if (firstContainer) {
                            let tokenLogsUrl = "http://"+this.config.APIGateWayIP + "/es/_search";

                            let container = firstContainer.containerId;

                            const rawLogResponse = await this.app.curl(tokenLogsUrl, {
                                // 必须指定 method
                                method: 'POST',
                                // 通过 contentType 告诉 HttpClient 以 JSON 格式发送
                                contentType: 'json',
                                data: {
                                    query: {
                                        match:{
                                            "log.file.path": "/var/lib/docker/containers/"+
                                            container+"/"+container+"-json.log"
                                        }
                                    },
                                    size: 100,
                                    from: 0,
                                    sort: "log.offset"
                                },
                                // 明确告诉 HttpClient 以 JSON 格式处理返回的响应 body
                                dataType: 'json',
                                timeout:30000
                            });

                            let logResponse = rawLogResponse.data;

                            if(logResponse.hits)
                            {
                                let pageLogList = logResponse.hits.hits;
                                for(let logMsgObj of pageLogList)
                                {
                                    let logMsgText = logMsgObj._source.message;
                                    let tokenRegex = /\?token=\S*/;
                                    let matchTokenArray = logMsgText.match(tokenRegex);
                                    if(matchTokenArray){
                                        debugJobRunningTimes[jobName] = Date.now();
                                    }
                                }
                            }
                        }
                        break;
                    }
                }
            }


    }

    async stopOvertimeDebugJob(jobName,debugJobRunningTime){
        let nowTimeStamp = Date.now();
        let span = nowTimeStamp - debugJobRunningTime;
        let debugJobDuration = this.config.jobConfigDB.debugJobDurationMsec;
        if(span > debugJobDuration)
        {
            await this.service.k8sJobService.stopFramework(jobName,{username:"admin",admin:true});
        }
    }
}

module.exports = DebugJobProxyService;
