import {Component} from "react";
import {Modal,Checkbox,Input,message,Select,Drawer,Form,Row,Col,Button,Icon,InputNumber,Popover,Spin,AutoComplete,Card,Divider,Alert,Popconfirm,Tag} from 'antd';
import {formatMessage,FormattedMessage} from 'umi/locale';

import StandardTable from '@/components/StandardTable';

import {exportAsJsonFile,choseFile,loadFromFile} from "@/utils/file";

import styles from "./index.less";

import {connect} from 'dva';

const Option = Select.Option;
const confirm = Modal.confirm;

const Joi = require('joi');

const namespace = "jobSubmit";

function mapStateToProps(state) {
    return {
        ...state.jobSubmit
    };
}


const mapDispatchToProps=(dispatch)=>{
    return {
        loadData:(onFailed)=>{
            dispatch({type:`${namespace}/loadData`,payload:{onFailed:onFailed}})
        },
        importJob:(jobConfig)=>{
            dispatch({type:`${namespace}/importJob`,payload:{jobConfig}})
        },
        changeJobNameSuffix:()=>{
            dispatch({type:`${namespace}/changeJobNameSuffix`})
        },
        createSubTask:()=>{
            dispatch({type:`${namespace}/createSubTask`})
        },
        copySubTask:(taskRecord)=>{
            dispatch({type:`${namespace}/copySubTask`,payload:{taskRecord}});
        },
        deleteSubTask:(taskRecord)=>{
            dispatch({type:`${namespace}/deleteSubTask`,payload:{taskRecord}});
        },
        editSubTask: (taskRecord) => {
            dispatch({type:`${namespace}/editSubTask`,payload:{taskRecord}});
        },
        submitSubTask: (submitTask) => {
            dispatch({type:`${namespace}/submitSubTask`,payload:{submitTask}})
        },
        showSubTaskListLoading:()=>{
            dispatch({type:`${namespace}/showSubTaskListLoading`})
        },
        changeCurrentTaskNeedIBDevice:(needIBDevice)=>{
            dispatch({type:`${namespace}/changeCurrentTaskNeedIBDevice`,payload:{needIBDevice}});
        },
        changeCurrentTaskIsMainRole:(isMainRole)=>{
            dispatch({type:`${namespace}/changeCurrentTaskIsMainRole`,payload:{isMainRole}});
        },
        changeJobInfoError:(jobInfoError,jobInfoErrorMsg)=>{
            dispatch({type:`${namespace}/changeJobInfoError`,payload:{jobInfoError,jobInfoErrorMsg}});
        },
        closeTaskEditor: () => {
            dispatch({type:`${namespace}/closeTaskEditor`})
        },
        changeGpuType:(gpuType)=>{
            dispatch({type:`${namespace}/changeGPUType`,payload:{gpuType:gpuType}});
        },
        resetDebugJob:() =>{
            dispatch({type:`${namespace}/resetDebugJob`});
        },
        submitJob:(job,onFailed,onSuccessed)=>{
            dispatch({type:`${namespace}/submitJob`,payload:{job:job,onFailed,onSuccessed}});
        },
        showSubmitDebugJobModel:(job) => {
            dispatch({type:`${namespace}/showSubmitDebugJobModel`,payload:{job}});
        },
        closeSubmitDebugJobModel:() =>{
            dispatch({type:`${namespace}/closeSubmitDebugJobModel`});
        }
    }
};

@connect(mapStateToProps,mapDispatchToProps)
class JobSubmit extends Component {

    constructor(props){
        super(props);

    }

    subTaskColumnTitles = [
        formatMessage({id:'jobConfig.task_name.label'}),
        formatMessage({id:'jobConfig.is_main_role.label'}),
        formatMessage({id:'jobConfig.cpu_num.label'}),
        formatMessage({id:'jobConfig.gpu_num.label'}),
        formatMessage({id:'jobConfig.memery.label'}),
        formatMessage({id:'jobConfig.share_memery.label'}),
        formatMessage({id:'jobConfig.replicas_number.label'}),
        formatMessage({id:'jobConfig.min_succeeded_num.label'}),
        formatMessage({id:'jobConfig.min_failed_num.label'}),
        formatMessage({id:'jobConfig.ib_device.label'}),
        formatMessage({id:'jobConfig.command.label'}),
        formatMessage({id:'jobConfig.task.header.operations'}),
    ];

    subTaskColumnDataIndexs = [
        "name",
        "isMainRole",
        "cpuNumber",
        "gpuNumber",
        "memoryMB",
        "shmMB",
        "taskNumber",
        "minSucceededTaskCount",
        "minFailedTaskCount",
        "needIBDevice",
        "command",
        "operations",
    ];

    subTaskColumns = this.subTaskColumnDataIndexs.map((DataIndex,index)=>{

        let columnDef = {
            title: this.subTaskColumnTitles[index],
            dataIndex: this.subTaskColumnDataIndexs[index],
            key: this.subTaskColumnDataIndexs[index]
        };

        if(DataIndex === "needIBDevice"){
            return {
                ...columnDef,
                render: (needIBDevice,record) =>{
                    return <span>{needIBDevice?needIBDevice+'':false+''}</span>;
                }
            };
        } else if(DataIndex === "isMainRole"){
            return {
                ...columnDef,
                render: (isMainRole,record) =>{
                    return <span>{isMainRole?isMainRole+'':false+''}</span>;
                }
            };
        } else if(DataIndex === "minSucceededTaskCount" || DataIndex === "minFailedTaskCount"){
            return {
                ...columnDef,
                render: (mintaskCount,record) =>{
                    return <span>{mintaskCount?mintaskCount:1}</span>;
                }
            };
        }else if(DataIndex ==='operations'){
            return {
                ...columnDef,
                render:(operations,record) =>{

                    return (
                        <div>

                            <Tag visible={this.props.constGpuTypeMap[this.props.gpuType] !== undefined}
                                 style={{ background: '#d2d6de',color:'#fff', borderStyle: 'none' }}>
                                {formatMessage({id:'jobConfig.button.copy'})}
                            </Tag>
                            <Tag
                                visible={this.props.constGpuTypeMap[this.props.gpuType]===undefined}
                                color="#108ee9"
                                onClick={()=>{this.props.copySubTask(record)}}
                            >
                                {formatMessage({id:'jobConfig.button.copy'})}
                            </Tag>

                            <Tag visible={this.props.constGpuTypeMap[this.props.gpuType] !== undefined}
                                 style={{ background: '#d2d6de',color:'#fff', borderStyle: 'none' }}>
                                {formatMessage({id:'jobConfig.button.edit'})}
                            </Tag>
                            <Tag
                                visible={this.props.constGpuTypeMap[this.props.gpuType]===undefined}
                                color="#108ee9"
                                onClick={()=>{this.props.editSubTask(record)}}
                            >
                                {formatMessage({id:'jobConfig.button.edit'})}
                            </Tag>

                            <Popconfirm title={formatMessage({id:'jobConfig.button.delete.confirm'})} onConfirm={() => {
                                this.props.showSubTaskListLoading();
                                this.props.deleteSubTask(record)
                            }}>
                                <Tag
                                    color="#108ee9"
                                >
                                    {formatMessage({id:'jobConfig.button.delete'})}
                                </Tag>
                            </Popconfirm>
                        </div>
                    );
                }
            };
        }

        return {
            ...columnDef,
            render: (text) =>(
                <span>{text}</span>
            )
        };
    });


