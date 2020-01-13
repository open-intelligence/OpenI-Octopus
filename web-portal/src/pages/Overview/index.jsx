import {Component} from "react";
import {Row,Col,Avatar,message,Steps,Button} from 'antd';
import styles from './index.less';
import {connect} from 'dva';
import {formatMessage } from 'umi/locale';

import { routerRedux } from 'dva/router';

import taskWaitImg from "@/assets/img/jobs/icon-wait.png";
import taskDoingImg from "@/assets/img/jobs/icon-doing.png";
import taskPauseImg from "@/assets/img/jobs/icon-pause.png";
import taskEndImg from "@/assets/img/jobs/icon-end.png";
import classNames from 'classnames';

const {Step} = Steps;

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
        goToSubmitJob: ()=>{
            dispatch(routerRedux.push({
                pathname: '/openi/v2/brain/submitJob'
            }));
        },
        goToJobList: ()=>{
            dispatch(routerRedux.push({
                pathname: '/openi/v2/brain/jobList'
            }));
        },
        goToDataSetList: ()=>{
            dispatch(routerRedux.push({
                pathname: '/openi/v2/brain/datasetList'
            }));
        }
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

        let iconActiveData = classNames(styles.homeIcon,styles.iconProcessSize,styles.iconActiveData);
        let iconActiveModel = classNames(styles.homeIcon,styles.iconProcessSize,styles.iconActiveModel);

        let iconActiveDeploy = classNames(styles.homeIcon,styles.iconProcessSize,styles.iconActiveDeploy);

        let titleText = classNames(styles.font18,styles.color333);

        return (

            <div className={contentClass}>
                <Row>
                    <Col span={24}>
                        <div className={titleText}>{formatMessage({id:"overview.setup"})}</div>
                    </Col>
                </Row>
                <Row>
                    <Col span={24}>
                        <br />
                        <Steps current={1}>

                            <Step status="finish" title={formatMessage({id:"siderContentMenu.submitJob"})} description={formatMessage({id:"overview.submitJob.desc"})}
                                  icon={<div className={iconActiveData}></div>}
                            />

                            <Step status="finish" title={formatMessage({id:"siderContentMenu.jobList"})} description={formatMessage({id:"overview.jobList.desc"})}
                                  icon={<div className={iconActiveModel}></div>}
                            />
                            <Step status="finish" title={formatMessage({id:"siderContentMenu.datasetList"})} description={formatMessage({id:"overview.datasetList.desc"})}
                                  icon={<div className={iconActiveDeploy}></div>}
                            />
                        </Steps>
                    </Col>
                </Row>

                <br/>

                <Row>
                    <Col span={5}>
                        <div>
                        <Button type="primary" ghost onClick={this.props.goToSubmitJob}>
                            {formatMessage({id:"siderContentMenu.submitJob"})}
                        </Button>
                        </div>
                    </Col>

                    <Col span={14}>
                        <div className={styles.center}>
                        <Button type="primary" ghost onClick={this.props.goToJobList}>
                            {formatMessage({id:"siderContentMenu.jobList"})}
                        </Button>
                        </div>
                    </Col>

                    <Col span={5}>
                        <div className={styles.center}>
                        <Button type="primary" ghost onClick={this.props.goToDataSetList}>
                            {formatMessage({id:"overview.btn.datasetList"})}
                        </Button>
                        </div>
                    </Col>
                </Row>


                <Row>
                    <br />
                    <br />
                    <Col span={24}>
                        <div className={titleText}>{formatMessage({id:"overview.resources"})}</div>
                    </Col>
                </Row>

                <Row>
                    <br />
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
