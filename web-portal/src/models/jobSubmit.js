import { routerRedux } from 'dva/router';
import {loadImageSet,submitJob,loadJobConfig,loadGPUAndImages,loadJobLimit,waitTime,recordSucceedSubmitJob} from "@/services/api"
import {formatMessage } from 'umi/locale';
import { getAuthority } from '@/utils/authority';


import {format_job,getJobNameSuffix} from "@/utils/utils";

const checkLimit = (limit,job)=>{

    let cpu = 0,gpu = 0,mem = 0,shmMB = 0;

    for(let i=0;i<job.taskRoles.length;i++){
        let task = job.taskRoles[i];
        let num = job.taskRoles[i].taskNumber || 0;

        cpu+= (task.cpuNumber || 0) * num;
        gpu+= (task.gpuNumber || 0) * num;
        mem += (task.memoryMB || 0) * num;
        shmMB += (task.shmMB || 0) * num;
    }

    cpu+= limit.jobTypeProcessingJobNumMap.cpu;
    gpu+= limit.jobTypeProcessingJobNumMap.gpu;
    mem += limit.jobTypeProcessingJobNumMap.mem;
    shmMB += limit.jobTypeProcessingJobNumMap.shmMB;

    if(cpu > limit.cpuNumber){
        return formatMessage({id:"jobConfig.limit.cpu"})+ limit.cpuNumber+".";
    }

    if(gpu > limit.gpuNumber){
        return formatMessage({id:"jobConfig.limit.gpu"})+ limit.gpuNumber+'.';
    }

    if(mem > limit.memoryMB){
        return formatMessage({id:"jobConfig.limit.memery"})+limit.memoryMB +"MB.";
    }

    if(shmMB > limit.shmMB){
        return formatMessage({id:"jobConfig.limit.shmMB"}) + limit.shmMB +"MB.";
    }

    if($JobTypesFilter.cpuTypeMap[job.gpuType])
    {
        if(limit.jobTypeProcessingJobNumMap.cpuJobNum >= (limit.maxAvailableCPUJob || 0)){
            return formatMessage({id:"jobConfig.limit.jobCPUNumber"}) + limit.maxAvailableCPUJob;
        }
    }else{
        //the other type is gup type
        if(limit.jobTypeProcessingJobNumMap.gpuJobNum >= (limit.maxAvailableGPUJob || 0)){
            return formatMessage({id:"jobConfig.limit.jobGPUNumber"}) + limit.maxAvailableGPUJob;
        }
    }

    return null;

};

const initState = {
    loading:false,             //页面是否加载状态
    subTaskListLoading:false, //子任务列表loading,删除容易删除同一个两次
    jobInfoError:false, //子任务列表提交，导出，都不能为空
    jobInfoErrorMsg:'',      //子任务列表错误信息
    taskEditorVisible:false,//子任务编辑面板是否打开

    gpuTypeMap:{},          //服务器可用gpu的platformKey列表

    jobName :"",           //当前任务的填写的名字
    jobNameSuffix:"",  //当前任务名的后缀名
    retryCount :0,         //当前任务的填写的重试次数, 默认值0


    constGpuTypeMap: {      //用户不能修改该种类型的子任务参数
        'debug':'debug',
        'debug_cpu':'debug_cpu'
    },
    gpuType:"",        //当前任务的选择的GPUType，默认值debug
    images:[],             //当前GPU类型映射的只可显示选择的镜像列表
    task_recommend:{},     //当前任务选择的GPUType映射的，创建子任务需要显示的默认模版
    image:"",              //当前任务的选择的镜像
    currentSubTask:{},     //当前正在编辑的子任务
    taskRoles:[],          //当前子任务列表
    visiableSubmitDebugJobModel:false,
    debugJob:{},
};

const getGpuTypeMapInfo = (gpuType,gpuTypeMap)=>{
    let gpuMapInfo = {};

    if(gpuTypeMap[gpuType]){
        gpuMapInfo.images = gpuTypeMap[gpuType].images;
        gpuMapInfo.task_recommend = gpuTypeMap[gpuType].standard;
    }

    return gpuMapInfo;
};

