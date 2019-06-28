import React, { Component } from 'react';
import { connect } from 'dva';
import {
    message,
    Popover
} from 'antd';

import StandardTable from '@/components/StandardTable';

import {formatMessage } from 'umi/locale';

import styles from './index.less';
import Link from "umi/link";

const namespace = 'datasets';

function mapStateToProps(state) {
    return {
        ...state.datasets
    };
}
const mapDispatchToProps=(dispatch)=>{
    return {
        loadDataSet: (onFailed)=>{
            dispatch({type:`${namespace}/loadDataSet`,payload:{onFailed:onFailed}});
        },
    }
};

@connect(mapStateToProps,mapDispatchToProps)
class DataSetList extends Component {

    componentWillMount(){
        this.props.loadDataSet(function(){
            message.error(formatMessage({id:'dataset.fetch.failed'}))
        });
    }

    columnTitles = [
        formatMessage({id:'dataset.column.id'}),
        formatMessage({id:'dataset.column.name'}),
        formatMessage({id:'dataset.column.path'}),
        formatMessage({id:'dataset.column.provider'}),
        formatMessage({id:'dataset.column.createtime'})
    ];

    columnDataIndexs = ["id","name","place", "provider", "created_at"];

    columns = this.columnDataIndexs.map((DataIndex,index)=>{

        let columnDef = {
            title:this.columnTitles[index],
            dataIndex:this.columnDataIndexs[index],
            key: this.columnDataIndexs[index]
        };

        if(DataIndex === "id")
        {
            return {
                ...columnDef,
                sorter: (rowADataObj,rowBDataObj) =>{
                    return rowADataObj.id < rowBDataObj.id?1:-1;
                },
                render:(text,record)=>{
                    return (
                        <Popover content={(<div dangerouslySetInnerHTML={{__html:record.description}}></div>)}
                                 title={formatMessage({id:'dataset.title.dec'})}
                                 trigger="hover"
                                 placement="right">
                            <Link to={'#'}>{text}</Link>
                        </Popover>
                    );
                }
            };
        }else if(DataIndex === "name")
        {
            return {
                ...columnDef,
                search:true,
                sorter: (rowADataObj,rowBDataObj) =>{
                    return rowADataObj.name < rowBDataObj.name?1:-1;
                }
            };
        }else if(DataIndex === "place")
        {
            return {
                ...columnDef,
                search:true,
                sorter: (rowADataObj,rowBDataObj) =>{
                    return rowADataObj.place < rowBDataObj.place?1:-1;
                }
            };
        }else if(DataIndex === "provider")
        {
            return {
                ...columnDef,
                search:true,
                sorter: (rowADataObj,rowBDataObj) =>{
                    return rowADataObj.provider < rowBDataObj.provider?1:-1;
                }
            };
        }else if(DataIndex === "created_at")
        {
            return {
                ...columnDef,
                search:true,
                sorter: (rowADataObj,rowBDataObj) =>{
                    return rowADataObj.created_at < rowBDataObj.created_at?1:-1;
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



export default DataSetList;