    componentWillMount(){
        //console.log("JobSubmit componentWillMount");

        this.props.loadData(function(errMsg){
            if(errMsg){
                message.error(errMsg);
            }
        });
    }


    componentWillReceiveProps(nextProps) {


        let newFormInfo={};

        //任务列表
        if(nextProps.jobName !== this.props.jobName){
            newFormInfo.jobName = nextProps.jobName;
        }

        if(nextProps.gpuType !== this.props.gpuType){
            newFormInfo.gpuType = nextProps.gpuTypeMap[nextProps.gpuType]?nextProps.gpuType:'';
        }

        if(nextProps.image !== this.props.image){
            newFormInfo.image = nextProps.image?nextProps.image:'';
        }

        if(nextProps.retryCount !== this.props.retryCount){
            newFormInfo.retryCount = nextProps.retryCount?nextProps.retryCount:0;
        }


        //子任务列表
        if (nextProps.currentSubTask.name !== this.props.currentSubTask.name) {
            newFormInfo.name = nextProps.currentSubTask.name?nextProps.currentSubTask.name:"";//推荐模版没有这一项设置为默认值
        }

        if (nextProps.currentSubTask.taskNumber !== this.props.currentSubTask.taskNumber) {
            newFormInfo.taskNumber = nextProps.currentSubTask.taskNumber?nextProps.currentSubTask.taskNumber:1;
        }

        if (nextProps.currentSubTask.minSucceededTaskCount !== this.props.currentSubTask.minSucceededTaskCount) {
            newFormInfo.minSucceededTaskCount = nextProps.currentSubTask.minSucceededTaskCount?nextProps.currentSubTask.minSucceededTaskCount:1;
        }

        if (nextProps.currentSubTask.minFailedTaskCount !== this.props.currentSubTask.minFailedTaskCount) {
            newFormInfo.minFailedTaskCount = nextProps.currentSubTask.minFailedTaskCount?nextProps.currentSubTask.minFailedTaskCount:1;
        }

        if (nextProps.currentSubTask.cpuNumber !== this.props.currentSubTask.cpuNumber) {
            newFormInfo.cpuNumber = nextProps.currentSubTask.cpuNumber?nextProps.currentSubTask.cpuNumber:1;
        }

        if (nextProps.currentSubTask.gpuNumber !== this.props.currentSubTask.gpuNumber) {
            newFormInfo.gpuNumber = nextProps.currentSubTask.gpuNumber?nextProps.currentSubTask.gpuNumber:0;
        }

        if (nextProps.currentSubTask.memoryMB !== this.props.currentSubTask.memoryMB) {
            newFormInfo.memoryMB = nextProps.currentSubTask.memoryMB?nextProps.currentSubTask.memoryMB:100;
        }

        if (nextProps.currentSubTask.shmMB !== this.props.currentSubTask.shmMB) {
            newFormInfo.shmMB = nextProps.currentSubTask.shmMB?nextProps.currentSubTask.shmMB:64;
        }

        if (nextProps.currentSubTask.command !== this.props.currentSubTask.command) {
            newFormInfo.command = nextProps.currentSubTask.command?nextProps.currentSubTask.command:"";//推荐模版没有这一项设置为默认值
        }

        if (nextProps.currentSubTask.needIBDevice !== this.props.currentSubTask.needIBDevice) {
            newFormInfo.needIBDevice = nextProps.currentSubTask.needIBDevice?nextProps.currentSubTask.needIBDevice:false;
        }

        if (nextProps.currentSubTask.isMainRole !== this.props.currentSubTask.isMainRole) {
            newFormInfo.isMainRole = nextProps.currentSubTask.isMainRole?nextProps.currentSubTask.isMainRole:false;
        }

        if(Object.keys(newFormInfo).length !== 0){
            this.props.form.setFieldsValue(newFormInfo);
            //console.log("set form fields",newFormInfo,"old props:",this.props,",new props:",nextProps);
        }
    }

    createSubTask= () => {
        if(this.props.gpuType === 'debug_cpu' && this.props.taskRoles.length>0)
        {

            Modal.info({
                title: formatMessage({id:'jobConfig.debug_cpu.onesubtask.confirm.title'}),
                content: '',
                onOk() {},
            });

        }else if(this.props.gpuType === 'debug' && this.props.taskRoles.length>1)
        {
            Modal.info({
                title: formatMessage({id:'jobConfig.debug.onesubtask.confirm.title'}),
                content: '',
                onOk() {},
            });

        }else{
            this.props.createSubTask();
        }
    };

    changeGpuType = (gpuType)=>{

        if(this.props.constGpuTypeMap[gpuType])
        {
            this.props.form.setFieldsValue({retryCount:0});
            this.props.resetDebugJob();
        }

        this.props.changeGpuType(gpuType);
    };

    handleSubTaskSubmit = (e) => {
        e.preventDefault();
        let props = this.props;
        props.form.validateFields([
            "name",
            "taskNumber",
            "minSucceededTaskCount",
            "minFailedTaskCount",
            "cpuNumber",
            "gpuNumber",
            "memoryMB",
            "shmMB",
            "command",
            "isMainRole",
            "needIBDevice"],(err, values) => {
            if (!err) {
                //导入，增加子任务成功都要去掉子任务列表空error
                props.changeJobInfoError(false,'');
                props.submitSubTask(values);
            }
        });
    };



