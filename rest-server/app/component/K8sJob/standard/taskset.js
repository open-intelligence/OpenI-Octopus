"use strict"

const Constants = require("../constants");

function convert_state(state) {
    const status = (state + '').toLowerCase();

    if (status == "waiting"){
        return Constants.TASK_STATUS.WAITING;
    }

    if (status == "running"){
        return  Constants.TASK_STATUS.RUNNING;
    }

    if (status == "failed"){
        return  Constants.TASK_STATUS.FAILED;
    }

    if (status == "succeeded"){
        return  Constants.TASK_STATUS.SUCCEEDED;
    }

    return Constants.TASK_STATUS.UNKNOWN;
}


function convert(taskset){
    taskset.metadata = taskset.metadata || {};
    taskset.metadata.labels = taskset.metadata.labels || {};
    taskset.status = taskset.status || {};
    taskset.status.roleStatus = taskset.status.roleStatus || [];
    

    const template = {
        version:"v1",
        job:{
            id: taskset.metadata.name,
            name:taskset.metadata.labels[Constants.K8S_JOB_NAME_LABEL_KEY],
            type: taskset.metadata.labels[Constants.K8S_JOB_TYPE_LABEL_KEY],
            state: convert_state(taskset.status.state),
            userId: taskset.metadata.labels[Constants.K8S_USER_LABEL_KEY],
            startAt: taskset.status.startAt,
            finishedAt: taskset.status.finishAt,
            totalRetriedCount: taskset.status.totalRetriedCount,
            exitCode: 0,
            exitDiagnostics: taskset.status.stateMessage
        },
        cluster:{
            identity:"",
        },
        tasks:[],
        platformSpecificInfo:{
            platform:"k8s",
            apiVersion: taskset.apiVersion,
            namespace: taskset.metadata.namespace,
            taskRuntimeInfo:[]
        }
    };

    if(!taskset.spec){
       return template;
    }

    const taskRoles = taskset.spec.roles || [];
    const taskRolesStatus = taskset.status.roleStatus || [];

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

        const container_config = role_config.template.spec.containers[0] || {};

        const task_template = {
            name: role_name,  
            image: container_config.image,  
            command: container_config.command,  
            replicaAmount:role_config.taskNumber,  
            minFailedTaskCount:role_config.completionPolicy.maxFailed,  
            minSucceededTaskCount: role_config.completionPolicy.minSucceeded, 
            resource: container_config.resources.limits || {},
            replicas:[]
        };

        const platform_task_info = {
            name: role_name,
            nodeSelector:role_config.template.spec.nodeSelector,
            initContainerImage: (role_config.template.spec.initContainers || [{}])[0].image,
            replicas:[],
            volumeMounts:[],
            state:role_status.state
        };

        const replica_status_list = role_status.replicaStatus || [];

        for(let i=0;i<replica_status_list.length;i++){

            let replica_status = replica_status_list[i];
            let terminated_info = replica_status.terminatedInfo || {
              exitCode: null,
              exitMessage: "",
              reason: "",
              signal: null
            };
            
            let replica = {
                index: replica_status.index,  
                state:replica_status.phase,  
                retriedCount: replica_status.totalRetriedCount, 
                startAt: replica_status.startAt,  
                finishedAt: replica_status.finishAt,  
                containerID: replica_status.containerID,  
                containerHostIP: replica_status.podHostIP,  
                containerLogAddress:"", 
                exitCode: terminated_info.exitCode,  
                exitDiagnostics: terminated_info.exitMessage  
            };


            task_template.replicas.push(replica);

            let platform_replica_info = {
                index:replica_status.index,
                podIP: replica_status.podIP,
                podUID: replica_status.podUID,
                podName: replica_status.podName,
                podHostIP:replica_status.podHostIP,
                podReason:replica_status.podReason,
                phaseMessage: replica_status.phaseMessage,
                stopped:replica_status.stopped
            };

            platform_task_info.replicas.push(platform_replica_info);
        }

        template.tasks.push(task_template);

        if(Array.isArray(container_config.volumeMounts)){

            let volumes = role_config.template.spec.volumes || [];
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

exports.convert  = convert;