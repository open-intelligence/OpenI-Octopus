// Copyright (c) Microsoft Corporation
// All rights reserved.
//
// MIT License
//
// Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated
// documentation files (the "Software"), to deal in the Software without restriction, including without limitation
// the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and
// to permit persons to whom the Software is furnished to do so, subject to the following conditions:
// The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING
// BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
// NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

import * as routerRedux from "react-router-redux";
import {stringify} from "qs";

import { setAuthority,getAuthority } from '@/utils/authority';


const cloudBrainMenus = {
    "overview": "/openi/v2/brain/overview",
    "submitJob": "/openi/v2/brain/submitJob",
    "jobList" : "/openi/v2/brain/jobList",
    "imageList": "/openi/v2/brain/imageList",
    "datasetList": "/openi/v2/brain/datasetList"
};

const adminMenus = {
    "monitor": "/openi/v2/brain/monitor",
    "register": "/openi/v2/brain/register"
};


const userMenus = {
    "setUserInfo": '/openi/v2/brain/userInfo',
    "changePwd": "/openi/v2/brain/changePwd"
};

const getGlobalInfo = ()=>{

    const currentLoginStatus = getAuthority();

    const addressUrl = window.location.href;

    let shouldLoginByPath = false;
    let globalMenuKey = 'home';
    let siderMenuKey='';
    let menuKeyMap = {};

    if(addressUrl.lastIndexOf('/home') !== -1)
    {
        globalMenuKey = 'home';
        siderMenuKey='';
        menuKeyMap = {};
    }else if(addressUrl.lastIndexOf('/ascend') !== -1){
        globalMenuKey = 'ascend';
        siderMenuKey='';
        menuKeyMap = {};

        shouldLoginByPath =currentLoginStatus?!currentLoginStatus.status:true;

    }else if(addressUrl.lastIndexOf('/overview') !== -1){
        globalMenuKey = 'cloudbrain';
        siderMenuKey='overview';
        menuKeyMap = cloudBrainMenus;


        shouldLoginByPath =currentLoginStatus?!currentLoginStatus.status:true;

    }else if(addressUrl.lastIndexOf('/submitJob') !== -1){
        globalMenuKey = 'cloudbrain';
        siderMenuKey='submitJob';
        menuKeyMap = cloudBrainMenus;

        shouldLoginByPath =currentLoginStatus?!currentLoginStatus.status:true;

    }else if(addressUrl.lastIndexOf('/jobList') !== -1){
        globalMenuKey = 'cloudbrain';
        siderMenuKey='jobList';
        menuKeyMap = cloudBrainMenus;

        shouldLoginByPath =currentLoginStatus?!currentLoginStatus.status:true;

    }else if(addressUrl.lastIndexOf('/job') !== -1){
        globalMenuKey = 'cloudbrain';
        siderMenuKey='';
        menuKeyMap = cloudBrainMenus;

        shouldLoginByPath =currentLoginStatus?!currentLoginStatus.status:true;

    }else if(addressUrl.lastIndexOf('/imageList') !== -1){
        globalMenuKey = 'cloudbrain';
        siderMenuKey='imageList';
        menuKeyMap = cloudBrainMenus;

        shouldLoginByPath =currentLoginStatus?!currentLoginStatus.status:true;

    }else if(addressUrl.lastIndexOf('/datasetList') !== -1){
        globalMenuKey = 'cloudbrain';
        siderMenuKey='datasetList';
        menuKeyMap = cloudBrainMenus;

        shouldLoginByPath =currentLoginStatus?!currentLoginStatus.status:true;

    }else if(addressUrl.lastIndexOf('/userInfo') !== -1){
        globalMenuKey = 'cloudbrain';
        siderMenuKey='';
        menuKeyMap = cloudBrainMenus;

        shouldLoginByPath =currentLoginStatus?!currentLoginStatus.status:true;

    }else if(addressUrl.lastIndexOf('/userInfo') !== -1){
        globalMenuKey = 'cloudbrain';
        siderMenuKey='';
        menuKeyMap = cloudBrainMenus;

        shouldLoginByPath =currentLoginStatus?!currentLoginStatus.status:true;

    }else if(addressUrl.lastIndexOf('/changePwd') !== -1){
        globalMenuKey = 'cloudbrain';
        siderMenuKey='';
        menuKeyMap = cloudBrainMenus;

        shouldLoginByPath =currentLoginStatus?!currentLoginStatus.status:true;

    }else if(addressUrl.lastIndexOf('/monitor') !== -1){
        globalMenuKey = 'admin';
        siderMenuKey='monitor';
        menuKeyMap = adminMenus;

        shouldLoginByPath =currentLoginStatus?!currentLoginStatus.status:true;

    }else if(addressUrl.lastIndexOf('/register') !== -1){
        globalMenuKey = 'admin';
        siderMenuKey='register';
        menuKeyMap = adminMenus;

        shouldLoginByPath =currentLoginStatus?!currentLoginStatus.status:true;

    }else{

    }

    //console.log("addressUrl:",addressUrl);
    return {shouldLoginByPath,globalMenuKey,siderMenuKey,menuKeyMap};
};

let {shouldLoginByPath,globalMenuKey,siderMenuKey,menuKeyMap}= getGlobalInfo();

let initState = {
    ascendRootPath: __WEBPORTAL__.ascendUri===""?'http://'+ window.location.host:__WEBPORTAL__.ascendUri,
    //should check Login before access current page path
    shouldLoginByPath,
    menuKeyMap,
    globalMenuKey,
    siderMenuKey
};


export default {
    namespace: 'globalLayout',

    state: {
        ...initState
    },

    effects:{
        *toSetUserInfo({payload}, { call, put }){
            yield put(
                routerRedux.push({
                    pathname: userMenus.setUserInfo
                })
            );
        },
        *goToChangePwd({payload}, { call, put }){
            yield put(
                routerRedux.push({
                    pathname: userMenus.changePwd
                })
            );
        },
    },

    reducers:{

        updateMenuInfo(state,{payload}){
            let {shouldLoginByPath,globalMenuKey,siderMenuKey,menuKeyMap}= getGlobalInfo();

            return {
                ...state,
                shouldLoginByPath,
                globalMenuKey,
                siderMenuKey,
                menuKeyMap
            }
        }

    }
}
