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
import {Component} from "react";
import { connect } from 'dva';
import {Form,Typography,Modal,Divider,Tooltip,Card,Tag,Button,message,Popconfirm,Input} from 'antd';
import styles from "./index.less";
import {formatMessage } from 'umi/locale';
import StandardTable from '@/components/StandardTable';
const { TextArea } = Input;
const { Text} = Typography;

const namespace = 'job';

const getJobStateColor = (jobState) => {
    let color='#d2d6de';
    if (jobState === 'N/A') {
        color='#d2d6de';
    } else if (jobState === 'Waiting') {
        color = '#f0ad4e';
    } else if (jobState === 'Running') {
        color = '#108ee9';
    } else if (jobState === 'Stopping') {
        color = '#f0ad4e';
    } else if (jobState === 'Succeeded') {
        color ='#00a65a';
    } else if (jobState === 'Failed') {
        color = '#d9534f';
    } else if (jobState === 'Stopped') {
        color='#d2d6de';
    } else {
        color='#d2d6de';
    }

    return color;
};

function mapStateToProps(state) {
    return {
        ...state.job
    };
}

const mapDispatchToProps=(dispatch)=>{
    return {
        loadJob: (onFailed)=>{
            dispatch({type:`${namespace}/loadJob`,payload:{onFailed:onFailed}});
        },
        displayConfigModal:()=>{
            dispatch({type:`${namespace}/showConfigModal`,payload:{showConfigModal:true}});
        },
        closeConfigModal:()=>{
            dispatch({type:`${namespace}/showConfigModal`,payload:{showConfigModal:false}});
        },
        displayAppSummaryModal:()=>{
            dispatch({type:`${namespace}/showConfigModal`,payload:{showAppSummaryModal:true}});
        },
        closeAppSummaryModal:()=>{
            dispatch({type:`${namespace}/showConfigModal`,payload:{showAppSummaryModal:false}});
        },
        stopJob:(jobId)=>{
            dispatch({type:`${namespace}/stopJob`,payload:{jobId}});
        },
        resubmitJob:(jobId)=>{
            dispatch({type:`${namespace}/resubmitJob`,payload:{jobId}});
        },
        showCommitImageModel:(jobId,task)=>{
            dispatch({type:`${namespace}/showCommitImageModel`,payload:{jobId,task}});
        },
        commitImage:(jobId,task,imageTag,imageDescription,onSuccessed,onFailed,onOverMaxSize)=>{
            dispatch({type:`${namespace}/commitImage`,payload:{jobId,task,imageTag,imageDescription,onSuccessed,onFailed,onOverMaxSize}});
        },
        closeCommitImageModel:()=>{
            dispatch({type:`${namespace}/closeCommitImageModel`});
        }

    }
};

@connect(mapStateToProps,mapDispatchToProps)
class JobDetail extends Component {

    columnTitles = [
        formatMessage({id:'jobList.column.jobName'}),
        formatMessage({id:'jobList.column.gpuType'}),
        formatMessage({id:'jobList.column.status'}),
        formatMessage({id:'jobList.column.startTime'}),
        formatMessage({id:'jobList.column.duration'}),
        formatMessage({id:'jobList.column.retries'}),
        formatMessage({id:'jobList.column.stop'}),
        formatMessage({id:'jobList.column.resubmit'})
    ];

    columnDataIndexs = [
        "jobName",
        "gpuType",
        "status",
        "startTime",
        "duration",
        "retries",
        "stop",
        "resubmit",
    ];

    columns = this.columnDataIndexs.map((DataIndex,index)=>{

        let columnDef = {
            title:this.columnTitles[index],
            dataIndex:this.columnDataIndexs[index],
            key: this.columnDataIndexs[index]
        };

        if(DataIndex ==='stop')
        {
            return {
                ...columnDef,
                render: (isEnable,record) =>(
                    isEnable?<Popconfirm title={formatMessage({id:'jobList.stop.confirm'})} onConfirm={() => {
                                this.props.stopJob(record.jobId);
                            }}>
                                <Button type="primary">
                                    {formatMessage({id:'jobList.stop'})}
                                </Button>
                            </Popconfirm>
                            :<Button type="primary" disabled>
                                {formatMessage({id:'jobList.stop'})}
                            </Button>
                )
            };
        }else if(DataIndex ==='resubmit'){
            return {
                ...columnDef,
                render: (isEnable,record) =>(
                    isEnable?<Popconfirm title={formatMessage({id:'jobList.resubmit.confirm'})} onConfirm={() => {
                                this.props.resubmitJob(record.jobId);
                            }}>
                                <Button type="primary">
                                    {formatMessage({id:'jobList.resubmit'})}
                                </Button>
                            </Popconfirm>
                            :<Button type="primary" disabled>
                                {formatMessage({id:'jobList.resubmit'})}
                            </Button>
                )
            };
        }else if(DataIndex ==='status'){
            return {
                ...columnDef,
                render:(status,record) =>{
                    let color = getJobStateColor(status);
                    return (<Tag color={color}>{status}</Tag>);
                }
            };
        }else if(DataIndex ==='duration'){
            return {
                ...columnDef,
                render: (duration,record) =>(
                    <Tooltip title={record.durationSec}>
                        {duration}
                    </Tooltip>
                )
            };
        }else if(DataIndex ==='retries'){
            return {
                ...columnDef,
                render: (text) =>(
                    <span>{text}</span>
                )
            };
        }else{
            return {
                ...columnDef
            };
        }
    });

