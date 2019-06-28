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
import {Tooltip,Tag,Button,message,Popconfirm} from 'antd';
import {formatMessage } from 'umi/locale';
import styles from "./index.less";
import { connect } from 'dva';
import StandardTable from '@/components/StandardTable';
import Link from "umi/link";
import React from "react";


const namespace = 'jobs';

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
        ...state.jobs
    };
}
const mapDispatchToProps=(dispatch)=>{
    return {
        loadJobs: (onFailed)=>{
            dispatch({type:`${namespace}/loadJobs`,payload:{onFailed:onFailed}});
        },
        stopJob:(jobName)=>{
            dispatch({type:`${namespace}/stopJob`,payload:{jobName}});
        },
        resubmitJob:(jobName)=>{
            dispatch({type:`${namespace}/resubmitJob`,payload:{jobName}});
        }
    }
};

@connect(mapStateToProps,mapDispatchToProps)
class JobList extends Component{


    columnTitles = [
        formatMessage({id:'jobList.column.jobName'}),
        formatMessage({id:'jobList.column.userName'}),
        formatMessage({id:'jobList.column.vcName'}),
        formatMessage({id:'jobList.column.status'}),
        formatMessage({id:'jobList.column.startTime'}),
        formatMessage({id:'jobList.column.duration'}),
        formatMessage({id:'jobList.column.retries'}),
        formatMessage({id:'jobList.column.stop'}),
        formatMessage({id:'jobList.column.resubmit'})
    ];
    columnDataIndexs = [
        "jobName",
        "userName",
        "vcName",
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


        if(DataIndex ==='stop'){
            return {
                ...columnDef,
                render: (isEnable,record) =>(
                    isEnable?<Popconfirm title={formatMessage({id:'jobList.stop.confirm'})} onConfirm={() => {
                                this.props.stopJob(record.jobName);
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
        }
        
        if(DataIndex ==='resubmit'){
            return {
                ...columnDef,
                render: (isEnable,record) =>(
                    isEnable?<Popconfirm title={formatMessage({id:'jobList.resubmit.confirm'})} onConfirm={() => {
                                this.props.resubmitJob(record.jobName);
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
        }
        
        if(DataIndex ==='status'){
            return {
                ...columnDef,
                search:true,
                searchColumnRender:function Parent(props){
                    let color = getJobStateColor(props.record.status);
                    return (<Tag color={color}>{props.children}</Tag>);
                },
                sorter: (rowADataObj,rowBDataObj) =>{
                    return rowADataObj.status < rowBDataObj.status?1:-1;
                },
            };
        }
        
        if(DataIndex ==='jobName'){
            return {
                ...columnDef,
                search:true,
                searchColumnRender:function Parent(props){
                    return (<Link to={props.record.jobDetailUrl}>{props.children}</Link>);
                },
                sorter: (rowADataObj,rowBDataObj) =>{
                    return rowADataObj.jobName < rowBDataObj.jobName?1:-1;
                },
            };
        }
        
        if(DataIndex ==='vcName'){
            return {
                ...columnDef
            };
        }
        
        if(DataIndex ==='userName'){
            return {
                ...columnDef,
                search:true,
                sorter: (rowADataObj,rowBDataObj) =>{
                    return rowADataObj.userName < rowBDataObj.userName?1:-1;
                },
            };
        }
        
        if(DataIndex ==='startTime'){
            return {
                ...columnDef,
                search:true,
                sorter: (rowADataObj,rowBDataObj) =>{
                    return rowADataObj.startTimeSec < rowBDataObj.startTimeSec?1:-1;
                },
            };
        }
        
        if(DataIndex ==='duration'){
            return {
                ...columnDef,
                render: (duration,record) =>(
                    <Tooltip title={record.durationSec}>
                        {duration}
                    </Tooltip>
                ),
                sorter: (rowADataObj,rowBDataObj) =>{
                    return rowADataObj.durationSec < rowBDataObj.durationSec?1:-1;
                },
            };
        }
        
        if(DataIndex ==='retries'){
            return {
                ...columnDef,
                render: (text) =>(
                    <span>{text}</span>
                ),
                sorter: (rowADataObj,rowBDataObj) =>{
                    return rowADataObj.retries < rowBDataObj.retries?1:-1;
                },
            };
        }
    });

    componentWillMount(){
        this.props.loadJobs(function(){
            message.error(formatMessage({id:'jobList.fetch.failed'}))
        });
    }

    render(){

        return (
            <div className={styles.content}>
                    <StandardTable
                        columns={this.columns}
                        dataSource={this.props.data}
                        loading={this.props.loading}
                    />
            </div>
        )
    }
}


export default  JobList;
