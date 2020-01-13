import { Component } from 'react';
import { Layout,Menu,Row,Col,Avatar,Icon,Button,Dropdown,Modal,notification} from 'antd';

import { setAuthority,getAuthority } from '@/utils/authority';
import Tucao from '@/utils/tucao'
import LoginForm from "@/components/LoginForm";
import ExpressWay from "@/components/ExpressWay";
import logo from "@/assets/img/logo.png";

import openi from '@/assets/img/icon-openi.png';
import pcl from '@/assets/img/icon-pcl.png'

import { FormattedMessage,formatMessage, setLocale, getLocale } from 'umi/locale';

import DocumentTitle from 'react-document-title';
import { ContainerQuery } from 'react-container-query';
import classNames from 'classnames';

import styles from './GlobalLayout.less';

import {connect} from 'dva';
import Link from "umi/link";
import React from "react";
import * as routerRedux from "react-router-redux";
const { Header, Content } = Layout;

require("@/utils/history_hack");

function mapStateToProps(state) {
    return {
        ...state.globalLayout,
        ...state.login
    };
}

const mapDispatchToProps=(dispatch)=>{
    return {
        logout: ()=>{
            dispatch({type:'login/logout'});
        },
        getCurrentUser:()=>{
            dispatch({type:`login/getCurrentUser`});
        },
        goToChangePwd:()=>{

            dispatch({
                type:'globalLayout/goToChangePwd'
            });
        },
        toSetUserInfo:()=>{
            dispatch({
                type:'globalLayout/toSetUserInfo'
            });
        },
        updateMenuInfo:()=>{
            dispatch({
                type:'globalLayout/updateMenuInfo'
            });
        },
        showLoginModel:() => {
            dispatch({type:`login/showLoginModel`});
        },
        closeLoginModel:() =>{
            dispatch({type:`login/closeLoginModel`});
        },
        goToPage:(path)=>{
            dispatch(routerRedux.push({
                pathname: path
            }));
        }
    }
};

const query = {
    'screen-xs': {
        maxWidth: 575,
    },
    'screen-sm': {
        minWidth: 576,
        maxWidth: 767,
    },
    'screen-md': {
        minWidth: 768,
        maxWidth: 991,
    },
    'screen-lg': {
        minWidth: 992,
        maxWidth: 1199,
    },
    'screen-xl': {
        minWidth: 1200,
        maxWidth: 1599,
    },
    'screen-xxl': {
        minWidth: 1600,
    },
};


@connect(mapStateToProps,mapDispatchToProps)
class GlobalLayout extends Component {

    constructor(props){
        super(props);
        const self = this;
        history.listen("href_change",function(){
            //check menu right

            self.props.updateMenuInfo();
        });
    }

    globalMenus = {
        "home": "/openi/v2/home",
        "cloudbrain": "/openi/v2/brain/overview",
        "ascend": "/openi/v2/ascend",
        "admin": "/openi/v2/brain/monitor",
        "helper": ""
    };

    /*
    onMenuSelect = (params)=>{

        switch (params.key) {
            case 'cloudbrain':
                this.props.updateMenuInfo();
                break;
            case 'admin':
                this.props.updateMenuInfo();
                break;
            default:
                return
        }
    };*/

    onMenuClick = ({ item, key, keyPath, domEvent }) => {
        //检查是否要登录
        const currentLoginStatus = getAuthority();
        let shouldLogin =currentLoginStatus?!currentLoginStatus.status:true;
        if(key!=='home' && shouldLogin)
        {
            notification['info']({
                message: formatMessage({id:'globalLayout.login.tip'}),
                description: '',
            });

            this.props.showLoginModel();
            return;
        }else{
            //gotoPages
            if('helper'=== key){
                let data = {
                    // nickname,avatar,openid 必填
                    "nickname": currentLoginStatus.realName || currentLoginStatus.username,
                    "avatar": "https://tucao.qq.com/static/desktop/img/products/def-product-logo.png",
                    "openid": currentLoginStatus.userId,
                    // 自定义字段，长度为 256
                    "customInfo":''
                  },
                  productId = __WEBPORTAL__.tucao.productId;
                data = Object.assign(data,Tucao.getBowerInfo());
                Tucao.request(productId, data);
                return;
            }
            this.props.goToPage(this.globalMenus[key]);
        }
    };

    onAccountMenuClick = (params)=>{
        switch (params.key) {
            case 'logout':
                this.props.logout();
                break;
            case 'changePwd':
                this.props.goToChangePwd();
                break;
            case 'setUserInfo':
                this.props.toSetUserInfo();
                break;
            default:
                return
        }
    };


