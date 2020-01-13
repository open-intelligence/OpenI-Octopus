import React, {Component} from 'react';
import {Form, Drawer, Input, Button, Tabs } from 'antd';

import {formatMessage } from 'umi/locale';
import styles from './index.less';
import FeedbackForm from "@/components/FeedbackForm";
import WorkOrderForm from "@/components/WorkOrderForm";
import {connect} from 'dva';

const namespace = "expressWay";

function mapStateToProps(state) {
    return {
        ...state.expressWay
    };
}

const mapDispatchToProps=(dispatch)=>{
    return {
        toggle: () => {
            dispatch({type:`${namespace}/toggle`})
        },
    }
};
const { TabPane } = Tabs;
@connect(mapStateToProps,mapDispatchToProps)
class ExpressWayComponent extends Component {

    // async componentDidMount () {
    //     // 假设此处从服务端获取html格式的编辑器内容
    //     const htmlContent = await fetchEditorContent()
    //     // 使用BraftEditor.createEditorState将html字符串转换为编辑器需要的editorStat
    //     this.setState({
    //         editorState: BraftEditor.createEditorState(htmlContent)
    //     })
    // }

    toggle = () => {
        this.props.toggle()
    };

    onTabChange = (key)=>{

    };

    render() {
        const show = this.props.show;
        return (
          <div className={show?styles.expresswaybtn_show:styles.expresswaybtn_hidden}>
              <div onClick={this.toggle} className={styles.expresswaybtn}>{formatMessage({id:'expressway.btnText'})}</div>
              <Drawer
                title={formatMessage({id:'expressway.panelText'})}
                placement="right"
                closable={false}
                width="512"
                onClose={this.toggle}
                visible={this.props.visible}
              >
                  <Tabs defaultActiveKey="1" onChange={this.onTabChange}>
                      <TabPane tab={formatMessage({id:'expressway.tab.workOrder.title'})} key="1">
                          <WorkOrderForm/>
                      </TabPane>
                      <TabPane tab={formatMessage({id:'expressway.tab.feedback.title'})} key="2">
                          <FeedbackForm/>
                      </TabPane>
                  </Tabs>
              </Drawer>
          </div>

        );
    }
}

const WrappedExpressWayComponent = Form.create()(ExpressWayComponent);

export default WrappedExpressWayComponent;
