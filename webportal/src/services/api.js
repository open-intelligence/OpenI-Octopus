import request,{requestAsText,requestAsRaw} from '@/utils/request';
import { getAuthority } from '@/utils/authority';
import { getSshFileExt } from '@/utils/utils';

export default async function requestWithAuth(url,options={}){
    let authority = getAuthority();

    options.headers = options.headers || {method:"GET"};

    authority && authority.token && ( options.headers.Authorization = `Bearer ${authority.token}`);

    return await request(url,options);
}

export async function loadJobs() {
    let response  = await requestWithAuth('/api/v1/jobs');

    if (response && 'S000' === response.code){
        return {
            success:true,
            jobs:response.payload
        };
    }

    return {
        success:false
    };
}


export async function thirdPartyUserInfo(token) {
    let response =  await request('/api/v1/user/info',{
        headers: {
            Authorization: `Bearer ${token}`,
        }
    });

    if (response && 'S000' !== response.code){
        return {
            success:false,
            message:response.msg
        };
    }

    return {
        success:true,
        payload:response.payload,
    };
}

export async function thirdPartyRegister(accountInfo,token_3rd){
    let response  = await request('/api/v1/third/user/register',{
        method:'POST',
        headers: {
            Authorization: `Bearer ${token_3rd}`,
        },
        body:accountInfo
    });

    return response;
}

export async function accountRegister(accountInfo){
    return await requestWithAuth('/api/v1/user',{
        method:'POST',
        body:accountInfo
    });
}

export async function accountLogin(params) {
    return  request('/api/v1/token', {
        method: 'POST',
        body: params,
    });
}


export async function updatePassword(params){
    let _params = Object.assign({},params);
    if(!_params.username){
        let authority = getAuthority();
        _params.username = authority.username
    }
    let response  = await requestWithAuth('/api/v1/user',{
        method:'PUT',
        body:_params
    });

    if (response&&'S000' != response.code){
        return {
            success:false,
            message:response.msg
        };
    }

    return {
        success:true,
    };
}

export async function loadHardwareInfo(){

    let response  = await requestWithAuth('/api/v1/hardwares');

    if (response &&'S000' === response.code){
        return {
            success:true,
            hardwareInfo:response.payload
        };
    }

    return {
        success:false
    };
}

export async function stopJob(params) {
    return  await requestWithAuth('/api/v1/jobs/'+params.jobName,{
        method: 'delete'
    });
}

export async function downloadSshFile({jobName, containerId}){
    let authority = getAuthority();
    let response  = await requestAsRaw('/api/v1/jobs/' + jobName + '/' + containerId + '/ssh/file?e=' + getSshFileExt(),{
        headers: {
            Authorization: `Bearer ${authority.token}`,
        }
    });
    return response;
}

export async function loadJob(params){

    let response = await requestWithAuth('/api/v1/jobs/'+params.jobName)

    if (response && 'S000' === response.code){
        return {
            success:true,
            job:response.payload
        };
    }

    return {
        success:false
    };
}


export async function getServices(){

    let response  = await requestWithAuth('/api/v1/services',{
        method: 'GET'
    });

    if (response && 'S000' === response.code){
        return {
            success:true,
            services:response.payload
        };
    }

    return {
        success:false
    };
}

export async function loadImageSet(){

    let response = await requestWithAuth('/api/v1/imagesets');

    if (response && 'S000' === response.code){
        return {
            success:true,
            ...response
        };
    }

    return {
        success:false,
        msg:response?response.msg:''
    };
}


export async function loadDataSet(){

    let response = await requestWithAuth('/api/v1/dataset');

    if (response && 'S000' === response.code){
        return {
            success:true,
            ...response
        };
    }

    return {
        success:false,
        msg:response?response.msg:''
    };
}

export async function loadVirtualClusters(){
    return await requestWithAuth('/api/v1/virtual-clusters');
}

export async  function submitJob(job){

    try{

        let response = await requestWithAuth(`/api/v1/jobs/${job.jobName}`,{
            method: 'PUT',
            headers: {
                "Content-Type":"application/json"
            },
            body:job,
        });


        if (response&&'S000' !== response.code){
            return {
                success:false,
                message:response.message
            };
        }

        return {
            success:true
        };

    }catch(e){
        //console.log(e);
        return {
            success:false,
            message:e.message
        };
    }
}


export async function loadJobConfig(job_name){

    let response = await requestWithAuth(`/api/v1/jobs/${job_name}/config`);

    if (response && 'S000' === response.code){
        return {
            success:true,
            job:response.payload
        };
    }

    return {
        success:false
    };

}

