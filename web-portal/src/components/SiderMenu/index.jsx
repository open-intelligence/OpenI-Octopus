import React from "react";
import { Component } from 'react';
import { Layout, Menu, Icon } from 'antd';
import Link from "umi/link";
import { connect } from 'dva';
import styles from "./index.less";
import logo from "@/assets/img/logo.png";
import { FormattedMessage} from 'umi/locale';

require("./history_hack");

const { Sider } = Layout;
const SubMenu = Menu.SubMenu;

const namespace = 'siderMenu';

function mapStateToProps(state) {
    return {
        ...state.siderMenu
    };
}

const mapDispatchToProps=(dispatch)=>{
    return {
        initSiderMenuInfo: ()=>{
            dispatch({type:`${namespace}/initSiderMenuInfo`});
        },
        updateSiderMenuInfo:(menuInfo)=>{
            dispatch({type:`${namespace}/updateSiderMenuInfo`,payload:menuInfo});
        }
    }
};

@connect(mapStateToProps,mapDispatchToProps)
class SiderMenu extends Component{
    constructor(props){
        super(props);
        const self = this;
        history.listen("href_change",function(){
            self.props.initSiderMenuInfo();
        });
    }

    componentDidMount(){
        this.props.initSiderMenuInfo();
    }

    onMenuSelect=(item)=>{

        let openSubMenu = '';

        if(item.key.indexOf('adminSub')!==-1)
        {
            openSubMenu = 'adminSub';
        }

        this.props.updateSiderMenuInfo({
            lastMenuKey: item.key,
            openSubMenus:[openSubMenu]
        });
    };

    onClickOverView=()=>{
        this.props.updateSiderMenuInfo({
            lastMenuKey: '',
            openSubMenus:['']
        });
    };

    onClickAdminSubMenu=(item)=>{
        this.props.updateSiderMenuInfo({
            openSubMenus:['adminSub']
        });
    };

    render() {

        const {currentUser = {}} = this.props;

        return (

            <Sider breakpoint={'sm'} collapsedWidth={0} width={250}>

                <div className={styles.logo} id="logo">
                    <Link to="/openi/overview" onClick={()=>{this.onClickOverView()}}>
                        <img src={logo} alt="logo" />
                        <h1><FormattedMessage id="platformName" /></h1>
                    </Link>
                </div>

                <Menu theme="dark" mode="inline"
                      openKeys={this.props.openSubMenus}
                      selectedKeys={[this.props.lastMenuKey]}
                      onSelect={(item)=>{this.onMenuSelect(item)}}>

                    <Menu.Item key="1">
                        <Link to="/openi/submit">
                            <Icon type="form" />
                            <span><FormattedMessage id="sidermenu.submitJob" /></span>
                        </Link>
                    </Menu.Item>

                    <Menu.Item key="2">
                        <Link to="/openi/jobs">
                            <Icon type="profile" />
                            <span><FormattedMessage id="sidermenu.jobList" /></span>
                        </Link>
                    </Menu.Item>

                    <Menu.Item key="3">
                        <Link to="/openi/imageset">
                            <Icon type="database" />
                            <span><FormattedMessage id="sidermenu.imageList" /></span>
                        </Link>
                    </Menu.Item>

                    <Menu.Item key="4">
                        <Link to="/openi/dataset">
                            <Icon type="table" />
                            <span><FormattedMessage id="sidermenu.datasetList" /></span>
                        </Link>
                    </Menu.Item>

                    {
                        currentUser&&currentUser.admin?(

                            <SubMenu key="adminSub"
                                     onTitleClick={()=>{this.onClickAdminSubMenu()}}
                                     title={
                                         <span>
                                             <Icon type="setting" />
                                             <span>
                                                 <FormattedMessage id="sidermenu.adminTools" />
                                             </span>
                                         </span>
                                     }
                            >
                                <Menu.Item key="adminSub.3">
                                    <Link to="/openi/admin/dashboard">
                                        <FormattedMessage id="sidermenu.dashboard" />
                                    </Link>
                                </Menu.Item>
                                <Menu.Item key="adminSub.4">
                                    <Link to="/openi/user/register">
                                        <FormattedMessage id="sidermenu.userManager" />
                                    </Link>
                                </Menu.Item>
                            </SubMenu>

                            ):(null)
                    }

                </Menu>
            </Sider>
        );
    }
}

export default SiderMenu;
