import { routerRedux } from 'dva/router';
import { stringify } from 'qs';
import { accountLogin } from '@/services/api';
import { setAuthority,getAuthority } from '@/utils/authority';
import { getPageQuery } from '@/utils/utils';

let initState = {
    loginErrorString:'',
    loginStatusString:'success',
    visiableLoginModel:false,
    status: false,
    load: false,
    username:'',
    admin:false
};

let loginStatus = initState;


//f5 refresh page will reload models object
//we should reload the loginStatus from broswer cache
const currentLoginStatus = getAuthority();

if(currentLoginStatus)
{
    loginStatus = {
        ...currentLoginStatus
    }
}



export default {
    namespace: 'login',

    //model state fields which will bind to render page doms should set to first level in the state obj
    state: {
        ...loginStatus
    },

    effects: {
        *login({ payload }, { call, put }) {
            const params = payload.params ;
            const onFailed = payload&&payload.onFailed?payload.onFailed:function onFailed(){};
            const onSuccessed = payload&&payload.onSuccessed?payload.onSuccessed:function onSuccessed(){};
            //console.log("login params",params);

            params.expiration = 7*24*60*60;

            yield put({
                type: 'changeLoadingStatus',
                payload: {
                    loginStatusString:'success',
                    load:true
                },
            });
            const response = yield call(accountLogin, params);

            // Login successfully
            if (response&&response.code === 'S000') {

                yield put({
                    type: 'changeLoginStatus',
                    payload: {
                        status:true,
                        load:false,
                        ...response.payload
                    }
                });

                onSuccessed && onSuccessed()

            }else{

                yield put({
                    type: 'changeLoginStatus',
                    payload: {
                        ...initState,
                        visiableLoginModel:true
                    },
                });
                onFailed && onFailed(response.code)
            }
        },

        *logout(_, { put }) {
            yield put({
                type: 'changeLoginStatus',
                payload: {
                    ...initState
                },
            });

            yield put(
                //跳转localhost:xxx/User/Login?redirect=xxxxx
                routerRedux.push({
                    pathname: '/openi/v2/home',
                    search: stringify({
                        redirect: window.location.href,
                    }),
                })
            );
        },

        *shouldAutoLogin({loginStatus}, { put }) {

           const currentLoginStatus = getAuthority();

            //console.log("loginInfo",loginInfo);
            if(currentLoginStatus && currentLoginStatus.status)
            {

                yield put({
                    type: 'changeLoginStatus',
                    payload: {
                        ...currentLoginStatus
                    }
                });

                yield put(
                    routerRedux.push({
                        pathname: '/openi/v2/home',
                    })
                );
            }
        },
        *goToLogin({cancelRedirect}, { put }) {

            let dest = {
                pathname: '/openi/user/login',
            };

            yield put(
                routerRedux.push(dest)
            );
        },
    },

    reducers: {
        getCurrentUser(){

            const currentLoginStatus = getAuthority();

            if(currentLoginStatus)
            {
                return {
                    ...currentLoginStatus
                }
            }else{
                return {
                    ...initState
                }
            }
        },

        changeLoginStatus(state, { payload }) {

            setAuthority(payload);

            return {
                ...payload,
            };
        },

        changeLoadingStatus(state, { payload }) {
            return {
                ...state,
                load: payload.load?payload.load:false
            };
        },
        showLoginModel(state, { payload }) {
            return {
                ...state,
                visiableLoginModel:true
            };
        },
        closeLoginModel(state, { payload }) {
            return {
                ...state,
                visiableLoginModel:false
            };
        },
        loginSuccess(state, { payload }) {
            return {
                ...state,
                loginErrorString:'',
                loginStatusString:'success',
                visiableLoginModel:false,
            };
        },
        loginFail(state, { payload }) {
            return {
                ...state,
                loginErrorString:payload.errMsg,
                loginStatusString:'error',
                visiableLoginModel:true,
            };
        }
    },
};
