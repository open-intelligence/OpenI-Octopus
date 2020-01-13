import React, {Component} from 'react';
import {Form, Input, Button, message, Select } from 'antd';

import BraftEditor from 'braft-editor'
import 'braft-editor/dist/index.css'
import {formatMessage } from 'umi/locale';
import styles from './index.less';

import {connect} from 'dva';

const namespace = "feedbackForm";

function mapStateToProps(state) {
    return {
        ...state.feedbackForm
    };
}

const mapDispatchToProps=(dispatch)=>{
  return {
    submitFeedback:(feedback,callback)=>{
      dispatch({type:`${namespace}/submitFeedback`,payload:{feedback,callback}});
    },
    clearContent:()=>{
      dispatch({type:`${namespace}/clearContent`});
    }
  }
};

const formItemLayout = {
    labelCol: {
        xs: { span: 24 },
        sm: { span: 4 },
    },
    wrapperCol: {
        xs: { span: 24 },
        sm: { span: 20 },
    },
};
const tailFormItemLayout = {
    wrapperCol: {
        xs: {
            span: 24,
            offset: 0,
        },
        sm: {
            span: 16,
            offset: 4,
        },
    },
};
@connect(mapStateToProps,mapDispatchToProps)
class FeedbackFormComponent extends Component {

    // async componentDidMount () {
    //     // 假设此处从服务端获取html格式的编辑器内容
    //     const htmlContent = await fetchEditorContent()
    //     // 使用BraftEditor.createEditorState将html字符串转换为编辑器需要的editorStat
    //     this.setState({
    //         editorState: BraftEditor.createEditorState(htmlContent)
    //     })
    // }

    handleSubmit = (e) =>{
      e.preventDefault();
      this.props.form.validateFieldsAndScroll((err, values) => {
        if (err) {
          return
        }
        if(values.context){
          values.context = values.context.toHTML()
        }
        this.props.submitFeedback(values,(err)=>{
          if(err){
            message.error(err.message || err);
            return;
          }
          message.success("提交成功");
          this.props.form.resetFields();
          this.props.clearContent();
        });
      });
    }

    contextChange = () =>{

    }

    contextSave = () =>{

    }

    render() {
        const props = this.props;
        const { getFieldDecorator } = props.form;

        return (
            <Form {...formItemLayout} onSubmit={this.handleSubmit}>
              <Form.Item label={formatMessage({id:'expressway.tab.feedback.form.title'})}>
                  {getFieldDecorator('title', {
                      rules: [
                          {
                              required: true,
                              message: formatMessage({id:'expressway.tab.feedback.form.title.required.message'}),
                          },
                      ],
                  })(<Input />)}
              </Form.Item>
              <Form.Item label={formatMessage({id:'expressway.tab.feedback.form.type'})}>
                {getFieldDecorator('type', {
                  initialValue: props.defaultSelectFeedbackType,
                  rules: [
                    {
                      required: true,
                      message: formatMessage({id:'expressway.tab.feedback.form.type.required.message'}),
                    },
                  ],
                })(
                  <Select placeholder={formatMessage({id:'expressway.tab.feedback.form.type.required.message'})}>
                    <Select.Option value={props.feedbackTypes.SystemException}>{formatMessage({id:'expressway.tab.feedback.form.type.SystemException'})}</Select.Option>
                    <Select.Option value={props.feedbackTypes.ResourceProblem}>{formatMessage({id:'expressway.tab.feedback.form.type.ResourceProblem'})}</Select.Option>
                  </Select>
                )}
              </Form.Item>
              <Form.Item label={formatMessage({id:'expressway.tab.feedback.form.context'})}  className="editor-wrapper">
                  {getFieldDecorator('context', {
                      initialValue:props.editorState,
                      rules: [
                          {
                              required: true,
                              message: formatMessage({id:'expressway.tab.feedback.form.context.required.message'}),
                          },
                          // {
                          //     validator: this.validateToNextPassword,
                          // },
                      ],
                  })(<BraftEditor
                    className={styles.editorbox}
                    onChange={this.contextChange}
                    onSave={this.contextSave}
                    excludeControls={['emoji','media']}
                  />)}
              </Form.Item>
              <Form.Item {...tailFormItemLayout}>
                  <Button type="primary" htmlType="submit">
                      {formatMessage({id:'expressway.tab.feedback.form.submit'})}
                  </Button>
              </Form.Item>
            </Form>
        );
    }
}

const WrappedFeedbackFormComponent = Form.create()(FeedbackFormComponent);

export default WrappedFeedbackFormComponent;
