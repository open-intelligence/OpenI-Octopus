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

const namespace = 'images';

function mapStateToProps(state) {
    return {
        ...state.images
    };
}
const mapDispatchToProps=(dispatch)=>{
    return {
        loadImageSet: (onFailed)=>{
            dispatch({type:`${namespace}/loadImageSet`,payload:{onFailed:onFailed}});
        },
    }
};

@connect(mapStateToProps,mapDispatchToProps)
class ImageList extends Component {

    componentDidMount(){
        this.props.loadImageSet(function(){
            message.error(formatMessage({id:'imageset.fetch.failed'}))
        });
    }

    columnTitles = [
        formatMessage({id:'imageset.column.id'}),
        formatMessage({id:'imageset.column.name'}),
        formatMessage({id:'imageset.column.path'}),
        formatMessage({id:'imageset.column.provider'}),
        formatMessage({id:'imageset.column.createtime'})
    ];

    columnDataIndexs = ["id","name","place", "provider", "createtime"];

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
                                 title={formatMessage({id:'imageset.title.dec'})}
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
        }else if(DataIndex === "createtime")
        {
            return {
                ...columnDef,
                search:true,
                sorter: (rowADataObj,rowBDataObj) =>{
                    return rowADataObj.createtime < rowBDataObj.createtime?1:-1;
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



export default ImageList;
