"use strict"

const Constants = require("../constants")

/**
 * 
 * @param {String} state 
 * @param {Object} completionStatus 
 * @return {String}
 * @api private
 */
function convert_state(state, completionStatus) {

    const waiting = ['attemptcreationpending', 'attemptcreationrequested', 'attemptpreparing'];
    const running = ['attemptrunning', 'attemptdeletionpending', 'attemptdeletionrequested', 'attemptdeleting'];
    const completed = ['attemptcompleted', 'completed'];

    const status = (state + '').toLowerCase();

    if (waiting.includes(status)) {
        return Constants.FRAMEWORK_STATUS.WAITING;
    }

    if (running.includes(status)) {
        return Constants.FRAMEWORK_STATUS.RUNNING;
    }

    if (completed.includes(status)) {

        if ((completionStatus.type || {}).name === 'Failed') {

            return Constants.FRAMEWORK_STATUS.FAILED;
        }

        return Constants.FRAMEWORK_STATUS.SUCCEEDED;
    }

    return Constants.FRAMEWORK_STATUS.UNKNOWN;
}

/**
 * convert job detail which is from k8s to standard format
 * @param {JSON} job_info 
 * @return {JSON} template
 * @api public
 */
function convert(job_info){
    job_info.metadata = job_info.metadata || {};
    job_info.metadata.labels = job_info.metadata.labels || {};
    job_info.status = job_info.status || {};
    job_info.status.attemptStatus = job_info.status.attemptStatus || {};
    job_info.status.attemptStatus.completionStatus = job_info.status.attemptStatus.completionStatus || {};
    job_info.status.retryPolicyStatus = job_info.status.retryPolicyStatus || {totalRetriedCount:0};

    const state = convert_state(job_info.status.state,job_info.status.attemptStatus.completionStatus)

    const template = {
        version:"v1",
        job:{
            id: job_info.metadata.name,
            name:job_info.metadata.labels[Constants.K8S_JOB_NAME_LABEL_KEY],
            type: job_info.metadata.labels[Constants.K8S_JOB_TYPE_LABEL_KEY],
            state: state,
            userId: job_info.metadata.labels[Constants.K8S_USER_LABEL_KEY],
            startAt: job_info.status.attemptStatus.startTime,
            finishedAt: job_info.status.attemptStatus.completionTime ,
            totalRetriedCount: job_info.status.retryPolicyStatus.totalRetriedCount,
            exitCode: job_info.status.attemptStatus.completionStatus.code,
            exitDiagnostics: job_info.status.attemptStatus.completionStatus.diagnostics
        },
        cluster:{
            identity:"",
        },
        tasks:[],
        platformSpecificInfo:{
            platform:"k8s",
            apiVersion: job_info.apiVersion,
            namespace: job_info.metadata.namespace,
            instanceUID: job_info.status.attemptStatus.instanceUID,
            configMapUID: job_info.status.attemptStatus.configMapUID,
            configMapName: job_info.status.attemptStatus.configMapName,
            taskRuntimeInfo:[]
        }
    };
    if(!job_info.spec){
       return template;
    }
    const taskRoles = job_info.spec.taskRoles || [];
    const taskRolesStatus = job_info.status.attemptStatus.taskRoleStatuses || [];

    const task_role_list = {};
    
    for(let i=0;i< taskRoles.length;i++){
        let role = taskRoles[i];
        task_role_list[role.name] = task_role_list[role.name] || {};
        task_role_list[role.name].config = role;
    }

    for(let i=0;i< taskRolesStatus.length;i++){
        let status = taskRolesStatus[i];
        task_role_list[status.name] =  task_role_list[status.name] || {};
        task_role_list[status.name].status = status;
    }

    for(let role_name in task_role_list){
        
        let role = task_role_list[role_name];

        if(!role.config || !role.status){
            continue;
        }

        let role_config = role.config, role_status = role.status;

        const container_config = role_config.task.pod.spec.containers[0] || {};

        const task_template = {
            name: role_name,  
            image: container_config.image,  
            command: container_config.command,  
            replicaAmount:role_config.taskNumber,  
            minFailedTaskCount:role_config.frameworkAttemptCompletionPolicy.minFailedTaskCount,  
            minSucceededTaskCount: role_config.frameworkAttemptCompletionPolicy.minSucceededTaskCount, 
            resource: container_config.resources.limits || {},
            replicas:[]
        };

        const platform_task_info = {
            name: role_name,
            nodeSelector:role_config.task.pod.spec.nodeSelector,
            initContainerImage: (role_config.task.pod.spec.initContainers || [{}])[0].image,
            replicas:[],
            volumeMounts:[]
        };

        const taskStatuses = role_status.taskStatuses || [];

        for(let i=0;i<taskStatuses.length;i++){

            let task_status = taskStatuses[i];
            let completionStatus = task_status.attemptStatus.completionStatus || {code:null,diagnostics:""};
            
            let replica = {
                index: task_status.index,  
                state:task_status.state,  
                retriedCount: task_status.retryPolicyStatus.totalRetriedCount, 
                startAt: task_status.startTime,  
                finishedAt: task_status.completionTime,  
                containerID: null,  
                containerHostIP: task_status.attemptStatus.podHostIP,  
                containerLogAddress:"", 
                exitCode: completionStatus.code,  
                exitDiagnostics: completionStatus.diagnostics  
            };

            if(task_status.attemptStatus.containerStatuses && task_status.attemptStatus.containerStatuses.length > 0){
                replica.containerID = task_status.attemptStatus.containerStatuses[0].containerID;
            }


            task_template.replicas.push(replica);

            let platform_replica_info = {
                index:task_status.index,
                podIP: task_status.attemptStatus.podIP,
                podUID: task_status.attemptStatus.podUID,
                podName: task_status.attemptStatus.podName,
                podHostIP:task_status.attemptStatus.podHostIP
            };

            platform_task_info.replicas.push(platform_replica_info);
        }

        template.tasks.push(task_template);

        if(Array.isArray(container_config.volumeMounts)){

            let volumes = role_config.task.pod.spec.volumes || [];
            let volume_map = {};
    
            for(let i=0;i< volumes.length;i++){
                volume_map[volumes[i].name] = volumes[i];
            }

            for(let i=0;i<container_config.volumeMounts.length;i++){
                let volume = container_config.volumeMounts[i];
                if(!volume_map[volume.name]){
                    continue;
                }
                let obj = Object.assign({},volume,volume_map[volume.name]);
                platform_task_info.volumeMounts.push(obj);
            }
        }

        template.platformSpecificInfo.taskRuntimeInfo.push(platform_task_info);
        
    }

    return template;
}


exports.convert = convert;