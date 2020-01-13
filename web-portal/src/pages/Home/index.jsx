import {Component} from "react";
import {Layout,Carousel,Row,Col,Typography,Steps,Button,Divider,Icon} from 'antd';
import styles from './index.less';
import {connect} from 'dva';
import {formatMessage } from 'umi/locale';
import classNames from "classnames";
import dockerbanner from "@/assets/img/dockerbanner.jpg";
import interfacebanner from "@/assets/img/interfacebanner.jpg";
import trainbanner from "@/assets/img/trainbanner.jpg";

import React from "react";

const {Step} = Steps;

const { Footer, Content } = Layout;

const { Text } = Typography;

const namespace='home';

function mapStateToProps(state) {
    return {

        home: state.home,

    };
}


const mapDispatchToProps=(dispatch)=>{
    return {
        goToPage: (pagePath)=>{
            dispatch({type:`${namespace}/goToPage`,payload:{pagePath}});
        },
    }
};

@connect(mapStateToProps,mapDispatchToProps)
class Home extends Component {
    dividerNums = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18];

    componentDidMount(){

    }

    onClickGoToCloudBrainPage = () => {
        this.props.goToPage("/openi/v2/brain/overview");
    };

    onClickGoToAscendPage = () => {
        this.props.goToPage("/openi/v2/ascend");
    };

    render() {

        let iconActiveData = classNames(styles.icon,styles.iconProcessSize,styles.iconActiveData);
        let iconActiveDev = classNames(styles.icon,styles.iconProcessSize,styles.iconActiveDev);
        let iconActiveTrain = classNames(styles.icon,styles.iconProcessSize,styles.iconActiveTrain);

        let iconInActiveModel = classNames(styles.icon,styles.iconProcessSize,styles.iconInActiveModel);
        let iconInActiveDeploy = classNames(styles.icon,styles.iconProcessSize,styles.iconInActiveDeploy);

        let iconDecTitle = classNames(styles.icon,styles.iconDecTitleSize,styles.iconDecTitle);

        let iconGPUInfo = classNames(styles.icon,styles.iconGPUInfoSize,styles.iconGPUInfo);

        let iconAscendProcessInfo = classNames(styles.icon,styles.iconAscendInfoSize,styles.iconAscendProcessInfo);
        let iconAscendDistributeInfo = classNames(styles.icon,styles.iconAscendInfoSize,styles.iconAscendDistributeInfo);

        let iconAiTensorflow = classNames(styles.iconAi,styles.iconAiTensorflowSize,styles.iconAiTensorflow);
        let iconAiPytorch = classNames(styles.iconAi,styles.iconAiPytorchSize,styles.iconAiPytorch);
        let iconAiPaddle = classNames(styles.iconAi,styles.iconAiPaddleSize,styles.iconAiPaddle);
        let iconAiOnnx = classNames(styles.iconAi,styles.iconAiOnnxSize,styles.iconAiOnnx);
        let iconAiMxnet = classNames(styles.iconAi,styles.iconAiMxnetSize,styles.iconAiMxnet);
        let iconAiCafe2 = classNames(styles.iconAi,styles.iconAiCafe2Size,styles.iconAiCafe2);
        let iconAiCafe = classNames(styles.iconAi,styles.iconAiCafeSize,styles.iconAiCafe);
        let iconAiCntk = classNames(styles.iconAi,styles.iconAiCntkSize,styles.iconAiCntk);
        let iconAiMindSpore = classNames(styles.iconAi,styles.iconAiMindSporeSize,styles.iconAiMindSpore);

        return (

            <Layout>
                <Content>

                    <div>
                        <Row>
                            <Col span={24}>
                                <Carousel autoplay>
                                    <div>
                                        <img src={dockerbanner} width="100%" key="1" />
                                    </div>
                                    <div>
                                        <img src={interfacebanner} width="100%" key="2" />
                                    </div>
                                    <div>
                                        <img src={trainbanner} width="100%" key="3" />
                                    </div>
                                </Carousel>
                            </Col>
                        </Row>

                        <Row>
                            <Col span={24}>
                                <br />
                                <div className={styles.center}>
                                    <h2>{formatMessage({id:'home.pcl.what.can.do'})}</h2>
                                    <Text type="secondary">{formatMessage({id:'home.pcl.can.do'})}</Text>
                                </div>
                            </Col>
                        </Row>

                        <Row>
                            <Col span={1}></Col>
                            <Col span={22}>
                                <br />
                                <Steps current={1}>
                                    <Step status="finish" title={formatMessage({id:'home.pcl.func.dataManager.title'})} description={formatMessage({id:'home.pcl.func.dataManager.description'})}
                                          icon={<div className={iconActiveData}></div>}
                                    />
                                    <Step status="finish" title={formatMessage({id:'home.pcl.func.development.title'})} description={formatMessage({id:'home.pcl.func.development.description'})}
                                          icon={<div className={iconActiveDev}></div>}
                                    />
                                    <Step status="finish" title={formatMessage({id:'home.pcl.func.training.title'})} description={formatMessage({id:'home.pcl.func.training.description'})}
                                          icon={<div className={iconActiveTrain}></div>}
                                    />
                                    <Step status="wait" title={formatMessage({id:'home.pcl.func.modelManager.title'})} description={formatMessage({id:'home.pcl.func.modelManager.description'})}
                                          icon={<div className={iconInActiveModel}></div>}
                                    />
                                    <Step status="wait" title={formatMessage({id:'home.pcl.func.deployment.title'})} description={formatMessage({id:'home.pcl.func.deployment.description'})}
                                          icon={<div className={iconInActiveDeploy}></div>}
                                    />
                                </Steps>
                            </Col>
                            <Col span={1}></Col>
                        </Row>

                        <Row>
                            <Col span={24}>
                                <br />
                                <div className={styles.center}>
                                    <h2>{formatMessage({id:'home.pcl.used.chips'})}</h2>
                                </div>
                            </Col>
                        </Row>

                        <Row type="flex" justify="center">
                            <Col span={1}></Col>
                            <Col span={22}>
                                <br />
                                <br />
                                <Row>
                                    <Col span={11}>
                                        <Row>
                                            <Col span={6}>
                                                <div className={iconDecTitle}>
                                                    <p className={styles.textDecTitle}> {formatMessage({id:'home.what.is.gpu'})} </p>
                                                </div>
                                            </Col>
                                            <Col span={12}>

                                            </Col>
                                            <Col span={6}>
                                                <Button type="primary" ghost onClick={this.onClickGoToCloudBrainPage}>
                                                    {formatMessage({id:'home.go.to.console'})}
                                                    <Icon type="right" />
                                                </Button>
                                            </Col>
                                        </Row>
                                        <Row>
                                            <Col span={24} >
                                                <h2>{formatMessage({id:'home.what.is.gpu.question'})}</h2>
                                                <Text type="secondary">{formatMessage({id:'home.what.is.gpu.answer'})}</Text>
                                                <div className={iconGPUInfo}>

                                                </div>
                                            </Col>
                                        </Row>
                                    </Col>

                                    <Col span={2}>
                                        <Row type="flex" justify="center">
                                            <Col span={1}>
                                                <div className={styles.center}>
                                                    {
                                                        this.dividerNums.map((item,index)=>
                                                            (<Divider type="vertical" key={""+index}/>)
                                                        )
                                                    }
                                                </div>
                                            </Col>
                                        </Row>
                                    </Col>

                                    <Col span={11}>
                                        <Row>
                                            <Col span={6}>
                                                <div className={iconDecTitle}>
                                                    <p className={styles.textDecTitle}> {formatMessage({id:'home.what.is.ascend'})} </p>
                                                </div>
                                            </Col>
                                            <Col span={12}>

                                            </Col>
                                            <Col span={6}>
                                                <Button type="primary" ghost onClick={this.onClickGoToAscendPage}>
                                                    {formatMessage({id:'home.go.to.console'})}
                                                    <Icon type="right" />
                                                </Button>
                                            </Col>
                                        </Row>
                                        <Row>
                                            <Col span={24} >
                                                <Row>
                                                    <Col span={24}>
                                                        <h2>{formatMessage({id:'home.what.is.ascend.question'})}</h2>
                                                        <Text type="secondary">
                                                            {formatMessage({id:'home.what.is.ascend.answer'})}
                                                        </Text>
                                                    </Col>
                                                </Row>

                                                <Row>
                                                    <Col span={11}>
                                                        <div className={iconAscendProcessInfo}>

                                                        </div>
                                                        <Text type="secondary">
                                                            {formatMessage({id:'home.what.is.ascend.for.processing.density'})}
                                                        </Text>
                                                    </Col>
                                                    <Col span={2}>
                                                    </Col>
                                                    <Col span={11}>
                                                        <div className={iconAscendDistributeInfo}>

                                                        </div>
                                                        <Text type="secondary">
                                                            {formatMessage({id:'home.what.is.ascend.for.processing.distributed'})}
                                                        </Text>
                                                    </Col>
                                                </Row>

                                            </Col>
                                        </Row>
                                    </Col>
                                </Row>
                            </Col>
                            <Col span={1}></Col>
                        </Row>


                        <Row type="flex" justify="center">
                            <Col span={24}>
                                <br />
                                <br />
                                <br />
                                <div className={styles.center}>
                                    <h2>{formatMessage({id:'home.pcl.ai.engines'})}</h2>
                                </div>
                            </Col>
                        </Row>


                        <Row>
                            <Col span={1}></Col>
                            <Col span={7}>

                                <div className={styles.center}>
                                    <div className={styles.iconAiBanner}>
                                        <Icon className={iconAiTensorflow} />
                                    </div>
                                </div>

                            </Col>
                            <Col span={1}></Col>
                            <Col span={7}>

                                <div className={styles.center}>
                                    <div className={styles.iconAiBanner}>
                                        <Icon className={iconAiPytorch} />
                                    </div>
                                </div>

                            </Col>
                            <Col span={1}></Col>
                            <Col span={6}>

                                <div className={styles.center}>
                                    <div className={styles.iconAiBanner}>
                                        <Icon className={iconAiPaddle} />
                                    </div>
                                </div>

                            </Col>
                            <Col span={1}></Col>
                        </Row>
                        <br />
                        <Row>

                            <Col span={1}></Col>

                            <Col span={7}>
                                <div className={styles.center}>
                                    <div className={styles.iconAiBanner}>
                                        <Icon className={iconAiOnnx} />
                                    </div>
                                </div>
                            </Col>
                            <Col span={1}></Col>
                            <Col span={7}>

                                <div className={styles.center}>
                                    <div className={styles.iconAiBanner}>
                                        <Icon className={iconAiMindSpore} />
                                    </div>
                                </div>

                            </Col>
                            <Col span={1}></Col>
                            <Col span={6}>

                                <div className={styles.center}>
                                    <div className={styles.iconAiBanner}>
                                        <Icon className={iconAiMxnet} />
                                    </div>
                                </div>
                            </Col>
                            <Col span={1}></Col>
                        </Row>
                        <br />
                        <Row>
                            <Col span={1}></Col>
                            <Col span={7}>

                                <div className={styles.center}>
                                    <div className={styles.iconAiBanner}>
                                        <Icon className={iconAiCntk} />
                                    </div>
                                </div>

                            </Col>
                            <Col span={1}></Col>
                            <Col span={7}>

                                <div className={styles.center}>
                                    <div className={styles.iconAiBanner}>
                                        <Icon className={iconAiCafe2} />
                                    </div>
                                </div>

                            </Col>
                            <Col span={1}></Col>
                            <Col span={6}>

                                <div className={styles.center}>
                                    <div className={styles.iconAiBanner}>
                                        <Icon className={iconAiCafe} />
                                    </div>
                                </div>
                            </Col>
                            <Col span={1}></Col>
                        </Row>
                    </div>
                </Content>
                <Footer className={styles.footer}><p>&copy; {formatMessage({id:'platformName'})}</p></Footer>
            </Layout>

        );
    }
}

export default Home;
