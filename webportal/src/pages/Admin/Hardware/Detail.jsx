import { Component } from 'react';
import { connect } from 'dva';
import styles from './Detail.less';

const namespace = 'hardwareDetail';

function mapStateToProps(state) {
    return {
        ...state.hardwareDetail
    };
}
const mapDispatchToProps=(dispatch)=>{
    return {
        updateUrl: ()=>{
            dispatch({type:`${namespace}/updateUrl`});
        }
    }
};


@connect(mapStateToProps,mapDispatchToProps)
class HardwareDetail extends Component{

    componentDidMount(){

        this.props.updateUrl();

        var oIframe = document.getElementById("iframe");
        var oBody = document.getElementsByClassName("ant-layout-content")[0];
        oIframe.style.height = oBody.offsetHeight - 5 + 'px';
    }

    render(){
        return (
            <iframe
                id={"iframe"}
                className={styles.hardwareDetailContent}
                src={this.props.url}
                frameBorder="0"
            />
        )
    }

}

export default HardwareDetail;


