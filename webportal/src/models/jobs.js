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
import {stringify} from "qs";
import { getPageQuery } from '@/utils/utils';
import { getAuthority,setAuthority } from '@/utils/authority';

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
    let hour = time.getHours() < 12 ? `上午${getFormat(time.getHours())}` : `下午${getFormat(time.getHours())}`;
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

const initState = {
    loading:true,
    data:[]
};

export default {
    namespace: 'jobs',

    state: {
        ...initState
    },

    effects: {
        *loadJobs({payload}, { call, put }) {

            yield put({
                type: 'resetState',
            });

            const onFailed = payload&&payload.onFailed?payload.onFailed:function onFailed(){};

            const response = yield call(apiService.loadJobs);

            if(response.success)
            {
                let jobs = [];
                const query = getPageQuery() || {};
                const {vcName,limit} = query;

                let showRowCount = undefined;
                try{
                    showRowCount = parseInt(limit);
                }catch (e) {
                    showRowCount = undefined;
                }

                for(let index in response.jobs) {

                    if(index>=showRowCount){
                        break;
                    }

                    let rawJob = response.jobs[index];
                    let vClusterName = rawJob.virtualCluster?rawJob.virtualCluster : 'default';

                    if(vcName && vcName !== vClusterName){
                        continue;
                    }

                    let jobState = getHumanizedJobStateString(rawJob);

                    let job = {
                        key:index+1,
                        jobName: rawJob.name,
                        jobDetailUrl:'/openi/job?jobName='+rawJob.name,
                        userName: rawJob.userId,
                        vcName:  vClusterName,
                        vcUrl:'/openi/virtualClusters?vcName='+vClusterName,
                        startTimeSec: Math.round(rawJob.createdTime / 1000).toString(),
                        startTime: convertTime(false, rawJob.createdTime),
                        durationSec: getDurationInSeconds(rawJob.createdTime, rawJob.completedTime),
                        duration: convertTime(true, rawJob.createdTime, rawJob.completedTime),
                        retries: rawJob.retries,
                        status: jobState,
                        stop: (jobState === 'Waiting' || jobState === 'Running')?true:false,
                        resubmit: true,
                    };

                    jobs.push(job);
                }

                yield put({
                    type: 'updateJobs',
                    payload: {loading:false,data:jobs},
                });
            }else{
                yield put({
                    type: 'updateJobs',
                    payload: {loading:false,data:[]},
                });

                onFailed && onFailed();
            }

            let currentUserInfo= getAuthority();
            if(currentUserInfo)
            {
                if(!currentUserInfo.DAURecordTimeStamp)
                {
                   let res = yield call(apiService.recordDayActiveUser);

                    if(res.success){
                        let now = new Date();
                        currentUserInfo.DAURecordTimeStamp = now.getTime();
                        setAuthority(currentUserInfo);
                    }
                }else{
                    let nowTimeStamp = Date.now();
                    let timespan = nowTimeStamp - currentUserInfo.DAURecordTimeStamp;
                    let days = timespan/(24*60*60*1000);
                    if(days>1)
                    {
                        let res = yield call(apiService.recordDayActiveUser);

                        if(res.success){
                            currentUserInfo.DAURecordTimeStamp = nowTimeStamp;
                            setAuthority(currentUserInfo);
                        }
                    }
                }
            }

        },

        *resubmitJob({payload}, { call, put }) {
            yield put(
                routerRedux.push({
                    pathname: '/openi/submit',
                    search: stringify({
                        resubmitName: payload.jobName,
                    }),
                })
            );
        },

        *stopJob({payload}, { call, put }){

            yield put({
                type: 'updateJobs',
                payload: {loading:true},
            });

            const response = yield call(apiService.stopJob,payload);

            yield call(apiService.waitTime,2);

            yield put({
                type: 'updateJobs',
                payload: {loading:false},
            });

            //console.log("stopJob",response);

            yield put({
                type: 'loadJobs'
            });
        },
    },

    reducers:{
        resetState(state,{payload}){
            return {
                ...initState
            }
        },
        updateJobs(state,{payload}){
            return {
                ...state,
                ...payload
            }
        }
    }
}
