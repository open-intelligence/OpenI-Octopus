import React, {Component} from 'react';
import {Form, Icon, Input, Button, Modal,message,Spin,Row,Col,Select,Cascader} from 'antd';
import {accountRegister} from "@/services/api";
import {formatMessage } from 'umi/locale';
import styles from './index.less';
import { routerRedux } from 'dva/router';
import {connect} from 'dva';

const { Option } = Select;

const namespace = 'register';

function mapStateToProps(state) {
    return {
        ...state.register
    };
}

const mapDispatchToProps=(dispatch)=>{
    return {
        getAccountUserInfo: (onFailed)=>{
            dispatch({type:`${namespace}/getAccountUserInfo`, payload:{onFailed:onFailed}});
        },
        registerAccount: (params,onFailed)=>{
            dispatch({type:`${namespace}/registerAccount`,payload:{params:params,onFailed:onFailed}});
        },
        visibleSuccessModelWindow: (visible)=>{
            dispatch({type:`${namespace}/visibleSuccessModelWindow`,payload:{visibleSuccessModel:visible}});
        },
        goToHomePage: ()=>{
            dispatch({type:`${namespace}/goToHomePage`});
        },
    }
};

@connect(mapStateToProps,mapDispatchToProps)
class NormalRegisterForm extends Component {

    state = {
        confirmDirty: false,
    };

    componentWillMount(){
        this.props.getAccountUserInfo(function(resMessage){
            message.error(resMessage)
        });
    }

    visibleModel = (visible) => {
        this.props.visibleSuccessModelWindow(visible);
    };

    handleSubmit = (e) => {
        e.preventDefault();
        const props = this.props;
        props.form.validateFields((err, values) => {
            if (err) {
                return
            }
            delete values['confirmPassword'];

            props.registerAccount(values,function(resMessage){
                message.error(resMessage)
            });
        });
    };

    compareToFirstPassword = (rule, value, callback) => {
        const form = this.props.form;
        if (value && value !== form.getFieldValue('password')) {
            callback(formatMessage({id:'register.password.confirm.message'}));
        } else {
            callback();
        }
    };

    validateToNextPassword = (rule, value, callback) => {
        const form = this.props.form;
        if (value && this.state.confirmDirty) {
            form.validateFields(['confirmPassword'], { force: true });
        }
        callback();
    };

    handleConfirmBlur = (e) => {
        const value = e.target.value;
        this.setState({ confirmDirty: this.state.confirmDirty || !!value });
    };

    handleOk = ()=>{
        this.props.goToHomePage()
    };

    handleCancel = ()=>{
        this.visibleModel(false);
    };

    render() {
        const { getFieldDecorator } = this.props.form;

        const prefixSelector = getFieldDecorator('phonePrefix', {
            initialValue: '+86',
        })(
            <Select style={{ width: 70 }}>
                <Option value="+86">+86</Option>
            </Select>
        );

        return (
            <Row type="flex" justify="center">
                <Col span={14}>
                    <div>
                        <Modal
                            closable={false}
                            title={formatMessage({id:'register.model.title'})}
                            visible={this.props.visibleSuccessModel}
                            onOk={this.handleOk}
                            onCancel={this.handleCancel}
                            okText={formatMessage({id:'register.model.button.ok.text'})}
                            cancelText={formatMessage({id:'register.model.button.cancel.text'})}
                        >
                            <p>{formatMessage({id:'register.model.success.message'})} {this.props.username}</p>
                        </Modal>

                        <Spin spinning={this.props.load}>
                            <Form onSubmit={this.handleSubmit}>
                                <Form.Item label={formatMessage({id:'register.username'})} >
                                    {getFieldDecorator('username', {
                                        rules: [{ required: true, message: formatMessage({id:'register.username.message'})}],
                                    })(
                                        <Input prefix={<Icon type="user" style={{ color: 'rgba(0,0,0,.25)' }} />} />
                                    )}
                                </Form.Item>

                                <Form.Item label={formatMessage({id:'register.password'})}>
                                    {getFieldDecorator('password', {
                                        rules: [
                                            { required: true, message: formatMessage({id:'register.password.message'}) },
                                            { validator: this.validateToNextPassword }
                                        ],
                                    })(
                                        <Input prefix={<Icon type="lock" style={{ color: 'rgba(0,0,0,.25)' }} />}
                                               type="password" />
                                    )}
                                </Form.Item>

                                <Form.Item label={formatMessage({id:'register.password.confirm'})}>
                                    {getFieldDecorator('confirmPassword', {
                                        rules: [
                                            { required: true, message: formatMessage({id:'register.password.message'}) },
                                            { validator: this.compareToFirstPassword }
                                        ],
                                    })(
                                        <Input prefix={<Icon type="lock" style={{ color: 'rgba(0,0,0,.25)' }} />}
                                               type="password" onBlur={this.handleConfirmBlur} />
                                    )}
                                </Form.Item>

                                <Form.Item
                                    label={formatMessage({id:'userInfo.realName.label'})}
                                >
                                    {getFieldDecorator('realName', {
                                        rules: [{
                                            required: true,
                                            message: formatMessage({id:'userInfo.realName.error'}),
                                            whitespace: true
                                        }],
                                    })(
                                        <Input />
                                    )}
                                </Form.Item>

                                <Form.Item
                                    label={formatMessage({id:'userInfo.innerAccount.label'})}
                                >
                                    {getFieldDecorator('innerAccount', {
                                        rules: [{
                                            required: true,
                                            message: formatMessage({id:'userInfo.innerAccount.error'}),
                                            whitespace: true
                                        }],
                                    })(
                                        <Input />
                                    )}
                                </Form.Item>

                                <Form.Item
                                    label={formatMessage({id:'userInfo.phone.label'})}
                                >
                                    {getFieldDecorator('phone', {
                                        rules: [{
                                            required: true,
                                            pattern:/^1(3|4|5|7|8)\d{9}$/,
                                            message: formatMessage({id:'userInfo.phone.error'}) }],
                                    })(
                                        <Input addonBefore={prefixSelector} style={{ width: '100%' }} />
                                    )}
                                </Form.Item>

                                <Form.Item
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
                                    label={formatMessage({id:'userInfo.tutor.label'})}
                                >
                                    {getFieldDecorator('tutor', {
                                        rules: [{ required: true, message: formatMessage({id:'userInfo.tutor.error'}), whitespace: true }],
                                    })(
                                        <Input />
                                    )}
                                </Form.Item>

                                <Form.Item
                                    label={formatMessage({id:'userInfo.center.project.label'})}
                                >
                                    {getFieldDecorator('orgInfoArray', {
                                        rules: [{
                                            type: 'array',
                                            required: true,
                                            message: formatMessage({id:'userInfo.center.project.error'}) }],
                                    })(
                                        <Cascader placeholder={''} options={this.props.orgInfo} />
                                    )}
                                </Form.Item>

                                <Form.Item>
                                    <Button type="primary" htmlType="submit" className={styles["register-form-button"]}>
                                        {formatMessage({id:'register.button.register'})}
                                    </Button>
                                </Form.Item>
                            </Form>
                        </Spin>
                    </div>
                </Col>
            </Row>
        );
    }
}

const WrappedNormalRegisterForm = Form.create()(NormalRegisterForm);

export default WrappedNormalRegisterForm;
