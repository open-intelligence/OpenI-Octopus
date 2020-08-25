import request,{requestAsText,requestAsRaw} from '@/utils/request';
import { getAuthority } from '@/utils/authority';
import { getSshFileExt } from '@/utils/utils';

export default async function requestWithAuth(url,options={}){
    let authority = getAuthority();

    options.headers = options.headers || {method:"GET"};

    authority && authority.token && ( options.headers.Authorization = `Bearer ${authority.token}`);

    return await request(url,options);
}

export async function loadJobsSummary(){

    let response  = await requestWithAuth('/api/v1/jobs/status/summary');

    if (response &&'S000' === response.code){
        return {
            success:true,
            jobsSummary:response.payload
        };
    }

    return {
        success:false
    };
}

export async function loadJobs(pageSize,pageNumber,searchParamStr) {


    let offset = (pageNumber-1)*pageSize;

    let response  = await requestWithAuth('/api/v1/jobs?size='+pageSize+'&offset='+offset + searchParamStr);

    if (response && 'S000' === response.code){
        return {
            success:true,
            jobs:response.payload.jobs,
            totalSize: response.payload.totalSize
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
            message:response.msg,
            code: response.code
        };
    }

    return {
        success:true,
    };
}

export async function stopJob(params) {
    return  await requestWithAuth('/api/v1/jobs/'+params.jobId,{
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

    let response = await requestWithAuth('/api/v1/jobs/'+params.jobId)

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

export async function loadImageSet(){

    let response = await requestWithAuth('/api/v1/image/list');

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


export async function loadJobConfig(jobId){

    let response = await requestWithAuth(`/api/v1/jobs/${jobId}/config`);

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


export async function recordSucceedSubmitJob(jobId){

    let response = await requestWithAuth('/api/v1/operation/',{
        method:'POST',
        body:{
            "action": "createJob",
            "actionInfo": {
                "jobId": jobId
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

export async function getCommitImageStatus(jobId,taskContainerId) {
    let url = "/api/v1/jobs/"+jobId+"/queryImage?taskContainerId="+taskContainerId;

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


export async function commitImage(ip,jobId,taskContainerId,imageTag,imageDescription) {

    let response = await requestWithAuth('/api/v1/jobs/'+jobId+'/commitImage',{
        method:'POST',
        body:{
            ip,
            taskContainerId,
            imageTag,
            imageDescription
        }
    });

    return response;
}

export async function loadContainerLogFistPageAndPageToken(taskPod,pageSize,pageTokenExpired) {
    let searchPath = __WEBPORTAL__.logServiceUri + '/_search?_source=message&scroll='+pageTokenExpired;
    let response = await request(searchPath,{
        method:'POST',
        body:{
            query: {
                match:{
                    "kubernetes.pod.name": taskPod
                }
            },
            size:pageSize,
            sort: "log.offset"
        }
    });

    return response;
}

export async function loadContainerLogByPageToken(pageTokenExpired,pageToken) {
    let searchPath = __WEBPORTAL__.logServiceUri + '/_search/scroll';
    
    let response = await request(searchPath,{
        method:'POST',
        body:{
            scroll:pageTokenExpired,
            scroll_id: pageToken
        }
    });

    return response;
}