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
        unknownCount:0,
    },

    effects:{
        *loadJobsSummary({payload}, { call, put }) {
            const onFailed = payload&&payload.onFailed?payload.onFailed:function onFailed(){};

            const rsp = yield call(apiService.loadJobsSummary);

            if(!rsp.success){
                onFailed && onFailed();
                return ;
            }

            const state = {
                runCount: rsp.jobsSummary.RUNNING,
                waitCount:rsp.jobsSummary.WAITING,
                stopCount:rsp.jobsSummary.STOPPED,
                failCount:rsp.jobsSummary.FAILED,
                successCount:rsp.jobsSummary.SUCCEEDED,
                unknownCount:rsp.jobsSummary.UNKNOWN

            };

            state.stopCount = state.failCount + state.stopCount + state.unknownCount;
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