    importFromFile = ()=>{

        let self = this;

        function onload(e,text){

            if(e){
                //console.log(e);
                return message.error(formatMessage({id:"jobConfig.error.import_json_file"}));
            }

            let job = null,error = null;
            try{
                job = JSON.parse(text);
            }catch(e){
                error = e;
            }

            if(null != error){
                return message.error(formatMessage({id:"jobConfig.error.wrong_json_form"}));
            }


            const SubTaskBaseSchema = Joi.object({
                name: Joi.string().regex(/^[a-z][a-z0-9]{0,14}$/).max(15).required().error(new Error(
                    formatMessage({id:'jobConfig.subtask_importerr.title'})+
                    "name"+";"+
                    formatMessage({id:'jobConfig.subtask_name.pattern.errMsg'})+";"+
                    formatMessage({id:'jobConfig.subtask_name.length.errMsg'})+";"+
                    formatMessage({id:'jobConfig.required.errMsg'})+";"
                )),//complete
                cpuNumber: Joi.number().integer().min(1).required().error(new Error(
                    formatMessage({id:'jobConfig.subtask_importerr.title'})+
                    "cpuNumber"+";"+
                    formatMessage({id:'jobConfig.cpu_num.label'})+formatMessage({id:'jobConfig.subtask.number.err'})+";"+
                    "0<"+formatMessage({id:'jobConfig.cpu_num.label'})+";"+
                    formatMessage({id:'jobConfig.required.errMsg'})+";"
                )),//complete
                gpuNumber: Joi.number().integer().min(0).required().error(new Error(
                    formatMessage({id:'jobConfig.subtask_importerr.title'})+
                    "gpuNumber"+";"+
                    formatMessage({id:'jobConfig.gpu_num.label'})+formatMessage({id:'jobConfig.subtask.number.err'})+";"+
                    "0<="+formatMessage({id:'jobConfig.gpu_num.label'})+";"+
                    formatMessage({id:'jobConfig.required.errMsg'})+";"
                )),//complete
                taskNumber: Joi.number().integer().min(1).required().error(new Error(
                    formatMessage({id:'jobConfig.subtask_importerr.title'})+
                    "taskNumber"+";"+
                    formatMessage({id:'jobConfig.replicas_number.label'})+formatMessage({id:'jobConfig.subtask.number.err'})+";"+
                    "1<="+formatMessage({id:'jobConfig.replicas_number.label'})+";"+
                    formatMessage({id:'jobConfig.required.errMsg'})+";"
                )),//complete
                minSucceededTaskCount:Joi.number().integer().min(1).max(Joi.ref('taskNumber')).required().error(new Error(
                    formatMessage({id:'jobConfig.subtask_importerr.title'})+
                    "minSucceededTaskCount"+";"+
                    formatMessage({id:'jobConfig.min_succeeded_num.label'})+formatMessage({id:'jobConfig.subtask.number.err'})+";"+
                    "1<="+formatMessage({id:'jobConfig.min_succeeded_num.label'})+"<="+formatMessage({id:'jobConfig.replicas_number.label'})+";"+
                    formatMessage({id:'jobConfig.required.errMsg'})+";"
                )),//1<=x<=taskNumber，complete
                minFailedTaskCount:Joi.number().integer().min(1).max(Joi.ref('taskNumber')).required().error(new Error(
                    formatMessage({id:'jobConfig.subtask_importerr.title'})+
                    "minFailedTaskCount"+";"+
                    formatMessage({id:'jobConfig.min_failed_num.label'})+formatMessage({id:'jobConfig.subtask.number.err'})+";"+
                    "1<="+formatMessage({id:'jobConfig.min_failed_num.label'})+"<="+formatMessage({id:'jobConfig.replicas_number.label'})+";"+
                    formatMessage({id:'jobConfig.required.errMsg'})+";"
                )), //1<=x<=taskNumber，complete
                memoryMB: Joi.number().integer().min(100).required().error(new Error(
                    formatMessage({id:'jobConfig.subtask_importerr.title'})+
                    "memoryMB"+";"+
                    formatMessage({id:'jobConfig.memery.label'})+formatMessage({id:'jobConfig.subtask.number.err'})+";"+
                    "100<="+formatMessage({id:'jobConfig.memery.label'})+";"+
                    formatMessage({id:'jobConfig.required.errMsg'})+";"
                )), //100<=x，complete
                shmMB: Joi.number().integer().min(64).max(Joi.ref('memoryMB')).required().error(new Error(
                    formatMessage({id:'jobConfig.subtask_importerr.title'})+
                    "shmMB"+";"+
                    formatMessage({id:'jobConfig.share_memery.label'})+formatMessage({id:'jobConfig.subtask.number.err'})+";"+
                    "64<="+formatMessage({id:'jobConfig.share_memery.label'})+"<="+formatMessage({id:'jobConfig.memery.label'})+";"+
                    formatMessage({id:'jobConfig.required.errMsg'})+";"
                )), //64<=x<=memoryMB
                command: Joi.string().regex(/^[^\f\n\r\t\v]+$/).required().error(new Error(
                    formatMessage({id:'jobConfig.subtask_importerr.title'})+
                    "command"+";"+
                    formatMessage({id:'jobConfig.subtask_command.pattern.errMsg'})+";"+
                    formatMessage({id:'jobConfig.required.errMsg'})+";"
                )), //complete
                needIBDevice: Joi.boolean().required().error(new Error(
                    formatMessage({id:'jobConfig.subtask_importerr.title'})+
                    "needIBDevice"+";"+
                    formatMessage({id:'jobConfig.subtask_needIBDevice.pattern.errMsg'})+";"+
                    formatMessage({id:'jobConfig.required.errMsg'})+";"
                )), //complete
                isMainRole: Joi.boolean().required().error(new Error(
                  formatMessage({id:'jobConfig.subtask_importerr.title'})+
                  "isMainRole"+";"+
                  formatMessage({id:'jobConfig.subtask_isMailRole.pattern.errMsg'})+";"+
                  formatMessage({id:'jobConfig.required.errMsg'})+";"
                )), //complete
            });

            const JobSchema = Joi.object({
                jobName: Joi.string().regex(/^[a-z0-9]+$/).max(36).required().error(new Error(
                    formatMessage({id:'jobConfig.subtask_importerr.title'})+
                    "jobName"+";"+
                    formatMessage({id:'jobConfig.job_name.pattern.errMsg'})+";"+
                    formatMessage({id:'jobConfig.job_name.length.errMsg'})+";"+
                    formatMessage({id:'jobConfig.required.errMsg'})+";"
                )), //complete
                retryCount: Joi.number().integer().min(0).max(10).required().error(new Error(
                    formatMessage({id:'jobConfig.subtask_importerr.title'})+
                    "retryCount"+";"+
                    formatMessage({id:'jobConfig.retry.label'})+formatMessage({id:'jobConfig.subtask.number.err'})+";"+
                    "0<="+formatMessage({id:'jobConfig.retry.label'})+"<=10"+";"+
                    formatMessage({id:'jobConfig.required.errMsg'})+";"
                )), //complete
                gpuType: Joi.string().required().error(new Error(
                    formatMessage({id:'jobConfig.subtask_importerr.title'})+
                    "gpuType"+";"+
                    formatMessage({id:'jobConfig.gpu_type.label'})+formatMessage({id:'jobConfig.subtask.string.err'})+";"+
                    formatMessage({id:'jobConfig.required.errMsg'})+";"
                )), //incomplete，需要设定gpuType的默认值
                image: Joi.string().regex(/^([^ \f\n\r\t\v\u4e00-\u9fa5])+$/).required().error(new Error(
                    formatMessage({id:'jobConfig.subtask_importerr.title'})+
                    "image"+";"+
                    formatMessage({id:'jobConfig.image.pattern.errMsg'})+";"+
                    formatMessage({id:'jobConfig.required.errMsg'})+";"
                )),//complete
                taskRoles: Joi.array().min(1).items(SubTaskBaseSchema).required(), //complete,不定义数组错误，会覆盖数组元素错误
            });

            let importErr = Joi.validate(job, JobSchema);
            //console.log("验证job",importErr);

            if(importErr.error)
            {
                let errMsg = importErr.error.message;
                if(importErr.error.message.indexOf("taskRoles")!==-1)
                {
                    errMsg = formatMessage({id:'jobConfig.subtask_importerr.title'})+
                    "taskRoles"+";"+formatMessage({id:'jobConfig.subtaskList.empty.errMsg'})+";"
                }

                self.props.changeJobInfoError(true,errMsg);
            }else{
                //no import error

                //检查子任务名
                let errMsg = null;

                job.gpuType = self.props.gpuTypeMap[job.gpuType]?job.gpuType:"";

                if(self.props.constGpuTypeMap[job.gpuType]){
                    //debug类型任务，清空subTaskList
                    job.taskRoles = [];
                    job.retryCount = 0;
                }else{
                    //不验证子任务列表为空情况，提交时验证
                    for(let index = 0;index<job.taskRoles.length;index++)
                    {
                        let subTask = job.taskRoles[index];
                        errMsg =self.validateSubTask(subTask,job.taskRoles);
                        if(errMsg){
                            break;
                        }
                    }
                }

                if(errMsg){
                    self.props.changeJobInfoError(true,errMsg);
                }else{

                    //导入没有错误，去掉子任务列表错误error
                    self.props.changeJobInfoError(false,'');

                    if(job.gpuType!=='')
                    {
                        self.props.importJob(job);
                    }
                }
            }
        }

        choseFile(function(file){
            loadFromFile(file,onload);
        });
    };

