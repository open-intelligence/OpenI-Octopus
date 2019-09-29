import React, {Component} from 'react';
import {render} from 'react-dom';
import {Row,Col,Icon} from 'antd';
import openi from '@/assets/img/icon-openi.png';
import pcl from '@/assets/img/icon-pcl.png';
import row1Icon from '@/assets/img/icon-docker.png';
import row2Icon from '@/assets/img/icon-display.png';
import row3Icon from '@/assets/img/icon-distribute.png';

import styles from './index.less';

import {formatMessage,FormattedMessage} from 'umi/locale';

class OpenIPanel extends Component {

    render(){

        const row2DecP={
            "paddingInlineStart": '15px'
        };

        return (
            <Row className={styles.content}>
                <Col span={12} className={styles["panel-left"]}>
                    <Row type="flex" justify="center" className={styles["row-img-pcl"]}>
                        <Col offset={1} span={11}>
                            <Row type="flex" justify="end">
                                <img src={openi} className={styles["row-img-openi"]} width="120" height="40"/>
                            </Row>
                        </Col>
                        <Col span={1}/>
                        <Col span={9}>
                            <Row type="flex" justify="start">
                                <img src={pcl} width="64" height="64"/>
                            </Row>
                        </Col>
                    </Row>

                    <Row type="flex" justify="center" className={styles["row-text-qizhi"]}>
                        <Col span={24}>
                            <h1>{formatMessage({id:'platformName'})}</h1>
                        </Col>
                    </Row>

                    <Row type="flex" justify="center" className={styles["row-context"]}>
                        <Col span={20}>
                            {this.props.children}
                        </Col>
                    </Row>

                </Col>
                <Col span={12} className={styles["panel-right"]}>
                    <Row className={styles.decRow} >
                        <Col span={4}>
                            <Row type="flex" justify="center">
                                <img className={styles["dec-icon"]} src={row1Icon} />
                            </Row>
                        </Col>
                        <Col span={20}>
                            <p className={styles["dec-topic"]}>
                                <FormattedMessage id="openIPanel.topic.docker" />
                            </p>
                            <p className={styles["dec-p"]}>
                                <FormattedMessage id="openIPanel.paragraph.docker" />
                            </p>
                        </Col>
                    </Row>
                    <Row className={styles.decRow} >
                        <Col span={4}>
                            <Row type="flex" justify="center">
                                <img className={styles["dec-icon"]} src={row2Icon} />
                            </Row>
                        </Col>
                        <Col span={20}>
                            <p className={styles["dec-topic"]}>
                                <FormattedMessage id="openIPanel.topic.display" />
                            </p>
                            <ul className={styles["dec-p"]} style={row2DecP}>
                                <li><FormattedMessage id="openIPanel.paragraph.display.1" /></li>
                                <li><FormattedMessage id="openIPanel.paragraph.display.2" /></li>
                                <li><FormattedMessage id="openIPanel.paragraph.display.3" /></li>
                            </ul>
                        </Col>
                    </Row>

                    <Row className={styles.decRow} >
                        <Col span={4}>
                            <Row type="flex" justify="center">
                                <img className={styles["dec-icon"]} src={row3Icon} />
                            </Row>
                        </Col>
                        <Col span={20}>
                            <p className={styles["dec-topic"]}>
                                <FormattedMessage id="openIPanel.topic.distribute" />
                            </p>
                            <p className={styles["dec-p"]}>
                                <FormattedMessage id="openIPanel.paragraph.distribute" />
                            </p>
                        </Col>
                    </Row>

                </Col>
            </Row>
        );
    }
}

export default OpenIPanel;
