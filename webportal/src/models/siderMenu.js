import * as apiService from '@/services/api';


const getMenuInfo = ()=>{

    const addressUrl = window.location.href;

    let lastMenuKey = '';
    let openSubMenus=[''];

    if(addressUrl.lastIndexOf('/overview') !== -1)
    {
        lastMenuKey = '';
        openSubMenus=[''];
    }else if(addressUrl.lastIndexOf('/submit') !== -1){
        lastMenuKey = '1';
        openSubMenus=[''];
    }else if(addressUrl.lastIndexOf('/jobs') !== -1){
        lastMenuKey = '2';
        openSubMenus=[''];
    }else if(addressUrl.lastIndexOf('/imageset') !== -1){
        lastMenuKey = '3';
        openSubMenus=[''];
    }else if(addressUrl.lastIndexOf('/dataset') !== -1){
        lastMenuKey = '4';
        openSubMenus=[''];
    }else if(addressUrl.lastIndexOf('/virtualClusters') !== -1){
        lastMenuKey = '5';
        openSubMenus=[''];
    }else if(addressUrl.lastIndexOf('/services') !== -1){
        lastMenuKey = 'adminSub.1';
        openSubMenus=['adminSub'];
    }else if(addressUrl.lastIndexOf('/hardware') !== -1){
        lastMenuKey = 'adminSub.2';
        openSubMenus=['adminSub'];
    }else if(addressUrl.lastIndexOf('/dashboard') !== -1){
        lastMenuKey = 'adminSub.3';
        openSubMenus=['adminSub'];
    }else if(addressUrl.lastIndexOf('/register') !== -1){
        lastMenuKey = 'adminSub.4';
        openSubMenus=['adminSub'];
    }else{
        lastMenuKey = '';
        openSubMenus=[''];
    }

    return {lastMenuKey,openSubMenus};
};


export default {
    namespace: 'siderMenu',

    state: {
        lastMenuKey: '',
        openSubMenus:['']
    },

    reducers:{
        initSiderMenuInfo(state,{}){

            let menuInfo = getMenuInfo();

            //console.log("initSiderMenuInfo",menuInfo);

            if(menuInfo.lastMenuKey == state.lastMenuKey && menuInfo.openSubMenus[0] == menuInfo.openSubMenus[0]){
                return state;
            }else{
                return {
                    ...state,
                    ...menuInfo
                }
            }


        },
        updateSiderMenuInfo(state,{payload}){
            return {
                ...state,
                ...payload
            }
        },

    }
}
