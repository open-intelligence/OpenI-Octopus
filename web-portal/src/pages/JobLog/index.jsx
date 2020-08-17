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
import { List,message,PageHeader} from 'antd';
import styles from "./index.less";
import {formatMessage } from 'umi/locale';

import InfiniteScroll from 'react-infinite-scroller';

const namespace = 'jobLog';

function mapStateToProps(state) {
    return {
        ...state.jobLog
    };
}

const mapDispatchToProps=(dispatch)=>{
    return {
        loadLogNextPage: (pageToken,onFailed)=>{
            dispatch({type:`${namespace}/loadLogNextPage`,payload:{pageToken,onFailed}});
        },
        getFistPageAndPageToken: (pageToken,onFailed) => {
            dispatch({type:`${namespace}/getFistPageAndPageToken`,payload:{pageToken,onFailed}});
        }

    }
};

@connect(mapStateToProps,mapDispatchToProps)
class JobLog extends Component {

    componentDidMount(){
        this.props.getFistPageAndPageToken(function(){
            message.error(formatMessage({id:'jobLog.fetch.failed'}))
        });
    }

  handleInfiniteOnLoad = () => {
    
   //let hasMorelog = !this.props.loading && (this.props.pageLogList.length<this.props.totalLogNumber);
   //console.log("haseMoreLog: ",hasMorelog)

    this.props.loadLogNextPage(this.props.pageToken, function(){
        message.error(formatMessage({id:'jobLog.fetch.failed'}))
    });
  };

  render() {
    return (
      <div>
          <PageHeader  title={formatMessage({id:'jobLog.header.title'})}
                                 subTitle={this.props.job+" / "+this.props.taskName} />
        
            <div className={styles.infinitecontainer}>
                <InfiniteScroll 
                initialLoad={false}
                pageStart={0}
                loadMore={this.handleInfiniteOnLoad}
                hasMore={!this.props.loading && (this.props.pageLogList.length<this.props.totalLogNumber)}
                useWindow={false}
                
                >
                <List
                    size={"small"}
                    dataSource={this.props.pageLogList}
                    renderItem={item => {

                        let logmsg =item.message;

                        return (
                            <List.Item
                                key={item._id}
                            >
                                {
                                    logmsg
                                }
                            </List.Item>
                        )
                    }
                    }
                >
                    {this.props.loading && (this.props.pageLogList.length<this.props.totalLogNumber) && (
                    <div className={styles.loadingcontainer}>
                        <Spin />
                    </div>
                    )}
                </List>
                </InfiniteScroll>
        </div>
      </div>
      
    );
  }
}

export default JobLog
