import * as apiService from '@/services/api';

export default {
    namespace: 'datasets',

    state: {
        loading:true,
        data:[]
    },

    effects: {
        *loadDataSet({payload}, { call, put }) {
            const onFailed = payload&&payload.onFailed?payload.onFailed:function onFailed(){};

            const response = yield call(apiService.loadDataSet);

            if(response.success) {
                let DataSetMap = response.payload;
                let DataSets = Object.values(DataSetMap);
                let datasets = [];

                for (let index in DataSets) {
                    let dataset = {...DataSets[index], key: index + 1};
                    //去掉无用数据
                    delete dataset.update_at;

                    datasets.push(dataset);
                }

                //console.log("datasets",DataSetMap,datasets);

                yield put({
                    type: 'updateDataSets',
                    payload: {loading: false, data: datasets},
                });
            }else{
                yield put({
                    type: 'updateDataSets',
                    payload: {loading: false, data: []},
                });
                onFailed && onFailed();
            }
        }
    },
    reducers:{
        updateDataSets(state,{payload}){
            return {
                ...state,
                ...payload
            }
        }
    }
}
