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
import { Card,List,Alert,message,PageHeader} from 'antd';
import styles from "./index.less";
import {formatMessage } from 'umi/locale';
import moment from 'moment';

const namespace = 'jobLog';

function mapStateToProps(state) {
    return {
        ...state.jobLog
    };
}

const mapDispatchToProps=(dispatch)=>{
    return {
        loadLog: (pageNumber,onFailed)=>{
            dispatch({type:`${namespace}/loadLog`,payload:{pageNumber,onFailed}});
        },

    }
};

@connect(mapStateToProps,mapDispatchToProps)
class JobLog extends Component {

    loadLog=(pageNumber)=>{
        this.props.loadLog(pageNumber,function(){
            message.error(formatMessage({id:'jobLog.fetch.failed'}))
        });
    };

    componentWillMount(){
        this.loadLog(1);
    }

    render(){

        return (
            <div className={styles.content}>
                <Card bordered={false}>
                    <List
                        loading={this.props.loading}
                        itemLayout="vertical"
                        size="small"
                        header={<PageHeader  title={formatMessage({id:'jobLog.header.title'})}
                                             subTitle={this.props.job+" / "+this.props.taskName} />}
                        pagination={{
                            onChange: pageNumber => {
                                //console.log(pageNumber);

                                this.loadLog(pageNumber);

                            },
                            pageSize: this.props.pageSize,
                            total: this.props.totalLogNumber
                        }}
                        dataSource={this.props.pageLogList}

                        renderItem={item =>{
                            let logTime = moment.utc(item._source["@timestamp"]).toDate();
                            logTime = moment(logTime).format("YYYY/MM/DD hh:mm:ss");

                            let logmsg = "["+logTime+"] " + item._source.message;

                            if(item._source.stream==="stdout")
                            {
                                logmsg = <Alert type="info" message={logmsg} banner />;
                            }

                            if(item._source.stream==="stderr")
                            {
                                logmsg = <Alert type="error" message={logmsg} banner />;
                            }

                            return (
                                <List.Item
                                    key={item._index}
                                >
                                    {
                                        logmsg
                                    }
                                </List.Item>
                               )
                            }
                        }
                    />
                </Card>
            </div>
        )
    }
}

export default JobLog
