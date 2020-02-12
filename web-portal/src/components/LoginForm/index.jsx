import React, {Component} from 'react';
import {Form, Icon, Input, Button,message,Spin} from 'antd';

import {formatMessage } from 'umi/locale';
import styles from './index.less';

import {connect} from 'dva';

const namespace = 'login';

function mapStateToProps(state) {
    return {
        ...state.login
    };
}
const mapDispatchToProps=(dispatch)=>{
    return {
        login: (params,onFailed)=>{
            dispatch({type:`${namespace}/login`,payload:{params:params,onFailed:onFailed}});
        },
        shouldAutoLogin:()=>{
            dispatch({type:`${namespace}/shouldAutoLogin`});
        }
    }
};

@connect(mapStateToProps,mapDispatchToProps)
class NormalLoginForm extends Component {

    componentDidMount(){
        this.props.shouldAutoLogin();
    }

    handleSubmit = (e) => {
        e.preventDefault();
        this.props.form.validateFields((err, values) => {
            if (!err) {
                this.login(values)
            }
        });
    };

    login = (params)=>{
        this.props.login(params,function(){
            message.error(formatMessage({id:'login.error.failed'}))
        });
    }

    render() {
        const { getFieldDecorator } = this.props.form;

        return (
            <Spin spinning={this.props.load}>
                <Form onSubmit={this.handleSubmit}>
                    <Form.Item>
                        {getFieldDecorator('username', {
                            rules: [{ required: true, message: formatMessage({id:'login.username.message'})}],
                        })(
                            <Input prefix={<Icon type="user" style={{ color: 'rgba(0,0,0,.25)' }} />}
                                   placeholder={formatMessage({id:'login.username'})} />
                        )}
                    </Form.Item>
                    <Form.Item>
                        {getFieldDecorator('password', {
                            rules: [{ required: true, message: formatMessage({id:'login.password.message'}) }],
                        })(
                            <Input prefix={<Icon type="lock" style={{ color: 'rgba(0,0,0,.25)' }} />}
                                   type="password" placeholder={formatMessage({id:'login.password'})} />
                        )}
                    </Form.Item>

                    <Form.Item>
                        <Button type="primary" htmlType="submit" className={styles["login-form-button"]}>
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
