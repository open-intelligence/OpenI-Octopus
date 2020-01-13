import { getAuthority } from '@/utils/authority';
import * as apiService from '@/services/api';
import * as routerRedux from "react-router-redux";
import { getPageQuery } from '@/utils/utils';

const initState = {
        //loading:true,
        realName:'',
        tutor:'',
        email:'',
        phonePrefix:'+86',
        phone:'',
        innerAccount:'',
        orgInfoArray:[],
        orgInfo : []
};

export default {
    namespace: 'userInfo',
    state: initState,

    effects: {
        *getUserInfo({ payload }, { call, put }) {
            const onFailed = payload&&payload.onFailed?payload.onFailed:function onFailed(){};

            yield put({
                type: 'updateUserInfo',
                payload: initState,
            });


            const orgInfoRes = yield call(apiService.getOrgInfo);


            let orgInfo =[];
            if(orgInfoRes.success){
                for(let org of orgInfoRes.orgInfo){
                    let rootOrg = {
                        label:org.name,
                        value:org.organizationId,
                        children:[]
                    };

                    if(org.children){
                        for(let secOrg of org.children){
                            let childOrg ={
                                label:secOrg.name,
                                value:secOrg.organizationId
                            };

                            if(secOrg.name === '其它'){
                                rootOrg.children.push(childOrg);
                            }else{
                                rootOrg.children.unshift(childOrg);
                            }
                        }
                    }

                    orgInfo.push(rootOrg);
                }


                const currentUser= getAuthority();
                const userInfoRes = yield call(apiService.getUserInfo,currentUser.username);

                let userInfo = {};
                if(userInfoRes.success)
                {
                    userInfo.email = userInfoRes.userInfo.email?userInfoRes.userInfo.email:'';
                    userInfo.realName = userInfoRes.userInfo.realName?userInfoRes.userInfo.realName:'';
                    userInfo.tutor = userInfoRes.userInfo.tutor?userInfoRes.userInfo.tutor:'';
                    userInfo.innerAccount = userInfoRes.userInfo.innerAccount?userInfoRes.userInfo.innerAccount:'';

                    let phoneInfoArray = userInfoRes.userInfo.phone?userInfoRes.userInfo.phone.split('-'):[];

                    userInfo.phonePrefix = phoneInfoArray[0]?phoneInfoArray[0]:'+86';
                    userInfo.phone = phoneInfoArray[1]?phoneInfoArray[1]:'';

                    userInfo.orgInfoArray = userInfoRes.userInfo.organizations?
                        userInfoRes.userInfo.organizations[0].ids.split(','):[];

                    yield put({
                        type: 'updateUserInfo',
                        payload: {
                            ...userInfo,
                            orgInfo
                        },
                    });

                    return;
                }
            }

            onFailed && onFailed();

        },
        *saveUserInfo({ payload }, { call, put }){

            const currentUser= getAuthority();
            const onFailed = payload&&payload.onFailed?payload.onFailed:function onFailed(){};
            const onSuccessed = payload&&payload.onSuccessed?payload.onSuccessed:function onSuccessed(){};

            const accountInfo = payload&&payload.params?payload.params:{};

            let newUserInfo = {
                email:accountInfo.email,
                realName:accountInfo.realName,
                sex:1,
                tutor:accountInfo.tutor,
                phone:accountInfo.phonePrefix+"-"+accountInfo.phone,
                organizationId:accountInfo.orgInfoArray[1],
            };

            //console.log("Update newUserInfo",newUserInfo);

            const updateUserInfoRes = yield call(apiService.updateUserInfo,currentUser.username,newUserInfo);

            if(updateUserInfoRes.success){
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


                    yield put(routerRedux.replace(redirect));
                }

                onSuccessed && onSuccessed();
            }else{
                onFailed && onFailed();
            }
        },
    },
    reducers:{
        updateUserInfo(state,{payload}){
            //console.log("updateJob",payload);
            return {
                ...state,
                ...payload
            }
        }
    },
}
