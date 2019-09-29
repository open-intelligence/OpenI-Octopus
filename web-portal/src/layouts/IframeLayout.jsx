import { Component } from 'react';
import { Layout} from 'antd';
import {formatMessage } from 'umi/locale';
import { routerRedux } from 'dva/router';
import DocumentTitle from 'react-document-title';
import { ContainerQuery } from 'react-container-query';
import classNames from 'classnames';

import SiderMenu from '@/components/SiderMenu';
import GlobalHeader from '@/components/GlobalHeader';

import styles from './IframeLayout.less';

import {connect} from 'dva';
const { Header, Footer, Content } = Layout;

function mapStateToProps(state) {
    return {
        ...state.user
    };
}

const namespace = 'user';

const mapDispatchToProps=(dispatch)=>{
    return {
        logout: ()=>{
            dispatch({type:'login/logout'});
        },
        getCurrentUser:()=>{
            dispatch({type:`${namespace}/getCurrentUser`});
        },
        goToChangePwd:()=>{
            dispatch(routerRedux.push({
                pathname: '/openi/change-password'
            }));
        },
        toSetUserInfo:()=>{
            dispatch(routerRedux.push({
                pathname: '/openi/userInfo'
            }));
        },
        updateSiderMenuInfo:()=>{
            dispatch({
                type:'siderMenu/updateSiderMenuInfo',
                payload:{
                    lastMenuKey: '',
                    openSubMenus:['']
                }
            });
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
class BasicLayout extends Component {

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

    componentDidMount(){
        this.props.getCurrentUser();
    }

    render() {

        const layout = (
            <Layout>
                <SiderMenu currentUser={this.props.currentUser} />

                <Layout>
                    <Header className={styles.head}>
                        <GlobalHeader
                            currentUser={this.props.currentUser}
                            onMenuClick={this.onMenuClick}
                        />
                    </Header>

                    <Content>
                        <div className={styles.content}>
                            {this.props.children}
                        </div>
                    </Content>
                    <Footer className={styles.footer}><p>&copy; {formatMessage({id:'platformName'})}</p></Footer>
                </Layout>
            </Layout>
        );

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

export default BasicLayout;
