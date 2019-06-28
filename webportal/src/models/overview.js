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
import * as apiService from '@/services/api';

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

export default {
    namespace: 'overview',

    state: {
        runCount:0,
        waitCount:0,
        stopCount:0,
        failCount:0,
        successCount:0,
        endCount:0,
    },

    effects:{
        *loadJobs({payload}, { call, put }) {
            const onFailed = payload&&payload.onFailed?payload.onFailed:function onFailed(){};

            const rsp = yield call(apiService.loadJobs);

            if(!rsp.success){
                onFailed && onFailed();
                return ;
            }

            const state = {
                runCount:0,
                waitCount:0,
                stopCount:0,
                failCount:0,
                successCount:0,
                endCount:0,
            };

            for(let i=0;i<rsp.jobs.length;i++){
                let status = getHumanizedJobStateString(rsp.jobs[i]);
                if (status.startsWith('Running')) {
                    state.runCount ++;

                }
                if (status.startsWith('Waiting')) {
                    state.waitCount ++;
                }
                if (status.startsWith('Stopped')) {
                    state.stopCount ++;

                }
                if (status.startsWith('Failed')) {
                    state.failCount ++;

                }
                if (status.startsWith('Succeeded')) {
                    state.successCount ++;

                }
            }

            state.endCount = state.successCount;
            state.stopCount = state.failCount + state.stopCount;
            yield put({
                type: 'init',
                payload: {
                   state
                },
             });
        },
    },

    reducers:{
        init(state,{ payload }){
            return payload.state;
        }
    }
}
