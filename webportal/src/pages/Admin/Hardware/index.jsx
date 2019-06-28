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
    Badge,
    Tooltip,
} from 'antd';

import StandardTable from '@/components/StandardTable';

import {formatMessage } from 'umi/locale';

import styles from './index.less';
import Link from "umi/link";

const namespace = 'hardware';

function mapStateToProps(state) {
    return {
        ...state.hardware
    };
}
const mapDispatchToProps=(dispatch)=>{
    return {
        loadData: (onFailed)=>{
            dispatch({type:`${namespace}/loadData`,payload:{onFailed:onFailed}});
        }
    }
};

@connect(mapStateToProps,mapDispatchToProps)
class HardwareList extends Component {

    componentDidMount(){
        //console.log("HardwareList",this.props.admin);
        this.props.loadData(function(){
            message.error(formatMessage({id:'hardware.error.failed'}))
        });
    }

    columnTitles = [
        formatMessage({id:'hardware.column.ip'}),
        formatMessage({id:'hardware.column.machine'}),
        formatMessage({id:'hardware.column.cpu'}),
        formatMessage({id:'hardware.column.mem'}),
        formatMessage({id:'hardware.column.gpu'}),
        formatMessage({id:'hardware.column.gpumem'}),
        formatMessage({id:'hardware.column.disk'}),
        formatMessage({id:'hardware.column.eth'})
    ];
    columnDataIndexs = ["ip","machine","cpu", "mem", "gpu", "gpumem", "disk", "eth"];

    columns = this.columnDataIndexs.map((DataIndex,index)=>{


        let columnDef = {
            title:this.columnTitles[index],
            dataIndex:this.columnDataIndexs[index],
            key: this.columnDataIndexs[index]
        };

        if(DataIndex === "ip")
        {
            return {
                ...columnDef,
                search:true,
                searchColumnRender:function Parent(props){
                    return (<Link to={props.record.ipNodeUrl}>{props.children}</Link>);
                },
                sorter: (rowADataObj,rowBDataObj) =>{
                   return rowADataObj.ip < rowBDataObj.ip?1:-1;
                },
            };
        }else if(DataIndex === 'machine'){
            return {
                ...columnDef,
                search:true,
                searchColumnRender:function Parent(props){
                    return (<h5>{props.children}</h5>);
                },
                sorter: (rowADataObj,rowBDataObj) =>{
                    return rowADataObj.machine < rowBDataObj.machine?1:-1;
                },
            };
        }else{
            return {
                ...columnDef,
                render: (info) =>(
                    <Tooltip title={info.percent}>
                    <Badge status={info.status} width={15} height={15}>
                    </Badge>
                    </Tooltip>
                )
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



export default HardwareList;
