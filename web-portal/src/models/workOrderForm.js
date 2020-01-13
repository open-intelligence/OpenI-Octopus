import { submitWorkOrder } from '@/services/api';

const orderTypes = {
  ApplyMachineTime:'APPLY_MACHINE_TIME'
};

const initState = {
  orderTypes:orderTypes,
  defaultSelectOrderType:orderTypes.ApplyMachineTime,
  selectOrderType:orderTypes.ApplyMachineTime
}

export default {
  namespace: 'workOrderForm',

  state: {
    ...initState
  },

  reducers:{
    changeOrderType(state,{payload}){
      return {
        ...state,
        selectOrderType:payload.selectOrderType
      }
    },
  },
  effects: {
    *submitWorkOrder({payload:{workOrder,callback}},{ call, put }){
      const response = yield call(submitWorkOrder, workOrder);
      if (response.success) {

        // yield put({
        //   type: 'changeLoginStatus',
        //   payload: {
        //     status:true,
        //     load:false,
        //     ...response.payload
        //   }
        // });

        callback && callback()
        return
      }
      callback && callback(response)
    }
  },
}
