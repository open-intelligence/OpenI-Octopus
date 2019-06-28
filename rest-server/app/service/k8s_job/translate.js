

function to_web_format(framework){

    let state = translate_state(framework.status.state,framework.status.attemptStatus.completionStatus || {});

    let completed_time = null;

    if(framework.status.completionTime){
        completed_time = (new Date(framework.status.completedTime)).getTime();
    }
    let exit_code = null,exit_msg = "",exit_type = "";

    if(framework.status.attemptStatus.completionStatus){
        exit_code =  framework.status.attemptStatus.completionStatus.code;
        if(framework.status.attemptStatus.completionStatus){
            exit_msg = framework.status.attemptStatus.completionStatus.diagnostics;
            exit_type = (framework.status.attemptStatus.completionStatus.type || {}).name;
        }
    }

    let framework_name = framework.metadata.labels['job-name'];

    let job = {
        "name":framework_name,
        "jobStatus":{
            "username":framework.metadata.labels['platform-user'],
            "state":state,
            "subState": framework.status.state,
			"executionType": "START",
			"retries": framework.status.retryPolicyStatus.totalRetriedCount,
			"createdTime": (new Date(framework.status.startTime)).getTime(),
			"completedTime": completed_time,
			"appId": framework.metadata.uid,
			"appProgress": framework.status.attemptStatus.id,
			"appTrackingUrl":  "",
			"appLaunchedTime": (new Date(framework.status.attemptStatus.startTime)).getTime(),
			"appCompletedTime": completed_time,
			"appExitCode": exit_code,
			"appExitDiagnostics": exit_msg ,
			"appExitType": exit_type,
			"virtualCluster": framework.metadata.namespace
        },
        "taskRoles":{}
    }

    let task_roles = framework.status.attemptStatus.taskRoleStatuses || [];

    for(let i =0; i< task_roles.length ;i++){

        if(!task_roles[i].name || !task_roles[i].taskStatuses[0]){
            continue;
        }

        let task = task_roles[i].taskStatuses[0];

        let containerId = null;

        if(task.attemptStatus && task.attemptStatus.containerStatuses){
            let container = task.attemptStatus.containerStatuses[0] || {};
            containerId = container.containerID || "";

            containerId = containerId.replace("docker://","");

        }

        let temp = {
            "taskRoleStatus": {
                "name": task_roles[i].name
            },
            "taskStatuses": [{
                "taskIndex": task.index,
                "podUid":task.attemptStatus.podUID,
                "podIp":task.attemptStatus.podIP,
                "containerId":containerId,
                "containerIp": task.attemptStatus.podHostIP,
                "containerGpus": 128,
                "containerLog": ""
            }]
        };
        job.taskRoles[task_roles[i].name] = temp;

    }


    return job;
}

function translate_state(state,completionStatus){
    let waiting = ["attemptcreationpending","attemptcreationrequested","attemptpreparing"];
    let running = ["attemptrunning","attemptdeletionpending","attemptdeletionrequested","attemptdeleting"];
    let completed = ["attemptcompleted","completed"];

    let status = (state+"").toLowerCase();

    if(waiting.includes(status)){
        return "WAITING";
    }

    if(running.includes(status)){
        return "RUNNING";
    }

    if(completed.includes(status)){

        if((completionStatus.type || {}).name == "Failed"){
            return 'FAILED'
        }
        return "SUCCEEDED";
    }

    return "UNKNOWN";
}

function record_to_list_item(record){

    let job_detail = record.job_detail || {};
    job_detail.jobStatus = job_detail.jobStatus || {};

    let item = {
      "userId":record.user,
      "name":record.job_name,
      "state":record.job_state,
      "subState":job_detail.jobStatus.subState,
      "executionType":"START",
      "retries":job_detail.jobStatus.retries,
      "createdTime":job_detail.jobStatus.createdTime,
      "completedTime":job_detail.jobStatus.completedTime,
      "appExitCode":job_detail.jobStatus.appExitCode,
      "virtualCluster":job_detail.jobStatus.virtualCluster,
      "type":record.job_type,
    };

    return item;

}

function resourceInfo_to_list_item(record){

    let job_detail = record.job_detail || {};
    let job_config = record.job_config || {};
    job_detail.jobStatus = job_detail.jobStatus || {};

    let item = {
        "userId":record.user,
        "name":record.job_name,
        "state":record.job_state,
        "subState":job_detail.jobStatus.subState,
        "executionType":"START",
        "retries":job_detail.jobStatus.retries,
        "createdTime":job_detail.jobStatus.createdTime,
        "completedTime":job_detail.jobStatus.completedTime,
        "appExitCode":job_detail.jobStatus.appExitCode,
        "virtualCluster":job_detail.jobStatus.virtualCluster,
        "type":record.job_type,
        "taskRoles": job_config.taskRoles,
    };

    return item;

}


exports.resourceInfo_to_list_item = resourceInfo_to_list_item;
exports.record_to_list_item = record_to_list_item;
exports.to_web_format = to_web_format;
exports.translate_state = translate_state;
