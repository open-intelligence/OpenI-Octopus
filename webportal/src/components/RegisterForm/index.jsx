import React, {Component} from 'react';
import {Form, Icon, Input, Button, Modal,message,Spin} from 'antd';
import {accountRegister} from "@/services/api";
import {formatMessage } from 'umi/locale';
import styles from './index.less';
import { routerRedux } from 'dva/router';
import {connect} from 'dva';
const namespace = 'register';

function mapStateToProps(state) {
    return {
        ...state.register
    };
}

const mapDispatchToProps=(dispatch)=>{
    return {
        getAccountUserInfo: (onFailed)=>{
            dispatch({type:`${namespace}/accountUserInfo`, payload:{onFailed:onFailed}});
        },
        accountRegister: (params,onFailed)=>{
            dispatch({type:`${namespace}/accountRegister`,payload:{params:params,onFailed:onFailed}});
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

            props.accountRegister(values,function(resMessage){
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
    }

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
        return (
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
                        <Form.Item>
                            {getFieldDecorator('username', {
                                rules: [{ required: true, message: formatMessage({id:'register.username.message'})}],
                            })(
                                <Input prefix={<Icon type="user" style={{ color: 'rgba(0,0,0,.25)' }} />}
                                       placeholder={formatMessage({id:'register.username'})} />
                            )}
                        </Form.Item>
                        <Form.Item>
                            {getFieldDecorator('password', {
                                rules: [
                                    { required: true, message: formatMessage({id:'register.password.message'}) },
                                    { validator: this.validateToNextPassword }
                                ],
                            })(
                                <Input prefix={<Icon type="lock" style={{ color: 'rgba(0,0,0,.25)' }} />}
                                       type="password" placeholder={formatMessage({id:'register.password'})} />
                            )}
                        </Form.Item>
                        <Form.Item>
                            {getFieldDecorator('confirmPassword', {
                                rules: [
                                    { required: true, message: formatMessage({id:'register.password.message'}) },
                                    { validator: this.compareToFirstPassword }
                                ],
                            })(
                                <Input prefix={<Icon type="lock" style={{ color: 'rgba(0,0,0,.25)' }} />}
                                       type="password" placeholder={formatMessage({id:'register.password.confirm'})}
                                       onBlur={this.handleConfirmBlur} />
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
        );
    }
}

const WrappedNormalRegisterForm = Form.create()(NormalRegisterForm);

export default WrappedNormalRegisterForm;