const generateReactSubTasks = (taskRoles)=>{
    return taskRoles.map((task,index)=>{
        task.operations = true;
        task.key = index;
        return task;
    });
};

const getJobStateData = (jobConfigData,gpuTypeMap,constGpuTypeMap) => {
    let gpuTypeMapInfo = {};
    if(jobConfigData && gpuTypeMap[jobConfigData.gpuType]){

        //suit for jobName with "-"
        jobConfigData.jobName = jobConfigData.jobName.replace("-","");
        //remove job name suffix;
        jobConfigData.jobName = jobConfigData.jobName?jobConfigData.jobName.substring(0,jobConfigData.jobName.length-6):"";

        jobConfigData.jobNameSuffix = getJobNameSuffix();

        //界面层不能修改constGpuTypeMap的子任务参数，和每次改变都需要重置子任务列表
        if(constGpuTypeMap[jobConfigData.gpuType])
        {
            jobConfigData.taskRoles = [];
        }else{
            jobConfigData.taskRoles = generateReactSubTasks(jobConfigData.taskRoles);
        }

        //initState gpuType 映射信息：对应的images和task_recommend模版
        gpuTypeMapInfo = getGpuTypeMapInfo(jobConfigData.gpuType,gpuTypeMap);
    }else{
        gpuTypeMapInfo = getGpuTypeMapInfo(initState.gpuType,gpuTypeMap);
        jobConfigData = {};
        jobConfigData.gpuType = '';
    }

    return {
        ...jobConfigData,
        ...gpuTypeMapInfo
    };
};

