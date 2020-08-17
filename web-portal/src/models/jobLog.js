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

import { getPageQuery,getSshFileExt } from '@/utils/utils';

const initState = {
    loading:false,
    job:'',
    taskName:'',
    taskPod:'',
    container:'',
    pageLogList:[],
    totalLogNumber:0
};

export default {
    namespace: 'jobLog',

    state: {
        ...initState
    },

    effects: {
        *getFistPageAndPageToken({payload}, { call, put  }) {

            yield put({
                type: 'updateLogData',
                payload: {
                    loading:true,
                },
            });

            const onFailed = payload&&payload.onFailed?payload.onFailed:function onFailed(){};

            const params = getPageQuery();

            let { job,taskName,taskPod } = params;
            let pageSize = __WEBPORTAL__.logPageSize;
            let pageTokenExpired = __WEBPORTAL__.logPageTokenExpired;

            console.log("job Log info",pageSize,pageTokenExpired);

            const response = yield call(apiService.loadContainerLogFistPageAndPageToken,
                taskPod,pageSize,pageTokenExpired);

            //console.log("loadLog",response);
            let totalLogNumber = 0;
            let pageLogList = [];
            let pageToken = '';
            if(response.hits)
            {
                //console.log("response",response);
                pageToken =response._scroll_id;
                totalLogNumber = response.hits.total.value;
                pageLogList = response.hits.hits.map((item) => {
                    return {
                        _id: item._id,
                        message: item._source.message
                    }
                });

            }else{
                onFailed && onFailed();
            }

            yield put({
                type: 'updateLogData',
                payload: {
                    loading:false,
                    job,
                    taskName,
                    taskPod,
                    pageToken,
                    pageLogList,
                    totalLogNumber
                },
            });
        },

        *loadLogNextPage({payload}, { call, put,select }) {
            
            yield put({
                type: 'updateLogData',
                payload: {
                    loading:true,
                },
            });

            const onFailed = payload&&payload.onFailed?payload.onFailed:function onFailed(){};

            const pageLogList = yield select((state)=>state.jobLog.pageLogList )
            
            let pageTokenExpired = initState.pageTokenExpired;
            let pageToken = payload.pageToken;
            const response = yield call(apiService.loadContainerLogByPageToken,
                pageTokenExpired,pageToken);

            //console.log("loadLog",response);

            let newPageLogList = [];
            if(response.hits)
            {
                //console.log("response",response);
                let onePageList = response.hits.hits.map((item) => {
                    return {
                        _id: item._id,
                        message: item._source.message
                    }
                });

                newPageLogList = pageLogList.concat(onePageList);

            }else{
                onFailed && onFailed();
            }

            yield put({
                type: 'updateLogData',
                payload: {
                    loading:false,
                    pageLogList: newPageLogList
                },
            });
        },

    },

    reducers:{
        resetState(state,{payload}){
            return {
                ...initState
            }
        },
        updateLogData(state,{payload}){
            //console.log("updateJob",payload);
            return {
                ...state,
                ...payload
            }
        },

    }
}
