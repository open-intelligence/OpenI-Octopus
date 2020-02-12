import { routerRedux } from 'dva/router';
import { getAuthority } from '@/utils/authority';
import { stringify } from 'qs';

export default {
    namespace: 'user',
    state: {
        currentUser:{
            username:'',
            admin:false
        }
    },
    reducers:{
        getCurrentUser(state){

            const currentUser = getAuthority();

            return {
                ...state,
                currentUser:currentUser
            }
        }
    },
    effects: {
        *logout({cancelRedirect}, { put }) {
            yield put({
                type: 'changeLoginStatus',
                payload: {
                    status: false
                },
            });

            let dest = {
                pathname: '/openi/user/login',
            }
            if(!cancelRedirect) {
                dest = Object.assign(dest,{search: stringify({
                    redirect: window.location.href,
                })});
            }

            yield put(
                //跳转localhost:xxx/User/Login?redirect=xxxxx
                routerRedux.push(dest)
            );
        }
    },
}