    validateSubTask=(subTask,subTaskList)=>{

        let subTaskName = subTask.name;

        let errMsg = "";

        let subTaskCount = 0;
        for (let index in subTaskList) {
            let subTask = subTaskList[index];

            if (subTaskName === subTask.name) {
                subTaskCount++;
            }

            if(subTaskCount>1)
            {
                 errMsg = formatMessage({id:'jobConfig.subtask_importerr.title'})+
                     "name"+";"+formatMessage({id:'jobConfig.subtask_name.replicas.errMsg'})+";"
                return errMsg;
            }
        }


        return null;
    };

    exportAsFile = ()=>{
        let props = this.props;
        this.checkJob(function (jobInfo) {

            try {
                //不包含子任务列表信息

                //jobInfo不包含子任务列表，带上提交
                jobInfo.jobName = jobInfo.jobName + props.jobNameSuffix;

                jobInfo.taskRoles = props.taskRoles.map(it => {
                    let tmp = {
                        ...it
                    };

                    //null值设置为默认值
                    tmp.taskNumber = tmp.taskNumber ? tmp.taskNumber : 1;
                    tmp.minSucceededTaskCount = tmp.minSucceededTaskCount ? tmp.minSucceededTaskCount : 1;
                    tmp.minFailedTaskCount = tmp.minFailedTaskCount ? tmp.minFailedTaskCount : 1;
                    tmp.cpuNumber = tmp.cpuNumber ? tmp.cpuNumber : 1;
                    tmp.gpuNumber = tmp.gpuNumber ? tmp.gpuNumber : 0;
                    tmp.memoryMB = tmp.memoryMB ? tmp.memoryMB : 100;
                    tmp.shmMB = tmp.shmMB ? tmp.shmMB : 64;
                    tmp.command = tmp.command ? tmp.command : "";
                    tmp.needIBDevice = tmp.needIBDevice?tmp.needIBDevice:false;
                    tmp.isMainRole = tmp.isMainRole ? tmp.isMainRole : false;

                    //去掉无用值
                    delete tmp.operations;
                    delete tmp.key;
                    delete tmp.id;
                    return tmp;
                });

                //console.log("JobExport", jobInfo);

                exportAsJsonFile(jobInfo);
            }catch(e){
                message.error(e.message);
            }
        });

    };

    handleJobSubmit = (e) => {
        e.preventDefault();
        let props = this.props;
        this.checkJob(function (jobInfo) {
            //不包含子任务列表信息

            //jobInfo不包含子任务列表，带上提交

            jobInfo.taskRoles = props.taskRoles.map(it=>{
                let tmp = {
                    ...it
                };

                //null值设置为默认值
                tmp.taskNumber = tmp.taskNumber?tmp.taskNumber:1;
                tmp.minSucceededTaskCount = tmp.minSucceededTaskCount?tmp.minSucceededTaskCount:1;
                tmp.minFailedTaskCount = tmp.minFailedTaskCount?tmp.minFailedTaskCount:1;
                tmp.cpuNumber = tmp.cpuNumber?tmp.cpuNumber:1;
                tmp.gpuNumber = tmp.gpuNumber?tmp.gpuNumber:0;
                tmp.memoryMB = tmp.memoryMB?tmp.memoryMB:100;
                tmp.shmMB = tmp.shmMB?tmp.shmMB:64;
                tmp.command = tmp.command?tmp.command:"";
                tmp.needIBDevice = tmp.needIBDevice?tmp.needIBDevice:false;
                tmp.isMainRole = tmp.isMainRole ? tmp.isMainRole : false;

                //去掉无用值
                delete tmp.operations;
                delete tmp.key;
                delete tmp.id;
                return tmp;
            });

            //console.log("JobSubmit",jobInfo);
            //add job name suffix
            jobInfo.jobName = jobInfo.jobName + props.jobNameSuffix;

            if(jobInfo.gpuType==='debug')
            {
                props.showSubmitDebugJobModel(jobInfo);
            }else{
                props.submitJob(jobInfo,function (errMsg) {
                    message.error(errMsg);
                },function () {
                    message.success(formatMessage({id:"jobConfig.success.submit_job"}))
                });
            }
        });
    };

