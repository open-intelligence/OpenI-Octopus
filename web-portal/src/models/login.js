import { routerRedux } from 'dva/router';
import { stringify } from 'qs';
import { accountLogin } from '@/services/api';
import { setAuthority,getAuthority } from '@/utils/authority';
import { getPageQuery } from '@/utils/utils';

export default {
    namespace: 'login',

    state: {
        status: false,
        load: false,
    },

    effects: {
        *login({ payload }, { call, put }) {
            const params = payload.params ;
            const onFailed = payload&&payload.onFailed?payload.onFailed:function onFailed(){};
            //console.log("login params",params);

            params.expiration = 7*24*60*60;

            yield put({
                type: 'changeLoadingStatus',
                payload: {
                    load:true
                },
            });
            const response = yield call(accountLogin, params);

            yield put({
                type: 'changeLoadingStatus',
                payload: {
                    load:false
                },
            });

            // Login successfully
            if (response&&response.code === 'S000') {

                yield put({
                    type: 'changeLoginStatus',
                    payload: {
                        status:true,
                        ...response.payload
                    }
                });

                //是否有上一次退出的页面,登录成功重定向
                const urlParams = new URL(window.location.href);
                const params = getPageQuery();
                let { redirect } = params;
                if (redirect) {
                    const redirectUrlParams = new URL(redirect);
                    if (redirectUrlParams.origin === urlParams.origin) {
                        redirect = redirect.substr(urlParams.origin.length);
                        if (redirect.match(/^\/.*#/)) {
                            redirect = redirect.substr(redirect.indexOf('#') + 1);
                        }
                    } else {
                        window.location.href = redirect;
                        return;
                    }
                }
                yield put(routerRedux.replace(redirect || '/openi/overview'));
            }else{

                yield put({
                    type: 'changeLoginStatus',
                    payload: {
                        status:false
                    },
                });
                onFailed && onFailed()
            }
        },

        *logout(_, { put }) {
            yield put({
                type: 'changeLoginStatus',
                payload: {
                    status: false
                },
            });

            yield put(
                //跳转localhost:xxx/User/Login?redirect=xxxxx
                routerRedux.push({
                    pathname: '/openi/user/login',
                    search: stringify({
                        redirect: window.location.href,
                    }),
                })
            );
        },
        *shouldAutoLogin({loginStatus}, { put }) {

           const loginInfo = getAuthority();

            //console.log("loginInfo",loginInfo);
            if(loginInfo&&loginInfo.status)
            {
                yield put(
                    routerRedux.push({
                        pathname: '/openi/overview',
                    })
                );
            }
        },
    },

    reducers: {
        changeLoginStatus(state, { payload }) {

            setAuthority(payload);

            return {
                ...state,
                status: payload.status?payload.status:false,
            };
        },

        changeLoadingStatus(state, { payload }) {
            return {
                ...state,
                load: payload.load?payload.load:false
            };
        },
    },
};