export default {
    namespace: 'jobSubmit',

    state: {
        ...initState
    },

    effects:{
        *loadData({payload},{ call, put }){

           const deepCopyInitialState = JSON.parse(JSON.stringify(initState));

            yield put({
                type: 'resetState',
                payload: {
                    state:{
                        ...deepCopyInitialState,
                        loading:true
                    }
                },
            });

            const onFailed = payload&&payload.onFailed?payload.onFailed:function onFailed(){};

            let rsp = yield call(loadGPUAndImages);

            if(!rsp.success){

                return onFailed && onFailed(formatMessage({id:"jobConfig.error.load_failed_gpu"}))
            }

            let gpuTypeMap = {};
            let gpus = rsp.list.map(gpuInfo=>{
                gpuTypeMap[gpuInfo.platformKey] = gpuInfo;
                return gpuInfo;
            }) || [];

            if(gpuTypeMap["debug_cpu"]&&gpuTypeMap["debug"]){
                gpuTypeMap["debug_cpu"].imageSets = gpuTypeMap["debug"].imageSets;
            }

            for(let gpuType in gpuTypeMap)
            {
                gpuTypeMap[gpuType].images = gpuTypeMap[gpuType].imageSets.map(it=>{
                    return {
                        id:it.id,
                        name:it.name,
                        value:it.place
                    };
                });

                delete gpuTypeMap[gpuType].imageSets;
            }



            let jobConfig = null;
            let href = window.location.href;
            let matcher = (/resubmitName=([^&^\s]*)/).exec(href);

            if (matcher){

                rsp = yield call(loadJobConfig,matcher[1]);

                if(!rsp.success){

                    return onFailed && onFailed(formatMessage({id:"jobConfig.error.load_failed_job"}));
                }

                jobConfig = format_job(rsp.job);
            }

            const jobStateData = getJobStateData(jobConfig,gpuTypeMap,deepCopyInitialState.constGpuTypeMap);

            yield put({
                type:'resetState',
                payload:{
                    state:{
                        gpuTypeMap:gpuTypeMap,
                        ...jobStateData,
                        loading:false
                    }
                }
            });
        },

        *submitJob({payload},{ call, put }){

            yield put({
                type: 'resetState',
                payload: {
                    state:{
                        loading:true
                    }
                },
            });

            //提交开始loading,失败去掉loading,因为加载数据成功后，提交失败，还是是可以导出等其他操作

            const onFailed = payload && payload.onFailed ? payload.onFailed : function onFailed(){};
            const onSuccessed = payload && payload.onSuccessed ? payload.onSuccessed : function onSuccessed(){};

            let job = {
                ...payload.job
            };

            // check the job limiter
            let rsp = yield call(loadJobLimit);


            if(!rsp.success){

                //失败取消loading
                yield put({
                    type: 'resetState',
                    payload: {
                        state:{
                            loading:false
                        }
                    },
                });

                return onFailed && onFailed(formatMessage({id:"jobConfig.error.load_limit_failed"}));
            }

            let limit = rsp.limit;
            if(limit.enabledLimiter){

                limit.jobTypeProcessingJobNumMap = {gpu:0,cpu:0,mem:0,shmMB:0,gpuJobNum:0,cpuJobNum:0};

                for(let jobInfo of limit.jobInfoList){
                    let jobType = jobInfo.type;
                    let jobState = jobInfo.state;
                    let jobTasks = jobInfo.taskRoles;
                    if($JobTypesFilter.cpuTypeMap[jobType]){
                        if(jobState==="RUNNING" || jobState==="WAITING")
                        {
                            limit.jobTypeProcessingJobNumMap.cpuJobNum ++;

                            for(let task of jobTasks) {
                                limit.jobTypeProcessingJobNumMap.cpu += task.cpuNumber;
                                limit.jobTypeProcessingJobNumMap.gpu += task.gpuNumber;
                                limit.jobTypeProcessingJobNumMap.mem += task.memoryMB;
                                limit.jobTypeProcessingJobNumMap.shmMB += task.shmMB;
                            }
                        }
                    }else{
                        if(jobState==="RUNNING" || jobState==="WAITING")
                        {
                            limit.jobTypeProcessingJobNumMap.gpuJobNum ++;

                            for(let task of jobTasks) {
                                limit.jobTypeProcessingJobNumMap.cpu += task.cpuNumber;
                                limit.jobTypeProcessingJobNumMap.gpu += task.gpuNumber;
                                limit.jobTypeProcessingJobNumMap.mem += task.memoryMB;
                                limit.jobTypeProcessingJobNumMap.shmMB += task.shmMB;
                            }
                        }
                    }
                }

                delete limit.jobInfoList;

                let errorMsg = checkLimit(limit,job);

                if(errorMsg){

                    //失败取消loading
                    yield put({
                        type: 'resetState',
                        payload: {
                            state:{
                                loading:false
                            }
                        },
                    });

                    return onFailed && onFailed(errorMsg);
                }
            }

            let response = null;
            try{
                response = yield call(submitJob,job);

                yield call(waitTime,3);

                if(response.success){

                    onSuccessed && onSuccessed();

                    yield call(recordSucceedSubmitJob,job.jobName);

                    yield put({
                        type: 'resetState',
                        payload: {
                            state:{
                                loading:false
                            }
                        },
                    });

                    yield put(
                        routerRedux.push({
                            pathname: '/openi/v2/brain/jobList'
                        })
                    );


                }else{

                    //失败取消loading
                    yield put({
                        type: 'resetState',
                        payload: {
                            state:{
                                loading:false
                            }
                        },
                    });

                    onFailed && onFailed(formatMessage({id:"jobConfig.error.submit_failed"}));
                }

            }catch(e){
                //console.log(e);

                //失败取消loading
                yield put({
                    type: 'resetState',
                    payload: {
                        state:{
                            loading:false
                        }
                    },
                });

                onFailed && onFailed(formatMessage({id:"jobConfig.error.submit_failed"}));
            }
        }

    },

    reducers:{
        importJob(state,{payload}){
            const jobStateData = getJobStateData(payload.jobConfig,state.gpuTypeMap,state.constGpuTypeMap);

            return {
                ...state,
                ...jobStateData,
            }
        },
        changeJobNameSuffix(state,{payload}){
            return {
                ...state,
                jobNameSuffix: getJobNameSuffix()
            }
        },
        createSubTask(state,{payload}){
            return {
                ...state,
                currentSubTask:{...state.task_recommend},
                taskEditorVisible:true
            }
        },
        copySubTask(state,{payload}){
            let next = {
                ...state
            };

            let copyTask = {...payload.taskRecord};
            //去掉相同的id
            delete copyTask.id;

            copyTask.name = (copyTask.name.split("00"))[0] + "00" + new Date().getTime();

            next.taskRoles.push(copyTask);

            //重新生成React界面子任务列表
            next.taskRoles =  generateReactSubTasks(next.taskRoles);

            return next;
        },
        deleteSubTask(state,{ payload }){

            //console.log("删除任务", payload.taskRecord);
            //点击很快的时候，会同时删除同一个index两次，造成找不到deleteTask
            let deleteTask = payload.taskRecord;

            if(deleteTask){
                let tasks = state.taskRoles || [];

                //删除原来自任务列表中的自己,保留其他任务
                tasks = tasks.filter(it=>{
                    return it.name !== deleteTask.name;
                });

                let next = {
                    ...state,
                    subTaskListLoading:false
                };

                next.taskRoles = generateReactSubTasks(tasks);
                return next;
            }else{
                //找不到deleteTask,返回原来state,去掉子任务列表loading
                return {
                    ...state,
                    subTaskListLoading:false
                };
            }
        },
        editSubTask(state,{payload}){

            return {
                ...state,
                currentSubTask:{...payload.taskRecord},
                taskEditorVisible:true
            }
        },

        submitSubTask(state,{payload}){


            let taskRoles = state.taskRoles; //数组

            let modifiedTaskName = state.currentSubTask.name;

            let submitTask = {};
            //modify sub task
            if(modifiedTaskName){
                let modifiedTaskIndex = state.currentSubTask.key;
                submitTask = {
                    ...state.currentSubTask,
                    ...payload.submitTask
                };
                taskRoles[modifiedTaskIndex] = submitTask;
            }else{
                //create sub task, name is undefined
                submitTask = payload.submitTask;
                taskRoles.push(submitTask);
            }

            //重新生成React界面子任务列表
            let tasks = taskRoles.map((task,index)=>{
                task.operations = true;
                task.key = index;
                return task;
            });



            return {
                ...state,
                taskRoles: tasks,
                taskEditorVisible:false, //关闭编辑面板
                currentSubTask: {...submitTask} //改变提交的任务为当前子任务，创建子任务重新改变currentSubTask，界面才会检查到改变，重新渲染界面
            }
        },
        resetDebugJob(state,{payload}){
            return {
                ...state,
                taskRoles: [],
                retryCount:0
            }
        },
        showSubmitDebugJobModel(state,{payload}){
            return {
                ...state,
                visiableSubmitDebugJobModel:true,
                debugJob:payload.job,
            }
        },
        closeSubmitDebugJobModel(state,{payload}){
            return {
                ...state,
                visiableSubmitDebugJobModel:false
            }
        },
        showSubTaskListLoading(state,{payload}){
            return {
                ...state,
                subTaskListLoading:true
            }
        },
        changeJobInfoError(state,{payload}){
            return {
                ...state,
                jobInfoError:payload.jobInfoError,
                jobInfoErrorMsg:payload.jobInfoErrorMsg
            }
        },
        closeTaskEditor(state,{payload}){
            return {
                ...state,
                taskEditorVisible:false
            }
        },

        resetState(state,{payload}){

            //console.log("old state:",state,",new state:",payload.state);

            let nextState = {
                ...state,
                ...payload.state
            };

            return nextState;
        },
        changeGPUType(state,{ payload }){

            let gpu_type = payload.gpuType;

            const gpuTypeMapInfo = getGpuTypeMapInfo(gpu_type,state.gpuTypeMap);

            let next = {
                ...state,
                ...gpuTypeMapInfo
            };

            next.gpuType = gpu_type;

            next.image = "";

            return next;
        },


    }

}