    taskColumnTitles = [
        formatMessage({id:'jobDetail.task.column.taskRole'}),
        formatMessage({id:'jobDetail.task.column.taskIndex'}),
        formatMessage({id:'jobDetail.task.column.containerName'}),
        //formatMessage({id:'jobDetail.task.column.gpus'}),
        formatMessage({id:'jobList.column.status'}),
        formatMessage({id:'jobDetail.task.column.actions'})
    ];

    taskColumnDataIndexs = [
        "taskRole",
        "taskIndex",
        "containerName",
        //"gpus",
        "status",
        "actions"
    ];

    taskColumns = this.taskColumnDataIndexs.map((DataIndex,index)=> {

        let columnDef = {
            title: this.taskColumnTitles[index],
            dataIndex: this.taskColumnDataIndexs[index],
            key: this.taskColumnDataIndexs[index]
        };


        if(DataIndex ==='actions'){
            return {
                ...columnDef,
                render:(actions,record) =>{

                    let debugBtnVisiable = this.props.gpuTypeAction==='debug';

                    let canDebug = this.props.gpuType==='debug' &&
                    record.status==='Running' && record.debugIDEUrl!=="" ?true:false;

                    let canCommitImage = canDebug && this.props.job.status==='Running';

                    let commitImageVisiable = this.props.gpuType ==='debug';

                    return (
                        <div>

                            <Button className={debugBtnVisiable?styles.show:styles.hide}
                                    size={'small'}
                                    type="primary"
                                    disabled={!canDebug}
                                    style={{ marginRight: 4 }}
                                    onClick={()=>{
                                        window.open(record.debugIDEUrl);
                                    }}
                            >
                                {formatMessage({id:'jobDetail.task.debug'})}
                            </Button>

                            <Button className={commitImageVisiable?styles.show:styles.hide}
                                    size={'small'}
                                    type="primary"
                                    disabled={!canCommitImage}
                                    style={{ marginRight: 4 }}
                                    onClick={()=>{
                                        this.props.showCommitImageModel(this.props.job.jobId,record);
                                    }}
                            >
                                {formatMessage({id:'jobDetail.task.goto.commitImage'})}
                            </Button>

                            <Button size={'small'}
                                    type="primary"
                                    disabled={!record.metricUrl}
                                    style={{ marginRight: 4 }}
                                    onClick={()=>{
                                        if (!record.metricUrl) {
                                            return
                                        }
                                        window.open(record.metricUrl);
                                    }}
                            >
                                {formatMessage({id:'jobDetail.task.goto.metricsPage'})}
                            </Button>

                            <Button size={'small'}
                                    type="primary"
                                    onClick={()=>{
                                        window.open(record.trackingPageUrl);
                                    }}
                            >
                                {formatMessage({id:'jobDetail.task.goto.trackingPage'})}
                            </Button>
                        </div>
                    );
                }
            };
        }if(DataIndex ==='status'){
            return {
                ...columnDef,
                render:(status,record) =>{

                    let color = getJobStateColor(status);
                    return (<Tag color={color}>{status}</Tag>);
                }
            };
        }else{
            return {
                ...columnDef
            };
        }
    });

    componentWillMount(){
        this.props.loadJob(function(){
            message.error(formatMessage({id:'jobDetail.fetch.failed'}))
        });
    }

    commitCurrentTaskImage=()=>{

        let props = this.props;

        props.form.validateFields([
            "imageTag"
        ],(err, imageInfo) => {
            if (!err) {

                let imageTag = props.form.getFieldValue("imageTag") || '';
                let imageDescription = props.form.getFieldValue("imageDescription") || '';

                this.props.commitImage(props.job.jobId,props.currentTask,imageTag, imageDescription,
                    function(){
                    message.success(formatMessage({id:'jobDetail.task.commitimage.successed'}))
                },function(msg){
                    if(msg)
                    {
                        message.error(msg)
                    }else{
                        message.error(formatMessage({id:'jobDetail.task.commitimage.failed'}))
                    }
                });
            }
        });
        
    }

