import React, {Component} from 'react';
import {render} from 'react-dom';
import {Row,Col} from 'antd';

import RegisterForm from "@/components/RegisterForm";

import styles from './index.less';

import {formatMessage,FormattedMessage} from 'umi/locale';

import openi from '@/assets/img/icon-openi.png';
import pcl from '@/assets/img/icon-pcl.png';

class Register extends Component {
    render(){
        return (
            <Row className={styles.content}>
                <Col span={1}></Col>
                <Col span={22} className={styles["panel-left"]}>
                    <Row type="flex" justify="center" className={styles["row-img-pcl"]}>
                        <Col span={2}></Col>
                        <Col span={10}>
                            <Row type="flex" justify="end">
                                <img src={openi} className={styles["row-img-openi"]} width="120" height="40"/>
                            </Row>
                        </Col>
                        <Col span={10}>
                            <Row type="flex" justify="start">
                                <Col span={2}></Col>
                                <Col span={22}>
                                    <img src={pcl} width="64" height="64"/>
                                </Col>
                            </Row>
                        </Col>
                        <Col span={2}></Col>
                    </Row>

                    <Row type="flex" justify="center" className={styles["row-text-qizhi"]}>
                        <Col span={24}>
                            <h1>{formatMessage({id:'platformName'})}</h1>
                        </Col>
                    </Row>

                    <Row type="flex" justify="center" className={styles["row-context"]}>
                        <Col span={20}>
                            <RegisterForm></RegisterForm>
                        </Col>
                    </Row>

                </Col>
                <Col span={1}></Col>
            </Row>
        );
    }
}

export default Register;