    submitDebugJob=()=>{
        this.props.closeSubmitDebugJobModel();

        this.props.submitJob(this.props.debugJob,function (errMsg) {
            message.error(errMsg);
        },function () {
            message.success(formatMessage({id:"jobConfig.success.submit_job"}))
        });
    };

    checkJob=(onSucceed)=>{
        let props = this.props;

        props.form.validateFields([
            "jobName",
            "gpuType",
            "image",
            "retryCount",
        ],(err, jobInfo) => {
            if (!err) {

                if(props.taskRoles.length===0){
                    props.changeJobInfoError(true,formatMessage({id:"jobConfig.subtaskList.empty.errMsg"}));
                    return;
                }else{
                    props.changeJobInfoError(false,'');
                }

                onSucceed(jobInfo);
            }
        });
    };

    handleConfirmTaskNumber = (rule, value, callback) => {
        const { getFieldValue } = this.props.form;
        let minSucceededTaskCount = getFieldValue('minSucceededTaskCount');
        let minFailedTaskCount = getFieldValue('minFailedTaskCount');
        this.props.form.setFieldsValue({minSucceededTaskCount,minFailedTaskCount});

        // Note: 必须总是返回一个 callback，否则 validateFieldsAndScroll 无法响应
        callback()
    };

    handleConfirmMinTaskSucceeedCount = (rule, value, callback) => {
        const { getFieldValue } = this.props.form;
        let taskNumber = getFieldValue('taskNumber');
        if (value && value > taskNumber) {
            callback(formatMessage({id:'jobConfig.min_succeeded_num.label'})+" <= "+formatMessage({id:'jobConfig.replicas_number.label'}));
            return;
        }

        // Note: 必须总是返回一个 callback，否则 validateFieldsAndScroll 无法响应
        callback()
    };

    handleConfirmMinTaskFailedCount = (rule, value, callback) => {
        const { getFieldValue } = this.props.form;
        let taskNumber = getFieldValue('taskNumber');
        if (value && value > taskNumber) {
            callback(formatMessage({id:'jobConfig.min_failed_num.label'})+" <= "+formatMessage({id:'jobConfig.replicas_number.label'}));
            return;
        }

        // Note: 必须总是返回一个 callback，否则 validateFieldsAndScroll 无法响应
        callback()
    };

    handleConfirmMemoryMB = (rule, value, callback) => {
        const { getFieldValue } = this.props.form;
        let shmMB = getFieldValue('shmMB');
        this.props.form.setFieldsValue({shmMB});

        // Note: 必须总是返回一个 callback，否则 validateFieldsAndScroll 无法响应
        callback()
    };

    handleConfirmShareMB = (rule, value, callback) => {
        const { getFieldValue } = this.props.form;
        let memoryMB = getFieldValue('memoryMB');
        if (value && value > memoryMB) {
            callback(formatMessage({id:'jobConfig.share_memery.label'})+" <= "+formatMessage({id:'jobConfig.memery.label'}));
            return;
        }

        // Note: 必须总是返回一个 callback，否则 validateFieldsAndScroll 无法响应
        callback()
    };

    handleConfirmSubTaskName = (rule, value, callback) => {
        //console.log(value,'currentSubTask',this.props.currentSubTask);
        //创建新子任务，不能和任务列表重名。创建新任务的currentSubTask.name = null或者空字符串
        let currentIndex=this.props.currentSubTask.key;
        for (let index=0;index<this.props.taskRoles.length;index++) {
            if(index === currentIndex)
            {
                continue;
            }

            let subTask = this.props.taskRoles[index];

            if (value === subTask.name) {
                callback(formatMessage({id: 'jobConfig.subtask_name.replicas.errMsg'}));
                return;
            }
        }

        // Note: 必须总是返回一个 callback，否则 validateFieldsAndScroll 无法响应
        callback()
    };

    onJobNameInputed = ()=>{
        this.props.changeJobNameSuffix();
    };

    onIBDeviceCheckboxChange= (e) => {
        this.props.changeCurrentTaskNeedIBDevice(e.target.checked);
        //console.log(`checked = ${e.target.checked}`);
    };

    onMainRoleCheckboxChange= (e) => {
        this.props.changeCurrentTaskIsMainRole(e.target.checked);
        //console.log(`checked = ${e.target.checked}`);
    };

