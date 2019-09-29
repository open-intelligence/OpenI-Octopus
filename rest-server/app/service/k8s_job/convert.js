'use strict';

const Constants = require("./constants");

function to_web_format(framework) {

    var start_time = new Date(framework.job.startAt);
    var finishedAt =  null;

    if(framework.job.finishedAt){
        finishedAt = new Date(framework.job.finishedAt);
    }else{
        finishedAt = new Date();
    }
   
    const job = {
        id: framework.job.id,
        name: framework.job.name,
        platform:framework.platformSpecificInfo.platform,
        jobStatus: {
            username: framework.job.userId,
            state: framework.job.state,
            subState: framework.job.state,
            executionType: 'START',
            retries: framework.job.totalRetriedCount,
            createdTime:  start_time.getTime(),
            completedTime: finishedAt.getTime(),
            appId:  null,
            appProgress: "",
            appTrackingUrl: '',
            appLaunchedTime: start_time.getTime(),
            appCompletedTime: finishedAt.getTime(),
            appExitCode: framework.job.exitCode,
            appExitDiagnostics: framework.job.exitDiagnostics,
            appExitType: null,
            virtualCluster: framework.cluster.identity,
        },
        taskRoles: {},
    };

    if("yarn" == job.platform){
        job.jobStatus.appId = framework.platformSpecificInfo.applicationId;
    }

    if("k8s" == job.platform){
        job.jobStatus.appId = framework.platformSpecificInfo.instanceUID;
    }

    const task_roles = framework.tasks || [];

    for (let i = 0; i < task_roles.length; i++) {

        let role = task_roles[i];

        const temp = {
            taskRoleStatus: {
                name: role.name,
            },
            taskStatuses: []
        };

        for (let j = 0; j < role.replicas.length; j++) {

            let replica = role.replicas[j];
            let c_id = null;
            if(replica.containerID){
                c_id = replica.containerID.replace('docker://', '');
            }
            temp.taskStatuses.push({
                taskIndex: replica.index,
                podUid: null,
                podIp: replica.containerHostIP,
                containerId: c_id,
                containerIp: replica.containerHostIP,
                containerGpus: "",
                containerLog: replica.containerLogAddress,
            })
        }

        temp.taskStatuses = temp.taskStatuses.sort((a, b) =>{
            if (a.taskIndex > b.taskIndex) {
                return 1;
            }
            if (a.taskIndex < b.taskIndex) {
                return - 1;
            }
            return 0;
        });

        job.taskRoles[role.name] = temp;

    }

    let taskRuntimeInfo = framework.platformSpecificInfo.taskRuntimeInfo || [];

    for (let i = 0; i < taskRuntimeInfo.length; i++) {
        
        let role = taskRuntimeInfo[i];

        if (false == (role.name in job.taskRoles)) {
            continue;
        }

        let replicas = role.replicas.sort((a, b) =>{
            if (a.index > b.index) {
                return 1;
            }
            if (a.index < b.index) {
                return - 1;
            }
            return 0;
        });

        for (let j = 0; j < replicas.length && j < job.taskRoles[role.name].taskStatuses.length; j++) {
            job.taskRoles[role.name].taskStatuses[j].podUid = replicas[j].podUID;
            job.taskRoles[role.name].taskStatuses[j].podIp = replicas[j].podIP;
        }
    }

    return job;
}
 

function record_to_list_item(record) {
    const startAt = new Date(record.created_at);
    let finishedAt = null;

    if(record.job_detail.job.finishedAt){
        finishedAt = new Date(record.job_detail.job.finishedAt);
    }else{
        finishedAt = new Date();
    }

    const item = {
        id: record.job_id,
        name: record.job_name,
        platform: record.job_detail.platformSpecificInfo.platform,
        userId: record.user_id,
        taskRoleDetailInfo: {},
        state: record.job_state,
        subState: '',
        executionType: 'START',
        retries: record.job_detail.job.totalRetriedCount,
        createdTime: startAt.getTime(),
        completedTime: finishedAt.getTime(),
        appExitCode: record.job_detail.job.exitCode,
        virtualCluster: 'default',
        type: record.job_type,
    };

    let tasks = (record.job_detail || {}).tasks || [];

    for (let i = 0; i < tasks.length; i++) {
        let task = tasks[i];
        const it = {
            taskStatuses: {
                taskRoleName: task.name,
                taskStatusArray: [],
            },
            taskRoleStatus: {
                taskRoleName: task.name,
            },
        };

        for (let k = 0; k < task.replicas.length; k++) {
            let replica = task.replicas[k];

            if(!replica.finishedAt && Constants.FRAMEWORK_STATUS.STOPPED === record.job_state){
                replica.finishedAt = finishedAt;
            }

            let c_info = {
                taskIndex: replica.index,
                containerLaunchedTimestamp: replica.startAt,
                containerIp: replica.containerHostIP,
                taskCreatedTimestamp: replica.startAt,
                taskState: replica.state,
                taskRoleName: task.name,
                containerCompletedTimestamp: replica.finishedAt,
            };

            it.taskStatuses.taskStatusArray.push(c_info);

        }

        item.taskRoleDetailInfo[task.name] = it;

    }

    return item;

}

function resourceInfo_to_list_item(record) {

    let job_detail = record.job_detail || {};
    let job_config = record.job_config || {};
    job_detail.job = job_detail.job || {};

    let item = {
        "userId": record.user_id,
        "name": record.job_name,
        "state": record.job_state,
        "subState": job_detail.job.state,
        "executionType": "START",
        "retries": job_detail.job.totalRetriedCount,
        "createdTime": record.created_at,
        "completedTime": job_detail.job.finishedAt,
        "appExitCode": job_detail.job.exitCode,
        "virtualCluster": job_detail.cluster.identity,
        "type": record.job_type,
        "taskRoles": job_config.taskRoles,
    };

    return item;

}

exports.resourceInfo_to_list_item = resourceInfo_to_list_item;
exports.record_to_list_item = record_to_list_item;
exports.to_web_format = to_web_format;