    render(){
        const { getFieldDecorator } = this.props.form;
        let sshBtnVisiable = this.props.gpuTypeAction==='ssh' && this.props.job.status==='Running';

        return (
            <div className={styles.content}>

                <Card bordered={false}>
                <div>
                    <a key={"jobConfig"} disabled={this.props.configDisable}
                       href="javascript:void(0);"
                       onClick={()=>{this.props.displayConfigModal()}}>
                        {formatMessage({id:'jobDetail.view.jobConfig'})}
                    </a>
                    <Divider type="vertical" />
                    <a key={"appSummary"} href="javascript:void(0);"
                       onClick={()=>{this.props.displayAppSummaryModal()}}>
                        {formatMessage({id:'jobDetail.view.applicationSummary'})}
                    </a>
                    <Divider type="vertical" className={sshBtnVisiable?styles.show:styles.hide} />
                    <a key={"jobTerminal"} className={sshBtnVisiable?styles.show:styles.hide} href={this.props.jobTerminalUrl}
                       target="_blank">
                        {formatMessage({id:'jobDetail.goto.jobTerminal'})}
                    </a>
                    <Modal
                        key={'Config'}
                        title={this.props.jobName+' '+formatMessage({id:'jobDetail.config.modal.title'})}
                        visible={this.props.showConfigModal}
                        onOk={this.props.closeConfigModal}
                        onCancel={this.props.closeConfigModal}
                    >
                        <div>
                            <pre><code>{this.props.configInfo}</code></pre>
                        </div>
                    </Modal>
                    <Modal
                        key={'applicationSummary'}
                        title={this.props.jobName+' '+formatMessage({id:'jobDetail.applicationSummary.modal.title'})}
                        visible={this.props.showAppSummaryModal}
                        onOk={this.props.closeAppSummaryModal}
                        onCancel={this.props.closeAppSummaryModal}
                    >
                        <div>
                            <p>
                                <strong>{formatMessage({id:'jobDetail.applicationSummary.modal.startTime'})}</strong>
                                <span>{" "+this.props.appLaunchedTimeString}</span>
                            </p>
                            <p>
                                <strong>{formatMessage({id:'jobDetail.applicationSummary.modal.finishTime'})}</strong>
                                <span>{" "+this.props.appCompletedTimeString}</span>
                            </p>
                            <p>
                                <strong>{formatMessage({id:'jobDetail.applicationSummary.modal.exitDiagnostics'})}</strong>
                            </p>
                            <div dangerouslySetInnerHTML={{__html:this.props.jobStatus.appExitDiagnostics?
                                    this.props.appExitDiagnosticsString:
                                    formatMessage({id:'jobDetail.applicationSummary.modal.emptyAppExitDiagnostics'})}}>
                            </div>
                        </div>
                    </Modal>
                </div>
                </Card>

                <Modal
                    title={formatMessage({id:'jobDetail.task.commitimage.title'})}
                    visible={this.props.visiableCommitImageModel}
                    closable={false}
                    okButtonProps={{disabled:!this.props.currentTask.enableCommitImage}}
                    onOk={this.commitCurrentTaskImage}
                    onCancel={this.props.closeCommitImageModel}
                    okText={formatMessage({id:'jobDetail.task.commitimage.confirm'})}
                    cancelText={formatMessage({id:'jobConfig.task.button.cancel'})}
                >
                    <p>
                        <strong>{formatMessage({id:'jobDetail.task.commitimage.lastImageStatus'})}</strong>
                        <span>
                            {
                                this.props.currentTask.imageStateText?this.props.currentTask.imageStateText:""
                            }
                        </span>
                    </p>
                    <p>
                        <strong>{formatMessage({id:'jobDetail.task.commitimage.imageName'})}</strong>
                        <span>{this.props.currentUser.username}</span>
                    </p>
                    <Form className="imageDesForm">
                        <p>
                            <strong>{formatMessage({id:'jobDetail.task.commitimage.imageTag'})}</strong>
                        </p>
                        <Form.Item name={'imageTag'}>
                            {
                                getFieldDecorator('imageTag', {
                                    rules: [
                                        { required: true, message: formatMessage({id:'jobConfig.required.errMsg'}) },
                                    ],
                                })
                                (
                                    <Input />
                                )
                            }
                        </Form.Item>

                        <p>
                            <strong>{formatMessage({id:'jobDetail.task.commitimage.imageDescription'})}</strong>
                        </p>
                    
                        <Form.Item>
                            {
                                getFieldDecorator('imageDescription', {})
                                (
                                    <TextArea disabled={!this.props.currentTask.enableCommitImage}
                                            autosize={{ minRows: 2, maxRows: 6 }}
                                    />
                                )
                            }
                        </Form.Item>
                    </Form>
                </Modal>
                <Card bordered={false}>
                    <StandardTable
                        columns={this.columns}
                        dataSource={this.props.jobs}
                        loading={this.props.loading}
                        pagination={false}
                    />
                </Card>
                <Card bordered={false}>
                    <Divider/>
                    <StandardTable
                        columns={this.taskColumns}
                        dataSource={this.props.tasks}
                        loading={this.props.loading}
                        pagination={false}
                    />
                </Card>
            </div>
        )
    }
}

const JobDetailForm = Form.create({ name: 'JobCommitImage' })(JobDetail);

export default JobDetailForm