    changLang() {
        const locale = getLocale();
        if (!locale || locale === 'zh-CN') {
            setLocale('en-US');
        } else {
            setLocale('zh-CN');
        }
    }

    handleCancel = e => {
        console.log(e);
        this.props.closeLoginModel();
    };

    componentDidMount(){
        this.props.getCurrentUser();
    }

    render() {
        const currentLoginStatus = getAuthority();
        let shouldLogin =currentLoginStatus?!currentLoginStatus.status:true;
        const menu = (
            <Menu className={styles.menu} selectedKeys={[]} onClick={this.onAccountMenuClick}>
                <Menu.Item key="setUserInfo">
                    <Icon type="edit" />
                    <FormattedMessage id="globalHeader.setUserInfo" />
                </Menu.Item>
                <Menu.Item key="changePwd">
                    <Icon type="edit" />
                    <FormattedMessage id="globalHeader.changePwd" />
                </Menu.Item>
                <Menu.Divider />
                <Menu.Item key="logout">
                    <Icon type="logout" />
                    <FormattedMessage id="globalHeader.logout" />
                </Menu.Item>
            </Menu>
        );


        const layout = (
            <Layout className="layout">
                <Header className={styles.head}>
                    <Row>
                        <Col span={4}>
                            <div className={styles.logo} id="logo">
                                <Avatar size={35} src={logo} />
                                <span style={{ marginLeft: '10px' }}><FormattedMessage id="platformName" /></span>
                            </div>
                        </Col>
                        <Col span={14}>
                            <div>
                                <Menu
                                    theme={"dark"}
                                    mode="horizontal"
                                    style={{ lineHeight: '64px' }}
                                    selectedKeys={[this.props.globalMenuKey]}
                                    onClick={this.onMenuClick}
                                >

                                    {
                                        Object.keys(this.globalMenus).map(menuKey => {
                                            let shouldRender = true;

                                            if(menuKey === 'admin' && this.props.admin === false){
                                                shouldRender = false;
                                            }

                                            if(shouldRender){
                                                return (
                                                    <Menu.Item key={menuKey}>
                                                        <Link to='#'>
                                                            <span><FormattedMessage id={"globalLayout."+menuKey} /></span>
                                                        </Link>
                                                    </Menu.Item>
                                                )
                                            }

                                        })
                                    }
                                </Menu>
                            </div>
                        </Col>
                        <Col span={6}>

                            <div className={styles.right}>
                                {this.props.status ? (
                                <Dropdown overlay={menu}>
                                  <span className={`${styles.action} ${styles.account}`}>
                                    <Avatar size="small" className={styles.avatar} icon="user" />
                                    <span>{this.props.username}</span>
                                  </span>
                                </Dropdown>):(

                                    <Button
                                    onClick={() => {
                                        this.props.showLoginModel()
                                    }}
                                    >
                                        <span>登录</span>
                                    </Button>
                                )}
                            </div>


                            <Modal
                                title={null}
                                visible={this.props.visiableLoginModel}
                                onCancel={this.handleCancel}
                                footer={null}
                            >
                                <Row>
                                    <Col span={24}>
                                        <Row type="flex" justify="center">
                                            <Col span={16}>
                                                <div className={styles.center}>
                                                    <img src={openi} className={styles.marginRight10} width="120" height="40"/>
                                                    <img src={pcl} width="64" height="64"/>
                                                </div>
                                            </Col>
                                        </Row>

                                        <Row type="flex" justify="center">
                                            <Col span={16}>
                                                <div className={styles.center}>
                                                    <h1>{formatMessage({id:'platformName'})}</h1>
                                                </div>
                                            </Col>
                                        </Row>
                                        <Row type="flex" justify="center">
                                            <Col span={16}>
                                                <LoginForm />
                                            </Col>
                                        </Row>

                                    </Col>
                                </Row>
                            </Modal>


                        </Col>
                    </Row>

                </Header>
                <Layout className={styles.content}>
                    <Content >
                        {this.props.children}
                    </Content>
                </Layout>
                <ExpressWay show={!shouldLogin}></ExpressWay>
            </Layout>
        );

        if(this.props.shouldLoginByPath){

            notification['info']({
                message: formatMessage({id:'globalLayout.login.tip'}),
                description: '',
            });

            this.props.goToPage('/openi/v2/home');

            return (<div></div>);
        }else{

            return (
                <DocumentTitle title={formatMessage({id:'platformName'})}>
                    <ContainerQuery query={query}>
                        {params => (
                            <div className={classNames(params)}>{layout}</div>
                        )}
                    </ContainerQuery>
                </DocumentTitle>
            )
        }

    }
}

export default GlobalLayout;