export async function loadJobSSH(job_name){

    let response = await requestWithAuth(`/api/v1/jobs/${job_name}/ssh`);

    if (response&&'S000' === response.code){
        return {
            success:true,
            msg:'',
            sshInfo:response.payload
        };
    }

    return {
        success:false,
        msg:response?response.msg:''
    };
}


export async function loadGPUTypes(){
    let response = await requestWithAuth("/api/v1/job/platform");

    if(response && "S000" === response.code){
        return {
            success:true,
            gpus:response.payload
        };
    }

    return {
        success:false,
        msg:response?response.msg:''
    };

}



export async function loadImageWithGpuType (gpu_type){
    let response = await requestWithAuth("/api/v1/imagesets?platformKey="+gpu_type);

    if(response && "S000" === response.code){
        return {
            success:true,
            images:response.payload
        };
    }

    return {
        success:false,
        msg:response?response.msg:''
    };
}

export async function loadGPUAndImages (){
    let rsp = await requestWithAuth("/api/v1/job/platform/imageSet?t="+Date.now());

    if(rsp && "S000" === rsp.code){
        return {
            success:true,
            list:rsp.payload
        };
    }

    return {
        success:false,
        msg:rsp?rsp.msg:''
    };
}


export async function getUserInfo(username){
    let rsp = await requestWithAuth("/api/v1/user/"+username);

    if(rsp && "S000" === rsp.code){
        return {
            success:true,
            userInfo:rsp.payload
        };
    }

    return {
        success:false,
        msg:rsp?rsp.msg:''
    };
}

export async function updateUserInfo(username,newUserInfo){

    let rsp  = await requestWithAuth("/api/v1/user/"+username,{
        method:'PUT',
        body:newUserInfo
    });

    if(rsp && "S000" === rsp.code){
        return {
            success:true,
            userInfo:rsp.payload
        };
    }

    return {
        success:false,
        msg:rsp?rsp.msg:''
    };
}

export async function getOrgInfo(){
    let rsp = await requestWithAuth("/api/v1/ogz");

    if(rsp && "S000" === rsp.code){
        return {
            success:true,
            orgInfo:rsp.payload
        };
    }

    return {
        success:false,
        msg:rsp?rsp.msg:''
    };
}


export async function loadJobLimit(){
    let rsp = await requestWithAuth("/api/v1/jobs/limit?t="+Date.now());

    if(rsp && "S000" === rsp.code){
        return {
            success:true,
            limit:rsp.payload
        };
    }

    return {
        success:false,
        msg:rsp?rsp.msg:''
    };
}


export async function recordDayActiveUser(){

    let response = await requestWithAuth('/api/v1/operation/',{
        method:'POST',
        body:{
            "action": "userLogin"
        }
    });

    if (response && 'S000' === response.code){
        return {
            success:true,
            job:response.payload
        };
    }

    return {
        success:false
    };
}


export async function recordSucceedSubmitJob(jobName){

    let response = await requestWithAuth('/api/v1/operation/',{
        method:'POST',
        body:{
            "action": "createJob",
            "actionInfo": {
                "jobId": jobName
            }
        }
    });

    if (response && 'S000' === response.code){
        return {
            success:true,
            job:response.payload
        };
    }

    return {
        success:false
    };
}


export async function waitTime(sec) {
    await new Promise(function (resolve, reject) {
        setTimeout(function () {
            resolve();
        },sec*1000);
    });

    return true;
}


export async function getTaskTrackingPageInfo(url) {
    let response = await requestAsText(url,{method:'GET'});

    return response;
}

export async function getCommitImageStatus(jobName,taskContainerId) {
    let url = "/api/v1/jobs/"+jobName+"/queryImage?taskContainerId="+taskContainerId;

    let response = await requestWithAuth(url,{method:'GET'});

    if (response && 'S000' === response.code){
        return {
            success:true,
            imageStatus:response.payload
        };
    }

    return {
        success:false
    };
}


export async function commitImage(ip,jobName,taskContainerId,imageDescription) {

    let response = await requestWithAuth('/api/v1/jobs/'+jobName+'/commitImage',{
        method:'POST',
        body:{
            ip,
            taskContainerId,
            imageDescription
        }
    });

    return response;
}


export async function loadContainerLog(job,taskPod,container,pageSize,pageNumber) {

    let logIndex = (pageNumber-1)*pageSize;
    //container = "03db5f4ec6e2fa76d0580c17b0b1e0d68f754385cca5359de49fbdcf64e0694a";
    let response = await request('/es/_search',{
        method:'POST',
        body:{
            query: {
                match:{
                    "log.file.path": "/var/lib/docker/containers/"+
                        container+"/"+container+"-json.log"
                }
            },
            size:pageSize,
            from:logIndex,
            sort: "log.offset"
        }
    });

    return response;
}
