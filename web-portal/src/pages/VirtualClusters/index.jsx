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
import React, { Component } from 'react';
import { connect } from 'dva';
import {
    message,
    Divider
} from 'antd';

import StandardTable from '@/components/StandardTable';
import {formatMessage } from 'umi/locale';
import styles from './index.less';
import router from 'umi/router';

const namespace = 'virtualClusters';

function mapStateToProps(state) {
    return {
        ...state.virtualClusters
    };
}

const mapDispatchToProps=(dispatch)=>{
    return {
        loadVirtualClusters(onFailed){
            dispatch({type:`${namespace}/loadVirtualClusters`,payload:{onFailed:onFailed}});
        },
        goToJobs(query){
            dispatch({type:`${namespace}/goToJobs`,query});
        }
    }
};

@connect(mapStateToProps,mapDispatchToProps)
class VirtualCluster extends Component {

    componentDidMount(){
        this.props.loadVirtualClusters(function(){
            message.error(formatMessage({id:'virtualClusters.fetch.failed'}))
        });
    }

    columnTitles = [
        formatMessage({id:'virtualClusters.column.name'}),
        formatMessage({id:'virtualClusters.column.capacity'}),
        formatMessage({id:'virtualClusters.column.usedCapacity'}),
        formatMessage({id:'virtualClusters.column.memory'}),
        formatMessage({id:'virtualClusters.column.vCores'}),
        formatMessage({id:'virtualClusters.column.GPUs'}),
        formatMessage({id:'virtualClusters.column.numActiveJobs'}),
        formatMessage({id:'virtualClusters.column.action'})
    ];

    columnDataIndexs = ["name","capacity","usedCapacity", "memory", "vCores", "GPUs", "numActiveJobs"];

    columns = this.columnDataIndexs.map((DataIndex,index)=>{
        let column = {
            title:this.columnTitles[index],
            dataIndex:this.columnDataIndexs[index],
            key: this.columnDataIndexs[index],
        };
        if(DataIndex === "capacity" || DataIndex === "usedCapacity") {
            column.render = (text)=>{
                return Math.floor(text*100)/100+'%';
            }
        }else if(DataIndex === 'name'){
            column.search = true;
        }else if(DataIndex === 'memory'){
            column.render = (text)=>{
                return text+'MB';
            }
        }
        return column;
    }).concat({
        dataIndex:'__action__',
        title:formatMessage({id:'virtualClusters.column.action'}),
        key:'action',
        render:(text, record) => {
            return (
                <span>
                      <a onClick={()=>this.viewJob(record.name)}>{formatMessage({id:'virtualClusters.column.button.viewJob.name'})}</a>
                </span>
            )
        }
    });

    viewJob = (name)=>{
        // this.props.goToJobs({vcName:name});
        router.push('/openi/jobs?vcName='+name);
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
        );
    }
}

export default VirtualCluster
