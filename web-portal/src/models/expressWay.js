import { routerRedux } from 'dva/router';
import { stringify } from 'qs';
let initState = {
  visible: false
};

export default {
  namespace: 'expressWay',

  state: {
    ...initState
  },

  effects: {

  },

  reducers: {
    toggle(state){
      return {
        ...state,
        visible:!state.visible
      }
    },
  },
};