    render(){

        const { getFieldDecorator } = this.props.form;

        return (
            <Spin spinning={this.props.loading}>
                <div className = {styles.content}>
                    <Form onSubmit={this.handleJobSubmit} hideRequiredMark>
                        <Card
                            bordered={false}
                            title={formatMessage({id:'jobConfig.job.title'})}
                            extra={
                                <Row type="flex" justify="end">
                                    <Button type="primary" onClick={this.importFromFile} style={{ marginRight: 4 }}>
                                        <FormattedMessage id="jobConfig.button.import_file" />
                                    </Button>
                                    <Button type="primary" onClick={this.exportAsFile} style={{ marginRight: 4 }}>
                                        <FormattedMessage id="jobConfig.button.export_file" />
                                    </Button>
                                    <Button type="primary" htmlType="submit">
                                        <FormattedMessage id="jobConfig.button.submit"  />
                                    </Button>
                                    <Modal
                                        title={formatMessage({id:'jobConfig.debug.submit.title'})}
                                        visible={this.props.visiableSubmitDebugJobModel}
                                        closable={false}
                                        onOk={this.submitDebugJob}
                                        onCancel={this.props.closeSubmitDebugJobModel}
                                        okText={formatMessage({id:'jobConfig.task.button.confirm'})}
                                        cancelText={formatMessage({id:'jobConfig.task.button.cancel'})}
                                    >
                                        <div dangerouslySetInnerHTML={{__html:formatMessage({id:'jobConfig.debug.submit.tips'})}}>

                                        </div>
                                    </Modal>
                                </Row>
                            }
                        >
                        {this.props.jobInfoError?(
                            <Row>
                                <Col span={24}>
                                    <Alert  message={this.props.jobInfoErrorMsg} type="error" showIcon banner/>
                                </Col>
                            </Row>):null}
                        <Row gutter={12}>
                                <Col span={12}>
                                    <Form.Item label={(
                                        <span>
                                                <span><FormattedMessage id="jobConfig.job_name.label" />&nbsp;</span>

                                                <Popover content={(<div dangerouslySetInnerHTML={{__html:formatMessage({id:'jobConfig.job_name.dec'})}}></div>)}
                                                         title={formatMessage({id:'jobConfig.dec.title'})}
                                                         trigger="hover"
                                                         placement="right">
                                                    <Icon type="question-circle-o"  theme="twoTone" twoToneColor="#ffac16" />
                                                </Popover>
                                            </span>
                                    )}>
                                        {getFieldDecorator('jobName', {
                                            initialValue:this.props.jobName,
                                            rules: [
                                                { required: true, message: formatMessage({id:'jobConfig.required.errMsg'}) },
                                                {pattern:/^[a-z0-9]+$/,message: formatMessage({id: "jobConfig.job_name.pattern.errMsg"})},
                                                {max:30,message: formatMessage({id: "jobConfig.job_name.length.errMsg"})},
                                            ],
                                        })(<Input suffix={this.props.jobNameSuffix===""?null:<Tag>{this.props.jobNameSuffix}</Tag>} onBlur={this.onJobNameInputed}/>)}
                                    </Form.Item>

                                </Col>
                                <Col span={12}>
                                    <Form.Item
                                        label={(
                                            <span>
                                                <span><FormattedMessage id="jobConfig.retry.label" />&nbsp;</span>

                                                <Popover content={(<div dangerouslySetInnerHTML={{__html:formatMessage({id:'jobConfig.retry.dec'})}}></div>)}
                                                         title={formatMessage({id:'jobConfig.dec.title'})}
                                                         trigger="hover"
                                                         placement="right">
                                                    <Icon type="question-circle-o"  theme="twoTone" twoToneColor="#ffac16" />
                                                </Popover>
                                            </span>
                                        )}>
                                        {getFieldDecorator('retryCount', {
                                            initialValue:this.props.retryCount,
                                            rules: [{ required: true,message: formatMessage({id:'jobConfig.required.errMsg'})}],
                                        })(
                                            <InputNumber disabled={
                                                this.props.constGpuTypeMap[this.props.gpuType]!== undefined
                                            } min={0} max={10} />,
                                        )}
                                    </Form.Item>

                                </Col>
                        </Row>
                        <Row gutter={12}>
                            <Col span={12}>
                                <Form.Item
                                    label={(
                                        <span>
                                                <span><FormattedMessage id="jobConfig.gpu_type.label" />&nbsp;</span>

                                                <Popover content={(<div dangerouslySetInnerHTML={{__html:formatMessage({id:'jobConfig.gpu_type.dec'})}}></div>)}
                                                         title={formatMessage({id:'jobConfig.dec.title'})}
                                                         trigger="hover"
                                                         placement="right">
                                                    <Icon type="question-circle-o"  theme="twoTone" twoToneColor="#ffac16" />
                                                </Popover>
                                            </span>
                                    )}>
                                    {getFieldDecorator('gpuType', {
                                        initialValue:this.props.gpuType,
                                        rules: [{ required: true, message: formatMessage({id:'jobConfig.gpu_type.errMsg'}) }],
                                    })(
                                        <Select
                                            onChange={(gpuType)=>{

                                                this.props.form.setFieldsValue({image:''});

                                                this.changeGpuType(gpuType);
                                            }}
                                        >
                                            {
                                                Object.values(this.props.gpuTypeMap).map(gpuInfo => {
                                                    return <Option key={gpuInfo.platformKey}>{gpuInfo.name}</Option>;
                                                })
                                            }
                                        </Select>
                                    )}
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item
                                    label={(
                                        <span>
                                                <span><FormattedMessage id="jobConfig.images.label" />&nbsp;</span>

                                                <Popover content={(<div dangerouslySetInnerHTML={{__html:formatMessage({id:'jobConfig.images.dec'})}}></div>)}
                                                         title={formatMessage({id:'jobConfig.dec.title'})}
                                                         trigger="hover"
                                                         placement="right">
                                                    <Icon type="question-circle-o"  theme="twoTone" twoToneColor="#ffac16" />
                                                </Popover>
                                            </span>
                                    )}>
                                    {getFieldDecorator('image', {
                                        initialValue:this.props.image,
                                        rules: [
                                            { required: true, message: formatMessage({id:'jobConfig.images.errMsg'}) },
                                            {pattern:/^([^ \f\n\r\t\v\u4e00-\u9fa5])+$/,message: formatMessage({id: "jobConfig.image.pattern.errMsg"})},
                                        ],
                                    })(
                                        <AutoComplete>
                                            {
                                                this.props.images.map(image => {
                                                    return <Option key={image.value}>
                                                                {image.value}
                                                            </Option>;
                                                })
                                            }
                                        </AutoComplete>
                                    )}
                                </Form.Item>
                            </Col>
                        </Row>
                    </Card>
                    </Form>
                    <Divider type="horizontal" />
                    <Card
                        bordered={false}
                        title={<FormattedMessage id="jobConfig.subTaskList.title" />}
                        extra={
                            <Button type="primary" onClick={this.createSubTask}>
                                <Icon type="plus" /> <FormattedMessage id="jobConfig.button.create_subtask" />
                            </Button>
                        }
                    >
                        <StandardTable
                            columns={this.subTaskColumns}
                            dataSource={this.props.taskRoles}
                            loading={this.props.subTaskListLoading}
                            pagination={true}
                        />
                    </Card>

                    <Drawer
                        title={formatMessage({id:'jobConfig.title.editSubTask'})}
                        width={720}
                        onClose={this.props.closeTaskEditor}
                        visible={this.props.taskEditorVisible}
                        closable={false}
                    >
                        <Form layout="vertical" hideRequiredMark onSubmit={this.handleSubTaskSubmit} className="subTask-form">
                            <Row gutter={16}>
                                <Col span={12}>
                                    <Form.Item label={(
                                        <span>
                                            <span><FormattedMessage id="jobConfig.task_name.label" />&nbsp;</span>

                                            <Popover content={(<div dangerouslySetInnerHTML={{__html:formatMessage({id:'jobConfig.task_name.dec'})}}></div>)}
                                                     title={formatMessage({id:'jobConfig.dec.title'})}
                                                     trigger="hover"
                                                     placement="right">
                                                <Icon type="question-circle-o"  theme="twoTone" twoToneColor="#ffac16" />
                                            </Popover>
                                        </span>
                                    )}>
                                        {getFieldDecorator('name', {
                                            initialValue:this.props.currentSubTask.name,
                                            rules: [
                                                { required: true, message: formatMessage({id:'jobConfig.required.errMsg'}) },
                                                {pattern:/^[a-z][a-z0-9]{0,14}$/,message: formatMessage({id: "jobConfig.subtask_name.pattern.errMsg"})},
                                                {max:15,message: formatMessage({id: "jobConfig.subtask_name.length.errMsg"})},
                                                {validator: this.handleConfirmSubTaskName}
                                                ],
                                        })(<Input />)}
                                    </Form.Item>
                                </Col>
                                <Col span={12}>
                                    <Form.Item label={(
                                        <span>
                                            <span><FormattedMessage id="jobConfig.replicas_number.label" />&nbsp;</span>

                                            <Popover content={(<div dangerouslySetInnerHTML={{__html:formatMessage({id:'jobConfig.replicas_number.dec'})}}></div>)}
                                                     title={formatMessage({id:'jobConfig.dec.title'})}
                                                     trigger="hover"
                                                     placement="right">
                                                <Icon type="question-circle-o"  theme="twoTone" twoToneColor="#ffac16" />
                                            </Popover>
                                        </span>
                                    )}>
                                        {getFieldDecorator('taskNumber', {
                                            initialValue:this.props.currentSubTask.taskNumber?this.props.currentSubTask.taskNumber:1,
                                            rules: [
                                                { required: true,message: formatMessage({id:'jobConfig.required.errMsg'})},
                                                { validator: this.handleConfirmTaskNumber}
                                                ],
                                        })(
                                            <InputNumber  disabled={
                                                this.props.constGpuTypeMap[this.props.gpuType]!== undefined
                                            } min={1} max={10} />,
                                        )}
                                    </Form.Item>
                                </Col>
                            </Row>

                            <Row gutter={16}>
                                <Col span={12}>
                                    <Form.Item label={(
                                        <span>
                                            <span><FormattedMessage id="jobConfig.min_succeeded_num.label" />&nbsp;</span>

                                            <Popover content={(<div dangerouslySetInnerHTML={{__html:formatMessage({id:'jobConfig.min_succeeded_num.dec'})}}></div>)}
                                                     title={formatMessage({id:'jobConfig.dec.title'})}
                                                     trigger="hover"
                                                     placement="right">
                                                <Icon type="question-circle-o"  theme="twoTone" twoToneColor="#ffac16" />
                                            </Popover>
                                        </span>
                                    )}>
                                        {getFieldDecorator('minSucceededTaskCount', {
                                            initialValue:this.props.currentSubTask.minSucceededTaskCount?this.props.currentSubTask.minSucceededTaskCount:1,
                                            rules: [
                                                { required: true,message: formatMessage({id:'jobConfig.required.errMsg'})},
                                                {validator: this.handleConfirmMinTaskSucceeedCount}
                                            ],
                                        })(
                                            <InputNumber disabled={
                                                this.props.constGpuTypeMap[this.props.gpuType]!== undefined
                                            } min={1} />,
                                        )}
                                    </Form.Item>
                                </Col>
                                <Col span={12}>
                                    <Form.Item label={(
                                        <span>
                                            <span><FormattedMessage id="jobConfig.min_failed_num.label" />&nbsp;</span>

                                            <Popover content={(<div dangerouslySetInnerHTML={{__html:formatMessage({id:'jobConfig.min_failed_num.dec'})}}></div>)}
                                                     title={formatMessage({id:'jobConfig.dec.title'})}
                                                     trigger="hover"
                                                     placement="right">
                                                <Icon type="question-circle-o"  theme="twoTone" twoToneColor="#ffac16" />
                                            </Popover>
                                        </span>
                                    )}>
                                        {getFieldDecorator('minFailedTaskCount', {
                                            initialValue:this.props.currentSubTask.minFailedTaskCount?this.props.currentSubTask.minSucceededTaskCount:1,
                                            rules: [
                                                { required: true,message: formatMessage({id:'jobConfig.required.errMsg'})},
                                                {validator: this.handleConfirmMinTaskFailedCount}
                                            ],
                                        })(
                                            <InputNumber disabled={
                                                this.props.constGpuTypeMap[this.props.gpuType]!== undefined
                                            } min={1} />,
                                        )}
                                    </Form.Item>
                                </Col>
                            </Row>

                            <Row gutter={16}>
                                <Col span={12}>
                                    <Form.Item label={(
                                        <span>
                                            <span><FormattedMessage id="jobConfig.cpu_num.label" />&nbsp;</span>

                                            <Popover content={(<div dangerouslySetInnerHTML={{__html:formatMessage({id:'jobConfig.cpu_num.dec'})}}></div>)}
                                                     title={formatMessage({id:'jobConfig.dec.title'})}
                                                     trigger="hover"
                                                     placement="right">
                                                <Icon type="question-circle-o"  theme="twoTone" twoToneColor="#ffac16" />
                                            </Popover>
                                        </span>
                                    )}>
                                        {getFieldDecorator('cpuNumber', {
                                            initialValue:this.props.currentSubTask.cpuNumber?this.props.currentSubTask.cpuNumber:1,
                                            rules: [{ required: true,message: formatMessage({id:'jobConfig.required.errMsg'})}],
                                        })(
                                            <InputNumber disabled={
                                                this.props.constGpuTypeMap[this.props.gpuType]!== undefined
                                            } min={1} />,
                                        )}
                                    </Form.Item>
                                </Col>
                                <Col span={12}>
                                    <Form.Item label={(
                                        <span>
                                            <span><FormattedMessage id="jobConfig.gpu_num.label" />&nbsp;</span>

                                            <Popover content={(<div dangerouslySetInnerHTML={{__html:formatMessage({id:'jobConfig.gpu_num.dec'})}}></div>)}
                                                     title={formatMessage({id:'jobConfig.dec.title'})}
                                                     trigger="hover"
                                                     placement="right">
                                                <Icon type="question-circle-o"  theme="twoTone" twoToneColor="#ffac16" />
                                            </Popover>
                                        </span>
                                    )}>
                                        {getFieldDecorator('gpuNumber', {
                                            initialValue:this.props.currentSubTask.gpuNumber?this.props.currentSubTask.gpuNumber:0,
                                            rules: [{ required: true,message: formatMessage({id:'jobConfig.required.errMsg'})}],
                                        })(
                                            <InputNumber disabled={
                                                this.props.constGpuTypeMap[this.props.gpuType]!== undefined
                                            } min={0} />,
                                        )}
                                    </Form.Item>
                                </Col>
                            </Row>

                            <Row gutter={16}>
                                <Col span={12}>
                                    <Form.Item label={(
                                        <span>
                                            <span><FormattedMessage id="jobConfig.memery.label" />&nbsp;</span>

                                            <Popover content={(<div dangerouslySetInnerHTML={{__html:formatMessage({id:'jobConfig.memery.dec'})}}></div>)}
                                                     title={formatMessage({id:'jobConfig.dec.title'})}
                                                     trigger="hover"
                                                     placement="right">
                                                <Icon type="question-circle-o"  theme="twoTone" twoToneColor="#ffac16" />
                                            </Popover>
                                        </span>
                                    )}>
                                        {getFieldDecorator('memoryMB', {
                                            initialValue:this.props.currentSubTask.memoryMB?this.props.currentSubTask.memoryMB:100,
                                            rules: [
                                                { required: true,message: formatMessage({id:'jobConfig.required.errMsg'})},
                                                {validator: this.handleConfirmMemoryMB}
                                                ],
                                        })(
                                            <InputNumber disabled={
                                                this.props.constGpuTypeMap[this.props.gpuType]!== undefined
                                            } min={100} />,
                                        )}
                                    </Form.Item>
                                </Col>
                                <Col span={12}>
                                    <Form.Item label={(
                                        <span>
                                            <span><FormattedMessage id="jobConfig.share_memery.label" />&nbsp;</span>

                                            <Popover content={(<div dangerouslySetInnerHTML={{__html:formatMessage({id:'jobConfig.share_memery.dec'})}}></div>)}
                                                     title={formatMessage({id:'jobConfig.dec.title'})}
                                                     trigger="hover"
                                                     placement="right">
                                                <Icon type="question-circle-o"  theme="twoTone" twoToneColor="#ffac16" />
                                            </Popover>
                                        </span>
                                    )}>
                                        {getFieldDecorator('shmMB', {
                                            initialValue:this.props.currentSubTask.shmMB?this.props.currentSubTask.shmMB:64,
                                            rules: [
                                                { required: true,message: formatMessage({id:'jobConfig.required.errMsg'})},
                                                {validator: this.handleConfirmShareMB}
                                            ],
                                        })(
                                            <InputNumber disabled={
                                                this.props.constGpuTypeMap[this.props.gpuType]!== undefined
                                            } min={0} />,
                                        )}
                                    </Form.Item>
                                </Col>
                            </Row>



                            <Row gutter={16}>
                                <Col span={24}>
                                    <Form.Item label={(
                                        <span>
                                            <span><FormattedMessage id="jobConfig.command.label" />&nbsp;</span>

                                            <Popover content={(<div dangerouslySetInnerHTML={{__html:formatMessage({id:'jobConfig.command.dec'})}}></div>)}
                                                     title={formatMessage({id:'jobConfig.dec.title'})}
                                                     trigger="hover"
                                                     placement="right">
                                                <Icon type="question-circle-o"  theme="twoTone" twoToneColor="#ffac16" />
                                            </Popover>
                                        </span>
                                    )}>
                                        {getFieldDecorator('command', {
                                            initialValue:this.props.currentSubTask.command,
                                            rules: [
                                                {
                                                    required: true,
                                                    message: formatMessage({id:'jobConfig.required.errMsg'}),
                                                },
                                                {pattern:/^[^\f\n\r\t\v]+$/,message: formatMessage({id: "jobConfig.subtask_command.pattern.errMsg"})}
                                            ],
                                        })(<Input.TextArea disabled={
                                            this.props.constGpuTypeMap[this.props.gpuType]!== undefined
                                        } rows={4} />)}
                                    </Form.Item>
                                </Col>
                            </Row>

                            <Row gutter={16}>
                                <Col span={24}>
                                <Form.Item
                                      label={(<span></span>)}
                                    >
                                        {getFieldDecorator('needIBDevice', {
                                            
                                        })(
                                            <Checkbox checked={this.props.currentSubTask.needIBDevice?this.props.currentSubTask.needIBDevice:false} 
                                            onChange={this.onIBDeviceCheckboxChange}>
                                                <span>
                                                    <span><FormattedMessage id="jobConfig.ib_device.label" />&nbsp;</span>
    
                                                    <Popover content={(<div dangerouslySetInnerHTML={{__html:formatMessage({id:'jobConfig.ib_device.dec'})}}></div>)}
                                                            title={formatMessage({id:'jobConfig.dec.title'})}
                                                            trigger="hover"
                                                            placement="right">
                                                        <Icon type="question-circle-o"  theme="twoTone" twoToneColor="#ffac16" />
                                                    </Popover>
                                                </span>
                                            </Checkbox>
                                        
                                        )}
                                        

                                    </Form.Item>
                                </Col>
                            </Row>

                            <Row gutter={16}>
                                <Col span={24}>
                                    <Form.Item
                                      label={(<span></span>)}
                                    >
                                        {getFieldDecorator('isMainRole', {

                                        })(
                                          <Checkbox checked={this.props.currentSubTask.isMainRole?this.props.currentSubTask.isMainRole:false}
                                                    onChange={this.onMainRoleCheckboxChange}>
                                                <span>
                                                    <span><FormattedMessage id="jobConfig.is_main_role.label" />&nbsp;</span>

                                                    <Popover content={(<div dangerouslySetInnerHTML={{__html:formatMessage({id:'jobConfig.is_main_role.dec'})}}></div>)}
                                                             title={formatMessage({id:'jobConfig.dec.title'})}
                                                             trigger="hover"
                                                             placement="right">
                                                        <Icon type="question-circle-o"  theme="twoTone" twoToneColor="#ffac16" />
                                                    </Popover>
                                                </span>
                                          </Checkbox>

                                        )}
                                    </Form.Item>
                                </Col>
                            </Row>

                            <div className={styles.subTaskButtons}>
                                <Row type="flex" justify="end">
                                    <Form.Item>
                                        <Button onClick={this.props.closeTaskEditor} style={{ marginRight: 8 }}>
                                            <FormattedMessage id="jobConfig.task.button.cancel" />
                                        </Button>
                                        <Button type="primary" htmlType="submit" className="subTask-button" >
                                            <FormattedMessage id="jobConfig.task.button.confirm" />
                                        </Button>
                                    </Form.Item>
                                </Row>
                            </div>
                        </Form>
                    </Drawer>
                </div>
            </Spin>
        )
    }
}

const JobSubmitForm = Form.create({ name: 'jobSubmit' })(JobSubmit);

export default JobSubmitForm;
