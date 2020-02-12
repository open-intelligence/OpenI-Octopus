import React from 'react';
import { formatMessage } from 'umi/locale';
import {Layout,Row,Col } from 'antd';
import styles from './UserLayout.less';
import background from '@/assets/img/background.png';
import DocumentTitle from "react-document-title";

const { Footer, Content } = Layout;

class UserLayout extends React.PureComponent {

    render() {

        const userLayout = (
            <Layout style={{ background: `url(${background}) center no-repeat` }}>
                <Content className={styles.content}>
                    <Row type="flex" justify="center">
                        <Col span={18}>
                            {this.props.children}
                        </Col>
                    </Row>
                </Content>
                <Footer className={styles.footer}>
                    <p>&copy; {formatMessage({id:'platformName'})}</p>
                </Footer>
            </Layout>
        );

        return (
            <DocumentTitle title={formatMessage({id:'platformName'})}>
                {userLayout}
            </DocumentTitle>
        );
    }
}

export default UserLayout;
