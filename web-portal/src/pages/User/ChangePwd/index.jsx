import React, {Component} from 'react';
import {updatePassword} from "@/services/api";
import {Form, Icon, Input, Button, Modal,message,Row,Col} from 'antd';
import {formatMessage } from 'umi/locale';
import {ResponseCodes} from '@/utils/response'
import styles from './index.less';
import {connect} from 'dva';

const namespace = 'user';

const mapDispatchToProps=(dispatch)=>{
    return {
        logout: ()=>{
            dispatch({type:`${namespace}/logout`,cancelRedirect:true});
        },
    }
};

@connect(null,mapDispatchToProps)
class ChangePwdForm extends Component {

    state = {
        confirmDirty: false,
    }

    handleSubmit = (e) => {
        e.preventDefault();
        this.props.form.validateFields((err, values) => {
            if (err) {
                return
            }
            delete values['confirmNewPassword'];
            updatePassword(values).then((result)=>{
                if(!result.success){
                    switch(result.code){
                        case ResponseCodes.WRONG_PASSWORD:
                            return message.error(formatMessage({id:'changePwd.password.old.error'}));
                        case ResponseCodes.FAILURE:
                            return message.error(result.message);
                        default:
                            return message.error(result.message);
                    }
                }
                this.updated()
            }).catch((e)=>{
                message.error(e);
            })
        });
    };

    updated =() => {
        let handler = ()=>{
            this.state.successModal && this.state.successModal.destroy();
            this.handleOk()
        }
        this.state.successModal = Modal.success({
            maskClosable:false,
            title: formatMessage({id:'changePwd.model.title'}),
            content: formatMessage({id:'changePwd.model.success.message'}),
            onOk:handler,
            onCancel:handler
        });
    }


    compareToFirstPassword = (rule, value, callback) => {
        const form = this.props.form;
        if (value && value !== form.getFieldValue('newPassword')) {
            callback(formatMessage({id:'changePwd.password.confirm.message'}));
        } else {
            callback();
        }
    }

    validateToNewPassword = (rule, value, callback) => {
        const form = this.props.form;
        if (value && this.state.confirmDirty) {
            form.validateFields(['confirmNewPassword'], { force: true });
        }
        if (value && value === form.getFieldValue('oldPassword')) {
            callback(formatMessage({id:'changePwd.password.new.no.equal'}));
        }
        callback();
    }

    handleConfirmBlur = (e) => {
        const value = e.target.value;
        this.setState({ confirmDirty: this.state.confirmDirty || !!value });
    }

    handleOk = ()=>{
        setTimeout(()=>{
            this.props.logout()
        },1000)
    }

    render(){
        const {
            getFieldDecorator
        } = this.props.form;

        const formItemLayout = {

        };
        return (
            <Row className={styles.content}>
                <Col span={8} offset={8}>
                    <div className={styles['cpwd-form-title']}><h2>{formatMessage({id:'changePwd.title'})}</h2></div>
                    <Form onSubmit={this.handleSubmit}>
                        <Form.Item {...formItemLayout} label={formatMessage({id:'changePwd.password.old'})}>
                            {getFieldDecorator('oldPassword', {
                                rules: [
                                    {required: true, message: formatMessage({id:'changePwd.password.old.required'})},
                                    {min:6,message: formatMessage({id: "changePwd.password.length.errMsg"})}
                                ],
                            })(
                                <Input prefix={<Icon type="user" style={{ color: 'rgba(0,0,0,.25)' }} />}
                                       type="password" placeholder={formatMessage({id:'changePwd.password.required'})} />
                            )}
                        </Form.Item>
                        <Form.Item {...formItemLayout} label={formatMessage({id:'changePwd.password.new'})}>
                            {getFieldDecorator('newPassword', {
                                rules: [
                                    { required: true, message: formatMessage({id:'changePwd.password.new.required'}) },
                                    { validator: this.validateToNewPassword },
                                    {min:6,message: formatMessage({id: "changePwd.password.length.errMsg"})}
                                ],
                            })(
                                <Input prefix={<Icon type="lock" style={{ color: 'rgba(0,0,0,.25)' }} />}
                                       type="password" placeholder={formatMessage({id:'changePwd.password.required'})} />
                            )}
                        </Form.Item>
                        <Form.Item {...formItemLayout} label={formatMessage({id:'changePwd.password.new.confirm'})}>
                            {getFieldDecorator('confirmNewPassword', {
                                rules: [
                                    { required: true, message: formatMessage({id:'changePwd.password.new.confirm.required'}) },
                                    { validator: this.compareToFirstPassword },
                                    {min:6,message: formatMessage({id: "changePwd.password.length.errMsg"})}
                                ],
                            })(
                                <Input prefix={<Icon type="lock" style={{ color: 'rgba(0,0,0,.25)' }} />}
                                       type="password" onBlur={this.handleConfirmBlur} placeholder={formatMessage({id:'changePwd.password.required'})} />
                            )}
                        </Form.Item>
                        <Form.Item >
                            <Button type="primary" htmlType="submit" block>
                                {formatMessage({id:'changePwd.button.submit'})}
                            </Button>
                        </Form.Item>
                    </Form>
                </Col>
            </Row>
        )
    }
}

const WrappedChangePwdForm = Form.create()(ChangePwdForm);

export default WrappedChangePwdForm;
