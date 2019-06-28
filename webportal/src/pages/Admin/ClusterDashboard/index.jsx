import { Component } from 'react';
import styles from './index.less';

class ClusterDashboard extends Component{

    componentDidMount(){
        var oIframe = document.getElementById("iframe-cluster");
        var oBody = document.getElementsByClassName("ant-layout-content")[0];
        oIframe.style.height = oBody.offsetHeight - 5 + 'px';
    }

    render(){
        return (
            <iframe
                id={"iframe-cluster"}
                className={styles.clusterDashboard}
                src={`${__WEBPORTAL__.grafanaUri}/d/ft1oaQnWk/clustermetrics?orgId=1&from=now-5m&to=now&var-Node=All`}
                frameBorder="0"
            />
        )
    }

}

export default ClusterDashboard;


