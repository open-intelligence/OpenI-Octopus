import { Component } from 'react';
import styles from './index.less';

import {connect} from 'dva';

function mapStateToProps(state) {
    return {
        ...state.globalLayout,
        ...state.login,
    };
}

const mapDispatchToProps=(dispatch)=>{
    return {
        getCurrentUser:()=>{
            dispatch({type:`login/getCurrentUser`});
        },
    }
};

@connect(mapStateToProps,mapDispatchToProps)
class Ascend extends Component{

    constructor() {
        super();
        this.state = {
            iFrameHeight: '0px'
        }
    }

    componentWillMount(){
        this.props.getCurrentUser();
    }

    componentDidMount(){
        const AscendInstance = this;
        window.addEventListener('message',function(event){

            //console.log("atlas event data origin: ",event.origin);

            if(event.origin && event.data.height && event.origin.startsWith(AscendInstance.props.ascendRootPath))
            {
                //console.log("atlas event data height: ",event.data.height);

                AscendInstance.setState({
                    "iFrameHeight":  event.data.height + 'px'
                });
            }
        },false);

    }

    render(){
        let url = `${this.props.ascendRootPath}/ascend/adapter/#/d910/modelarts/overview/overview-index?userid=${this.props.username}&role=${this.props.admin?"admin":this.props.username}&token=${this.props.exts?this.props.exts.ascendSession.token:''}`;

        //console.log("Ascend url:",url);

        return (
            <iframe
                id="ascendIframe"
                className={styles.content}
                src={url}
                frameBorder="0"
                scrolling="no"
                height={this.state.iFrameHeight}
            />
        )

    }

}

export default Ascend;


