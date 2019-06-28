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
import { getPageQuery,getSshFileExt } from '@/utils/utils';

import {formatMessage } from 'umi/locale';

const initState = {
    loading:true,
    job:'',
    taskName:'',
    taskPod:'',
    container:'',
    pageSize:20,
    pageNumber:1,
    pageLogList:[],
    totalLogNumber:0
};

export default {
    namespace: 'jobLog',

    state: {
        ...initState
    },

    effects: {
        *loadLog({payload}, { call, put }) {

            yield put({
                type: 'updateLogData',
                payload: {
                    loading:true,
                },
            });

            const onFailed = payload&&payload.onFailed?payload.onFailed:function onFailed(){};

            const params = getPageQuery();

            //console.log("loadLog params",params);
            let { job,taskName,taskPod,container } = params;
            let pageSize = initState.pageSize;
            let pageNumber = payload.pageNumber;
            const response = yield call(apiService.loadContainerLog,
                job,taskPod,container,pageSize,pageNumber);

            console.log("loadLog",response);
            let totalLogNumber = 0;
            let pageLogList = [];

            if(response.hits)
            {
                //console.log("response",response);
                totalLogNumber = response.hits.total.value;
                pageLogList = response.hits.hits;

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
                    container,
                    pageNumber,
                    pageLogList,
                    totalLogNumber
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
