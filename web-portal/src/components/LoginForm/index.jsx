import React, {Component} from 'react';
import {Form, Icon, Input, Button,Tooltip,Spin} from 'antd';

import {formatMessage } from 'umi/locale';
import styles from './index.less';

import openiLogo from '@/assets/img/openi-logo.png';

import {connect} from 'dva';

const namespace = 'login';

function mapStateToProps(state) {
    return {
        ...state.login
    };
}

const mapDispatchToProps=(dispatch)=>{
    return {
        login: (params,onFailed,onSuccessed)=>{
            dispatch({type:`${namespace}/login`,payload:{params,onFailed,onSuccessed}});
        },
        shouldAutoLogin:()=>{
            dispatch({type:`${namespace}/shouldAutoLogin`});
        },
        loginSuccess:() =>{
            dispatch({type:`login/loginSuccess`});
        },
        loginFail:(errMsg) =>{
            dispatch({type:`login/loginFail`,payload:{errMsg}});
        }
    }
};

@connect(mapStateToProps,mapDispatchToProps)
class NormalLoginForm extends Component {

    componentDidMount(){
        this.props.shouldAutoLogin();
    }

    handleSubmit = (e) => {
        let loginForm = this;
        e.preventDefault();
        this.props.form.validateFields((err, values) => {
            if (err) {
                loginForm.props.loginFail(formatMessage({id: "changePwd.password.length.errMsg"}))
                return
            }

            this.login(values)

        });
    };

    login = (params)=>{

        let loginForm = this;

        this.props.login(params,function(errCode){

            loginForm.props.loginFail(formatMessage({id:'login.error.'+errCode}))

        },function () {
            loginForm.props.loginSuccess();
        });
    };

    render() {
        const { getFieldDecorator } = this.props.form;

        return (
            <Spin spinning={this.props.load}>

                <Form>
                    <Form.Item>
                        {getFieldDecorator('username', {
                            rules: [{ required: true, message: formatMessage({id:'login.username.message'})}],
                        })(
                            <Input prefix={<Icon type="user" style={{ color: 'rgba(0,0,0,.25)' }} />}
                                   placeholder={formatMessage({id:'login.username'})} />
                        )}
                    </Form.Item>
                    <Form.Item
                        validateStatus={this.props.loginStatusString}
                        help={this.props.loginErrorString}
                    >
                        {getFieldDecorator('password', {
                            rules: [
                                { required: true, message: formatMessage({id:'login.password.message'}) },
                                {min:6,message: formatMessage({id: "changePwd.password.length.errMsg"})}
                            ],
                        })(
                            <Input prefix={<Icon type="lock" style={{ color: 'rgba(0,0,0,.25)' }} />}
                                   type="password" placeholder={formatMessage({id:'login.password'})} />
                        )}
                    </Form.Item>
                    <Form.Item>
                        <Button type="primary" onClick={this.handleSubmit} className={styles["login-form-button"]}>
                            {formatMessage({id:'login.button.login'})}
                        </Button>
                    </Form.Item>
                </Form>

            </Spin>
        );
    }
}

const WrappedNormalLoginForm = Form.create()(NormalLoginForm);

export default WrappedNormalLoginForm;
