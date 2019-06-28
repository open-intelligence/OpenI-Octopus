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
    Tag
} from 'antd';

import StandardTable from '@/components/StandardTable';

import {formatMessage } from 'umi/locale';

import styles from './index.less';
import Link from "umi/link";

const namespace = 'services';

function mapStateToProps(state) {
    return {
        ...state.services
    };
}
const mapDispatchToProps=(dispatch)=>{
    return {
        loadServices: (onFailed)=>{
            dispatch({type:`${namespace}/loadServices`,payload:{onFailed:onFailed}});
        },
    }
};

@connect(mapStateToProps,mapDispatchToProps)
class Services extends Component {

    componentDidMount(){
        this.props.loadServices(function(){
            message.error(formatMessage({id:'services.error.failed'}))
        });
    }

    columnTitles = [
        formatMessage({id:'services.column.nodeName'}),
        formatMessage({id:'services.column.openIRoles'}),
        formatMessage({id:'services.column.services'})
    ];

    columnDataIndexs = ["nodeName","roles","services"];

    columns = this.columnDataIndexs.map((DataIndex,index)=>{
        let columnDef = {
            title:this.columnTitles[index],
            dataIndex:this.columnDataIndexs[index],
            key: this.columnDataIndexs[index]
        };

        if(DataIndex === "nodeName")
        {
            return {
                ...columnDef,
                search:true,
                searchColumnRender:function Parent(props){
                    return (<Link to={props.record.nodeUrl}>{props.children}</Link>);
                },
                sorter: (rowADataObj,rowBDataObj) =>{
                    return rowADataObj.nodeName < rowBDataObj.nodeName?1:-1;
                },
            };
        }else if(DataIndex === "roles")
        {
            return {
                ...columnDef,
                search:true,
                isStringArray:true,//数据是数组，定义其子数据的渲染样式
                searchColumnRender:function Parent(props){
                    return (
                        <Tag color={'#3c8dbc'}>{props.children}</Tag>
                    );
                }
            };
        }else if(DataIndex === "services")
        {
            return {
                ...columnDef,
                search:true,
                isObjectArray:true,
                searchColumnRender:function Parent(props){
                    return (
                        <Tag color={props.record.labelColor}>
                            <a href="javascript:;">{props.children} </a>
                        </Tag>);
                }
            };
        }

    });

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



export default Services;
