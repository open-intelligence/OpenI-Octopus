// Copyright (c) Microsoft Corporation
// All rights reserved.
//
// MIT License
//
// Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated
// documentation files (the "Software"), to deal in the Software without restriction, including without limitation
// the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and
// to permit persons to whom the Software is furnished to do so, subject to the following conditions:
// The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING
// BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
// NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

import { routerRedux } from 'dva/router';
import * as apiService from '@/services/api';

import { getAuthority } from '@/utils/authority';
import {stringify} from "qs";
import { getPageQuery,getSshFileExt } from '@/utils/utils';

import {formatMessage } from 'umi/locale';

const getHumanizedJobStateString = (jobInfo) => {
    let hjss = '';
    if (jobInfo.state === 'JOB_NOT_FOUND') {
        hjss = 'N/A';
    } else if (jobInfo.state === 'WAITING') {
        if (jobInfo.executionType === 'STOP') {
            hjss = 'Stopping';
        } else {
            hjss = 'Waiting';
        }
    } else if (jobInfo.state === 'RUNNING') {
        if (jobInfo.executionType === 'STOP') {
            hjss = 'Stopping';
        } else {
            hjss = 'Running';
        }
    } else if (jobInfo.state === 'SUCCEEDED') {
        hjss = 'Succeeded';
    } else if (jobInfo.state === 'FAILED') {
        hjss = 'Failed';
    } else if (jobInfo.state === 'STOPPED') {
        hjss = 'Stopped';
    } else {
        hjss = 'Unknown';
    }
    return hjss;
};


const getHumanizedStateString = (state) => {
    let hjss = '';
    if (state === 'JOB_NOT_FOUND') {
        hjss = 'N/A';
    } else if (state === 'WAITING') {
        hjss = 'Waiting';
    } else if (state === 'RUNNING') {
        hjss = 'Running';
    } else if (state === 'SUCCEEDED') {
        hjss = 'Succeeded';
    } else if (state === 'FAILED') {
        hjss = 'Failed';
    } else if (state === 'STOPPED') {
        hjss = 'Stopped';
    } else {
        hjss = 'Unknown';
    }
    return hjss;
};


const getDurationInSeconds = (startTime, endTime) => {
    if (startTime == null) {
        return 0;
    }
    if (endTime == null) {
        endTime = Date.now();
    }
    return Math.round(Math.max(0, endTime - startTime) / 1000);
};


const getFormat = (str) => {
    return str < 10 ? '0' + str : str;
};

const getDate = (times) => {
    let time = new Date(times);
    let year = time.getFullYear();
    let month = time.getMonth() + 1;
    let date = time.getDate();
    let hour = time.getHours() < 12 ? `${getFormat(time.getHours())}` : `${getFormat(time.getHours())}`;
    let minutes = time.getMinutes();
    let seconds = time.getSeconds();
    return `${year}/${getFormat(month)}/${getFormat(date)} ${hour}:${getFormat(minutes)}:${getFormat(seconds)}`;
};

const convertTime = (elapsed, startTime, endTime) => {
    if (startTime) {
        if (elapsed) {
            const elapsedTime = getDurationInSeconds(startTime, endTime);
            // TODO: find a better way to humanize elapsedTime.
            // return moment.duration(elapsedTime, "seconds").humanize();
            let result = '';
            const elapsedDay = parseInt(elapsedTime / (24 * 60 * 60));
            if (elapsedDay > 0) {
                result += elapsedDay + 'd ';
            }
            const elapsedHour = parseInt((elapsedTime % (24 * 60 * 60)) / (60 * 60));
            if (result != '' || (result == '' && elapsedHour > 0)) {
                result += elapsedHour + 'h ';
            }
            const elapsedMinute = parseInt(elapsedTime % (60 * 60) / 60);
            if (result != '' || (result == '' && elapsedMinute > 0)) {
                result += elapsedMinute + 'm ';
            }
            const elapsedSecond = parseInt(elapsedTime % 60);
            result += elapsedSecond + 's';
            return result;
        } else {
            return getDate(startTime);
        }
    } else {
        return '--';
    }
};


const convertGpu = (gpuAttribute) => {
    const bitmap = (+gpuAttribute).toString(2);
    const gpuList = [];
    for (let i = 0; i < bitmap.length; i++) {
        if (bitmap[i] === '1') {
            gpuList.push('#' + (bitmap.length - i - 1).toString());
        }
    }
    if (gpuList.length > 0) {
        gpuList.reverse();
        return gpuList.join(',');
    } else {
        return 'None';
    }
};

const initState = {
    loading:true,
    jobId:'',
    jobName:'',
    //jobMetricsPageUrl:'javascript:void(0);',
    jobTerminalUrl:'javascript:void(0);',
    jobStatus:{},
    appLaunchedTimeString:'',
    appCompletedTimeString:'',
    appExitDiagnosticsString:'',
    showConfigModal:false,
    configDisable:true,
    configInfo:{},
    showAppSummaryModal:false,
    gpuType:'',
    sshDisable:true,
    job:{},
    jobs:[],
    tasks:[],
    gpuTypeAction:"no_debug",
    currentTask:{},
    currentUser:{},
    visiableCommitImageModel:false,
};

