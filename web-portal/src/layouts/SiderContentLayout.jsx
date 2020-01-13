import { Component } from 'react';
import { Layout,Menu,Button,Drawer} from 'antd';

import {formatMessage,FormattedMessage } from 'umi/locale';
import ExpressWay from "@/components/ExpressWay";
import styles from './SiderContentLayout.less';

import {connect} from 'dva';
import Link from "umi/link";
import React from "react";
const { Sider, Footer, Content } = Layout;

function mapStateToProps(state) {
    return {
        ...state.globalLayout
    };
}


const mapDispatchToProps=(dispatch)=>{
    return {
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
class SiderContentLayout extends Component {

    /*
    onMenuClick = (params)=>{
        switch (params.key) {
            case 'logout':
                this.props.logout();
                break;
            case 'changePwd':
                this.props.updateSiderMenuInfo();
                this.props.goToChangePwd();
                break;
            case 'setUserInfo':
                this.props.updateSiderMenuInfo();
                this.props.toSetUserInfo();
                break;
            default:
                return
        }
    };
    */

    componentDidMount(){
        //this.props.getCurrentUser();
    }



    render() {

        const layout = (
            <Layout className={styles.content}>
                <Sider width={180}>
                    <Menu
                        theme="light"
                        mode="inline"
                        style={{ height: '100%'}}
                        selectedKeys={[this.props.siderMenuKey]}
                    >
                        {
                            Object.keys(this.props.menuKeyMap).map(menuKey => (
                                <Menu.Item key={menuKey}>
                                    <Link to={this.props.menuKeyMap[menuKey]}>
                                        <span><FormattedMessage id={"siderContentMenu."+menuKey} /></span>
                                    </Link>
                                </Menu.Item>
                            ))
                        }
                    </Menu>
                </Sider>

                <Layout>
                    <Content>
                        <div className={styles.sidercontent}>
                            {this.props.children}
                        </div>
                    </Content>

                    <Footer className={styles.footer}><p>&copy; {formatMessage({id:'platformName'})}</p></Footer>
                    {/*<ExpressWay></ExpressWay>*/}
                </Layout>
            </Layout>
        );

        return (
            layout
        )
    }
}

export default SiderContentLayout;
