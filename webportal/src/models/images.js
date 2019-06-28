import * as apiService from '@/services/api';

export default {
    namespace: 'images',

    state: {
        loading:true,
        data:[]
    },

    effects: {
        *loadImageSet({payload}, { call, put }) {
            const onFailed = payload&&payload.onFailed?payload.onFailed:function onFailed(){};

            const imagesetResponse = yield call(apiService.loadImageSet);

            if(imagesetResponse.success) {
                let ImageMap = imagesetResponse.payload;
                let Images = Object.values(ImageMap);
                let imageset = [];

                for (let index in Images) {
                    let image = {...Images[index], key: index + 1}
                    imageset.push(image);
                }

                //console.log("imagesets",ImageMap,imageset);

                yield put({
                    type: 'updateImageset',
                    payload: {loading: false, data: imageset},
                });
            }else{
                yield put({
                    type: 'updateImageset',
                    payload: {loading: false, data: []},
                });
                onFailed && onFailed();
            }
        }
    },
    reducers:{
        updateImageset(state,{payload}){
            return {
                ...state,
                ...payload
            }
        }
    }
}
