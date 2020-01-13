import { routerRedux } from 'dva/router';
import { stringify } from 'qs';
import { thirdPartyUserInfo,accountRegister,thirdPartyRegister} from '@/services/api';
import { setAuthority,getAuthority } from '@/utils/authority';
import { getPageQuery } from '@/utils/utils';
import * as apiService from '@/services/api';

const UserStatus = {
    FORBIDDEN: 0, // 禁用
    ZERO_HOUR: 9, // 零时用户
    ALLOW_NOT_ACTIVE: 10, // 正常未激活
    ALLOW_ACTIVE: 11, // 正常激活
};

export default {
    namespace: 'register',

    state: {
        load:false,
        visibleSuccessModel: false,
        username:'',
        realName:'',
        tutor:'',
        email:'',
        phonePrefix:'+86',
        phone:'',
        innerAccount:'',
        orgInfoArray:[],
        orgInfo : []
    },

    effects: {

        *getAccountUserInfo({ payload }, { call, put }) {
            const onFailed = payload&&payload.onFailed?payload.onFailed:function onFailed(){};
            const pageParams = getPageQuery();
            let { token_3rd } = pageParams;

            //load org info
            const orgInfoRes = yield call(apiService.getOrgInfo);


            let orgInfo =[];
            if(orgInfoRes.success) {
                for (let org of orgInfoRes.orgInfo) {
                    let rootOrg = {
                        label: org.name,
                        value: org.organizationId,
                        children: []
                    };

                    if (org.children) {
                        for (let secOrg of org.children) {
                            let childOrg = {
                                label: secOrg.name,
                                value: secOrg.organizationId
                            };

                            if (secOrg.name === '其它') {
                                rootOrg.children.push(childOrg);
                            } else {
                                rootOrg.children.unshift(childOrg);
                            }
                        }
                    }

                    orgInfo.push(rootOrg);
                }
            }else{
                onFailed && onFailed(orgInfoRes.message);
                return;
            }

            yield put({
                type: 'updateInfo',
                payload: {
                    orgInfo
                },
            });

            let token = '';
            if(token_3rd) {
                token = token_3rd;
                //getUserInfo
                let userInfoResponse = yield call(thirdPartyUserInfo, token);

                if (userInfoResponse.success) {
                    if (UserStatus.ZERO_HOUR === userInfoResponse.payload.status) {

                    }else {

                       let thirdPartyUserInfo = {
                          username : userInfoResponse.payload.username,
                          admin :  userInfoResponse.payload.admin,
                           token: token_3rd
                       };

                        yield put({
                            type: 'changeLoginStatus',
                            payload: {
                                status:true,
                                ...thirdPartyUserInfo
                            },
                        });

                        yield put(
                            routerRedux.push({
                                pathname: '/openi/v2/brain/overview',
                            })
                        );

                        return;
                    }
                }else{
                    onFailed && onFailed(userInfoResponse.message);
                    return;
                }
            }
        },

        *registerAccount({ payload }, { call, put }) {

            const accountInfo = payload.params ;
            const onFailed = payload&&payload.onFailed?payload.onFailed:function onFailed(){};

            const pageParams = getPageQuery();
            let { token_3rd } = pageParams;

            let token = '';
            if(token_3rd){
                token = token_3rd;

                yield put({
                    type: 'changeLoadingStatus',
                    payload: {
                        load:true
                    },
                });

                const response = yield call(thirdPartyRegister, accountInfo,token);

                yield put({
                    type: 'changeLoadingStatus',
                    payload: {
                        load:false
                    },
                });

                //Register successfully
                if (response&&response.code === 'S000') {

                    yield put({
                        type: 'changeLoginStatus',
                        payload: {
                            status:true,
                            ...response.payload
                        },
                    });

                    yield put(
                        routerRedux.push({
                            pathname: '/openi/v2/brain/overview',
                        })
                    );
                }else if(response&&response.code === 'S402'){
                    onFailed && onFailed("非合法第三方用户");
                    return;
                }else if(response&&response.code === 'S202')
                {
                    onFailed && onFailed("用户名已存在");
                    return;
                }else{
                    onFailed && onFailed(response.msg);
                    return;
                }
            }else{

                const loginInfo = getAuthority();
                if(loginInfo&&loginInfo.status&&loginInfo.admin)
                {
                    token = loginInfo.token;
                }else{

                    onFailed && onFailed("注册需管理员授权");

                    return;
                }

                yield put({
                    type: 'changeLoadingStatus',
                    payload: {
                        load:true
                    },
                });


                let newUserInfo = {
                    username:accountInfo.username,
                    password:accountInfo.password,
                    email:accountInfo.email,
                    realName:accountInfo.realName,
                    sex:1,
                    tutor:accountInfo.tutor,
                    innerAccount: accountInfo.innerAccount,
                    phone:accountInfo.phonePrefix+"-"+accountInfo.phone,
                    organizationId:accountInfo.orgInfoArray[1],
                };

                const response = yield call(accountRegister, newUserInfo,token);

                yield put({
                    type: 'changeLoadingStatus',
                    payload: {
                        load:false
                    },
                });

                //Register successfully
                if (response&&response.code === 'S000') {

                    yield put({
                        type: 'visibleSuccessModelWindow',
                        payload: {
                            visibleSuccessModel:true,
                            username: accountInfo.username
                        },
                    });
                }else{
                    yield put({
                        type: 'visibleSuccessModelWindow',
                        payload: {
                            visibleSuccessModel:false,
                            username:''
                        },
                    });
                    onFailed && onFailed(response.msg);
                }
            }
        },

        *goToHomePage({}, { put }){

            yield put({
                type: 'visibleSuccessModelWindow',
                payload: {
                    visibleSuccessModel:false
                },
            });

            yield put(
                routerRedux.push({
                    pathname: '/openi/v2/brain/overview',
                })
            );
        }
    },

    reducers: {
        visibleSuccessModelWindow(state, { payload }) {

            return {
                ...state,
                visibleSuccessModel: payload.visibleSuccessModel,
                username: payload.username,
            };
        },
        changeLoadingStatus(state, { payload }) {

            return {
                ...state,
                load: payload.load,
            };
        },
        changeLoginStatus(state, { payload }) {

            setAuthority(payload);

            return {
                ...state,
                status: payload.status?payload.status:false,
            };
        },
        updateInfo(state,{payload}){
            //console.log("updateJob",payload);
            return {
                ...state,
                ...payload
            }
        }
    },
};
