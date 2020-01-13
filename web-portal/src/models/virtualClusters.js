
import * as apiService from '@/services/api';
import { routerRedux } from 'dva/router';
import {stringify} from "qs";

export default {
    namespace: 'virtualClusters',

    state: {
        loading:true,
        data:[]
    },

    reducers:{
        updateVirtualClusters(state,{payload}){
            return {
                ...state,
                ...payload
            }
        }
    },
    effects: {
        *loadVirtualClusters({payload}, { call, put }) {
            const onFailed = payload&&payload.onFailed?payload.onFailed:function onFailed(){};

            const virtualClusterResponse = yield call(apiService.loadVirtualClusters);

            if(virtualClusterResponse&&'S000' !== virtualClusterResponse.code){
                yield put({
                    type: 'updateVirtualClusters',
                    payload: {loading:false,data:[]},
                });

                onFailed && onFailed();
                return;
            }
            const virtualClusterMap = virtualClusterResponse.payload;
            let virtualClusterNames = Object.keys(virtualClusterMap);
            let virtualClusterList = [];


            virtualClusterNames.forEach(function(name,index) {
                let virtualCluster = virtualClusterMap[name];
                virtualClusterList.push({name,key: index + 1,...virtualCluster,...virtualCluster.resourcesUsed});
            });

            yield put({
                type: 'updateVirtualClusters',
                payload: {loading:false,data:virtualClusterList},
            });
        },
        *goToJobs({query}, { put }){
            let dest = {
                pathname: '/openi/jobs',
            }
            dest = Object.assign(dest,{search: stringify(query)});

            yield put(
                //跳转localhost:xxx/User/Login?redirect=xxxxx
                routerRedux.push(dest)
            );
        }
    },
}
