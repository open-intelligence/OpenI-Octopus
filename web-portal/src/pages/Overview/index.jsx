import {Component} from "react";
import {Row,Col,Avatar,message} from 'antd';
import styles from './index.less';
import {connect} from 'dva';
import {formatMessage } from 'umi/locale';

import taskWaitImg from "@/assets/img/jobs/icon-wait.png";
import taskDoingImg from "@/assets/img/jobs/icon-doing.png";
import taskPauseImg from "@/assets/img/jobs/icon-pause.png";
import taskEndImg from "@/assets/img/jobs/icon-end.png";
import classNames from 'classnames';


const namespace='overview';

function mapStateToProps(state) {
    return {
        jobOverview: state.overview,
    };
}


const mapDispatchToProps=(dispatch)=>{
    return {
        loadJobsSummary: (onFailed)=>{
            dispatch({type:`${namespace}/loadJobsSummary`,payload:{onFailed:onFailed}});
        },
    }
};

@connect(mapStateToProps,mapDispatchToProps)
class Overview extends Component {

    componentDidMount(){
        this.props.loadJobsSummary(function(){
            message.error(formatMessage({id:'overview.fetch.failed'}))
        });
    }

    render() {
        let contentClass = classNames(styles.pageContent,styles.content);
        let taskWaitClass = classNames(styles.taskCard,styles.taskWait);
        let taskDoingClass = classNames(styles.taskCard,styles.taskDoing);
        let taskStopClass = classNames(styles.taskCard);
        let taskEndClass = classNames(styles.taskCard,styles.taskEnd);

        return (
            <div className={contentClass}>
                <Row>
                    <Col className={taskWaitClass} span={11} id="waitJob">
                        <Row className={styles.iconRow}>
                            <Col span={20}>
                                <Avatar shape="square" className={styles.icon} src={taskWaitImg} />
                            </Col>
                            <Col span={4}>
                                <span className={styles.num} id="waitCount">{this.props.jobOverview.waitCount}</span>
                            </Col>
                        </Row>
                        <Row>
                            <Col className={styles.text} span={24}>
                                <span>{formatMessage({id:"overview.waiting"})}</span>
                            </Col>
                        </Row>
                    </Col>
                    <Col className={taskDoingClass} span={11} offset={1} id="runJob">
                        <Row className={styles.iconRow}>
                            <Col span={20}>
                                <Avatar shape="square" className={styles.icon} src={taskDoingImg} />
                            </Col>
                            <Col span={4}>
                                <span className={styles.num} id="runCount">{this.props.jobOverview.runCount}</span>
                            </Col>
                        </Row>
                        <Row>
                            <Col className={styles.text} span={24}>
                                <span>{formatMessage({id:"overview.running"})}</span>
                            </Col>
                        </Row>
                    </Col>
                </Row>
                <Row className={styles.taskCardRow}>
                    <Col className={taskStopClass} span={11} id="stopJob">
                        <Row className={styles.iconRow}>
                            <Col span={20}>
                                <Avatar shape="square" className={styles.icon} src={taskPauseImg} />
                            </Col>
                            <Col span={4}>
                                <span className={styles.num} id="stopCount">{this.props.jobOverview.stopCount}</span>
                            </Col>
                        </Row>
                        <Row>
                            <Col className={styles.text} span={24}>
                                <span>{formatMessage({id:"overview.terminated"})}</span>
                            </Col>
                        </Row>
                    </Col>
                    <Col className={taskEndClass} span={11} offset={1} id="endJob">
                        <Row className={styles.iconRow}>
                            <Col span={20}>
                                <Avatar shape="square" className={styles.icon} src={taskEndImg} />
                            </Col>
                            <Col span={4}>
                                <span className={styles.num} id="endCount">{this.props.jobOverview.successCount}</span>
                            </Col>
                        </Row>
                        <Row>
                            <Col className={styles.text} span={24}>
                                <span>{formatMessage({id:"overview.completed"})}</span>
                            </Col>
                        </Row>
                    </Col>
                </Row>
            </div>
        );
    }
}

export default Overview;
