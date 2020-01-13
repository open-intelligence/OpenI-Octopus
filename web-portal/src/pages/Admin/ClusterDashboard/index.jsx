import { Component } from 'react';
import styles from './index.less';

class ClusterDashboard extends Component{

    constructor() {
        super();
        this.state = {
            iFrameHeight: '0px'
        }
    }

    componentDidMount(){
        var parent = window.parent.document.documentElement;

        var scrollHeight = parent.scrollHeight;

        //console.log("scrollHeight:",scrollHeight);

        this.setState({
            "iFrameHeight":  scrollHeight + 'px'
        });
    }

    render(){
        return (
            <iframe
                id={"iframe-cluster"}
                className={styles.clusterDashboard}
                src={`${__WEBPORTAL__.grafanaUri}/d/ft1oaQnWk/clustermetrics?orgId=1&refresh=10s&from=now-5m&to=now&var-Node=All`}
                frameBorder="0"
                scrolling="no"
                height={this.state.iFrameHeight}
            />
        )
    }

}

export default ClusterDashboard;