export default {
    namespace: 'job',

    state: {
        ...initState
    },

    effects: {
        *loadJob({payload}, { call, put }) {

            yield put({
                type: 'resetState',
            });

            const onFailed = payload && payload.onFailed ? payload.onFailed : function onFailed(){};

            const params = getPageQuery();

            //console.log("loadJob params",params);
            let { jobId } = params;

            let sshDisable = true;

            //console.log("sshContainerInfo",sshContainerInfo);

            const response = yield call(apiService.loadJob,{jobId});

            //console.log("loadJob",response);

            let jobs=[];
            let tasks=[];
            let appLaunchedTimeString='';
            let appCompletedTimeString='';
            let appExitDiagnosticsString='';
            let configDisable=true;
            let configInfo={};

            if(response.success)
            {

                //console.log("response",response);
                let userid = response.job.userinfo.user;
                let jobStatus = response.job.jobStatus;

                if(jobStatus.state!=="RUNNING"){
                    sshDisable=true;
                }


                if(jobStatus.appTrackingUrl){
                    jobStatus.appTrackingUrl = __WEBPORTAL__.logServiceUri + jobStatus.appTrackingUrl;
                }

                appLaunchedTimeString = convertTime(false, jobStatus.appLaunchedTime);
                appCompletedTimeString = convertTime(false, jobStatus.appCompletedTime);
                appExitDiagnosticsString = jobStatus.appExitDiagnostics?jobStatus.appExitDiagnostics.replace(/\n/g, "<br>"):'';

                let jobName = response.job.name;
                let vcName = jobStatus.virtualCluster?jobStatus.virtualCluster : 'default';
                let jobState = getHumanizedJobStateString(jobStatus);

                let job = {
                    key:1,
                    jobId:response.job.id,
                    jobName: jobName,
                    vcName:  vcName,
                    vcUrl:'/openi/virtualClusters?vcName='+vcName,
                    startTimeSec: Math.round(jobStatus.createdTime / 1000).toString(),
                    startTime: convertTime(false, jobStatus.createdTime),
                    durationSec: getDurationInSeconds(jobStatus.createdTime, jobStatus.completedTime),
                    duration: convertTime(true, jobStatus.createdTime, jobStatus.completedTime),
                    retries: jobStatus.retries,
                    status: jobState,
                    stop: (jobState === 'Waiting' || jobState === 'Running')?true:false,
                    resubmit: true
                };

                //console.log("Job",job);
                let jobns = userid?userid.toLowerCase():'';
                let jobTerminalUrl= __WEBPORTAL__.terminalUri+'/?pod.TaskSet='+job.jobId+'&namespace.name='+jobns;
                
                //console.log("sub tasks",tasks);
                let  jobConfigRes = yield call(apiService.loadJobConfig,jobId);

                let gpuType = '';
                let gpuTypeAction = "no_debug";
                let taskCommands = {};
                if(jobConfigRes.success)
                {
                    configInfo = JSON.stringify(jobConfigRes.job, null, 2);
                    
                    for(let i=0;i<jobConfigRes.job.taskRoles.length;i++)
                    {
                        let taskname = jobConfigRes.job.taskRoles[i].name;
                        let taskCommand = jobConfigRes.job.taskRoles[i]?jobConfigRes.job.taskRoles[i].command:'';
                        taskCommands[taskname] = taskCommand;
                    }
                    

                    if(jobConfigRes.job.gpuType){
                        gpuType = jobConfigRes.job.gpuType;
                    }else if(Array.isArray(jobConfigRes.job.taskRoles) && jobConfigRes.job.taskRoles.length > 0){
                        gpuType = jobConfigRes.job.taskRoles[0].gpuType;
                    }

                    gpuTypeAction =  jobConfigRes.job.typeAction;
                    //job gpuType
                    job.gpuType = gpuType;
                    configDisable=false;
                }

                for (let taskRoleName of Object.keys(response.job.taskRoles)){
                    let rawTask= response.job.taskRoles[taskRoleName];
                    let taskCommand = taskCommands[taskRoleName];
                    let task={
                        taskRole:taskRoleName,
                        actions:true
                    };

                    

                    for(let index in rawTask.taskStatuses)
                    {
                        
                        let taskStatus = rawTask.taskStatuses[index];

                        let taskState = getHumanizedStateString(taskStatus.state.toUpperCase());
                        
                        task.key= taskStatus.podUid;
                        task.taskIndex = ''+taskStatus.taskIndex;
                        task.podName= taskStatus.podName;
                        task.containerName= taskStatus.containerId;
                        task.podIp= taskStatus.podIp;
                        task.ip=taskStatus.containerIp;
                        task.gpus=convertGpu(taskStatus.containerGpus);
                        task.status= taskState;

                        task.trackingPageUrl = "#/openi/single/log?job="+jobName +
                            "&taskName="+taskRoleName +
                            "&taskPod="+task.podName;

                        if (task.podName){
                            task.metricUrl=__WEBPORTAL__.grafanaUri+"/d/TK8iV8nWk/taskmetrics?orgId=1&refresh=10s&var-pod="+task.podName+"&var-pod_name="+task.podName;
                        } else {
                            task.metricUrl = ""
                        }
                        task.debugIDEUrl="";
                        if(gpuType==='' || gpuType === 'debug'){
                            if(taskState === 'Running'){
                                let baseUrlRegex = /base_url=\S*/;
                                let matchBaseUrlArray = taskCommand.match(baseUrlRegex);
                                if(matchBaseUrlArray){
                                    let matchBaseUrlString = matchBaseUrlArray[matchBaseUrlArray.length-1];
                                    let debugJpylabPath=matchBaseUrlString.replace("base_url=","");
                                    debugJpylabPath=debugJpylabPath.replace(/"/g,"");
                                    debugJpylabPath=debugJpylabPath.replace(/'/g,"");
                                    task.debugIDEUrl = __WEBPORTAL__.jupyterLabProxyUri + debugJpylabPath+"/";
                                }
                            }
                        }
                        //deepcopy
                        tasks.push(JSON.parse(JSON.stringify(task)));
                    }

                }

                jobs.push(job);

                let currentUser = getAuthority();

                yield put({
                    type: 'updateJob',
                    payload: {
                        loading:false,
                        jobId,
                        jobName,
                        job,
                        jobs,
                        tasks,
                        jobTerminalUrl,
                        jobStatus,
                        appLaunchedTimeString,
                        appCompletedTimeString,
                        appExitDiagnosticsString,
                        configDisable,
                        configInfo,
                        gpuType,
                        sshDisable,
                        gpuTypeAction,
                        currentUser
                    },
                });
            }else{
                yield put({
                    type: 'updateJob',
                    payload: {
                        loading:false,
                    },
                });

                onFailed && onFailed();
            }
        },

        *resubmitJob({payload}, { call, put }) {
            yield put(
                routerRedux.push({
                    pathname: '/openi/submit',
                    search: stringify({
                        resubmitName: payload.jobId,
                    }),
                })
            );
        },

        *stopJob({payload}, { call, put }){
            yield put({
                type: 'updateJob',
                payload: {loading:true},
            });

            const response = yield call(apiService.stopJob,payload);

            yield call(apiService.waitTime,3);

            yield put({
                type: 'updateJob',
                payload: {loading:false},
            });

            //console.log("stopJob",response);

            yield put({
                type: 'loadJob'
            });
        },
        *showCommitImageModel({payload}, { call, put }){

            let currentTask = payload.task;

            const imageStatusResponse = yield call(apiService.getCommitImageStatus,payload.jobId,payload.task.containerName);

            if(imageStatusResponse.success)
            {
                let imageStatus = imageStatusResponse.imageStatus;
                if(imageStatus.success){

                    if(imageStatus.commit.status === "SUCCEEDED" ||
                        imageStatus.commit.status === "FAILED"){
                        currentTask.imageState = imageStatus.commit.status;
                        currentTask.enableCommitImage = true;
                    }else if(imageStatus.commit.status === "NOT_FOUND"){
                        currentTask.imageState = "ONLINE";
                        currentTask.enableCommitImage = true;
                    }else{
                        currentTask.imageState = "PROCESSING";
                        currentTask.enableCommitImage = false;
                    }
                }else{
                    currentTask.imageState = "ONLINE";
                    currentTask.enableCommitImage = true;
                }
            }else{
                currentTask.imageState = "NOT_ONLINE";
                currentTask.enableCommitImage = false;
            }

            let textId = 'jobDetail.task.imagestate.'+currentTask.imageState;
            currentTask.imageStateText = formatMessage({id:textId});

            yield put({
                type: 'updateJob',
                payload: {
                    currentTask,
                    visiableCommitImageModel:true
                },
            });
        },

        *commitImage({payload}, { call, put }){
            const onSuccessed = payload && payload.onSuccessed ? payload.onSuccessed : function onSuccessed(){};
            const onFailed = payload && payload.onFailed ? payload.onFailed : function onFailed(msg){};

            const commitResponse = yield call(apiService.commitImage,
                payload.task.ip,
                payload.jobId,
                payload.task.containerName,
                payload.imageTag,
                payload.imageDescription);

            yield put({
                type: 'updateJob',
                payload: {
                    visiableCommitImageModel:false
                },
            });

            if(commitResponse.code === "S000")
            {
                onSuccessed();
            }else{
                onFailed(commitResponse.msg);
            }

        }
    },

    reducers:{
        resetState(state,{payload}){
            return {
                ...initState
            }
        },
        updateJob(state,{payload}){
            //console.log("updateJob",payload);
            return {
                ...state,
                ...payload
            }
        },

        showConfigModal(state,{payload}){
            //console.log("showConfigModal",payload);
            return {
                ...state,
                ...payload
            }
        },
        showAppSummaryModal(state,{payload}){
            return {
                ...state,
                ...payload
            }
        },
        closeCommitImageModel(state,{payload}){
            return {
                ...state,
                visiableCommitImageModel:false
            }
        },
    }
}
