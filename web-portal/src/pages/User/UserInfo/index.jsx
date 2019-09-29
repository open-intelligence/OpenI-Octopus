import React, { Component } from 'react';
import { connect } from 'dva';
import {
    Spin,Row,Col,message,Form, Input, Button,Select,
} from 'antd';

import {formatMessage } from 'umi/locale';

import styles from './index.less';
const namespace = 'userInfo';

const { Option } = Select;

function mapStateToProps({userInfo,loading}) {
    return {
        ...userInfo,
        loading:loading.effects['userInfo/getUserInfo'],
    };
}
const mapDispatchToProps=(dispatch)=>{
    return {
        getUserInfo: (onFailed)=>{
            dispatch({type:`${namespace}/getUserInfo`,payload:{onFailed}});
        },
        saveUserInfo: (params,onFailed,onSuccessed)=>{
            dispatch({type:`${namespace}/saveUserInfo`,payload:{params,onFailed,onSuccessed}});
        }
    }
};

@connect(mapStateToProps,mapDispatchToProps)
class UserInfo extends Component {


    componentDidMount(){

        this.props.getUserInfo(function(){
            message.error(formatMessage({id:'userInfo.fetch.failed'}))
        });
    }

    componentWillReceiveProps(nextProps) {

        let newFormInfo={};
        if (nextProps.phonePrefix !== this.props.phonePrefix) {
            newFormInfo.phonePrefix = nextProps.phonePrefix;
        }

        if (nextProps.phoneNum !== this.props.phoneNum) {
            newFormInfo.phoneNum = nextProps.phoneNum;
        }

        if (nextProps.email !== this.props.email) {
            newFormInfo.email = nextProps.email;
        }

        if (nextProps.fullName !== this.props.fullName)
        {
            newFormInfo.fullName = nextProps.fullName;
        }

        if (nextProps.teacher !== this.props.teacher)
        {
            newFormInfo.teacher = nextProps.teacher;
        }

        if(Object.keys(newFormInfo).length !== 0){
            this.props.form.setFieldsValue(newFormInfo);
        }
    }

    handleSubmit = (e) => {
        e.preventDefault();

        const props = this.props;

        this.props.form.validateFields((err, values) => {
            if (!err) {
                props.saveUserInfo(values,function(){
                    message.error(formatMessage({id:'userInfo.save.failed'}))
                },function () {
                    message.success(formatMessage({id:'userInfo.save.successed'}))
                });
               // console.log("UserInfo",'Received values of form: ', values);
            }
        });
    };

    render(){

        const { getFieldDecorator } = this.props.form;
        const formItemLayout = {
            labelCol: {
                xs: { span: 24 },
                sm: { span: 8 },
            },
            wrapperCol: {
                xs: { span: 24 },
                sm: { span: 16 },
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
                    offset: 8,
                },
            },
        };

        const prefixSelector = getFieldDecorator('phonePrefix', {
            initialValue: '+86',
        })(
            <Select style={{ width: 70 }}>
                <Option value="+86">+86</Option>
            </Select>
        );

        return (
            <div className={styles.content}>
                <Spin spinning={this.props.loading}>
                <Row type="flex" justify="center">
                    <Col span={12}>
                        <Col xs={{ span: 24}}
                             sm={{ span: 16, offset:8 }}
                             md={{ span: 16, offset:8 }}
                             lg={{ span: 16, offset:8 }}
                             xl={{ span: 16, offset:8 }}>
                            <div className={styles.title}>
                                <h2>{formatMessage({id:'userInfo.title'})}</h2>
                            </div>
                        </Col>
                    </Col>
                </Row>
                <Row type="flex" justify="center">
                    <Col span={12}>
                        <Form onSubmit={this.handleSubmit}>

                            <Form.Item
                                {...formItemLayout}
                                label={formatMessage({id:'userInfo.phone.label'})}
                            >
                                {getFieldDecorator('phoneNum', {
                                    rules: [{
                                        required: true,
                                        pattern:/^1(3|4|5|7|8)\d{9}$/,
                                        message: formatMessage({id:'userInfo.phone.error'}) }],
                                })(
                                    <Input addonBefore={prefixSelector} style={{ width: '100%' }} />
                                )}
                            </Form.Item>

                            <Form.Item
                                {...formItemLayout}
                                label={formatMessage({id:'userInfo.email.label'})}
                            >
                                {getFieldDecorator('email', {
                                    rules: [{
                                        type: 'email', message: formatMessage({id:'userInfo.email.error.format'}),
                                    }, {
                                        required: true, message: formatMessage({id:'userInfo.email.error'}),
                                    }],
                                })(
                                    <Input />
                                )}
                            </Form.Item>
                            <Form.Item
                                {...formItemLayout}
                                label={formatMessage({id:'userInfo.fullName.label'})}
                            >
                                {getFieldDecorator('fullName', {
                                    rules: [{
                                        required: true,
                                        message: formatMessage({id:'userInfo.fullName.error'}),
                                        whitespace: true
                                    }],
                                })(
                                    <Input />
                                )}
                            </Form.Item>
                            <Form.Item
                                {...formItemLayout}
                                label={formatMessage({id:'userInfo.teacher.label'})}
                            >
                                {getFieldDecorator('teacher', {
                                    rules: [{ required: true, message: formatMessage({id:'userInfo.teacher.error'}), whitespace: true }],
                                })(
                                    <Input />
                                )}
                            </Form.Item>
                            <Form.Item
                                {...tailFormItemLayout}
                            >
                                <Button type="primary"
                                        htmlType='submit'>
                                    {formatMessage({id:'userInfo.btn.save'})}
                                </Button>
                            </Form.Item>
                        </Form>
                    </Col>
                </Row>
                </Spin>
            </div>
        );
    }
}

const UserInfoForm = Form.create({ name: 'userInfo' })(UserInfo);

export default UserInfoForm;
