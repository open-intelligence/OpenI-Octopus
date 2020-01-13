import React, {Component} from 'react';
import {Form, Input, InputNumber, Select} from 'antd';

import {formatMessage } from 'umi/locale';
import styles from './index.less';

import {connect} from 'dva';

function mapStateToProps(state) {
    return {
        ...state.workOrderForm
    };
}

const mapDispatchToProps=(dispatch)=>{
    return {
    }
};

@connect(mapStateToProps,mapDispatchToProps)
class MachineTimeFormItemsComponent extends Component {

    formatMachineHour = (value)=>{
        let machineHour
        if(!value){
            machineHour = 0;
        } else {
            machineHour = (/[1-9]\d*|0/.exec(value))[0];
        }
        return `${machineHour}小时`
    }

    render() {
        const { getFieldDecorator } = this.props.form;
        return (
            <>
                <Form.Item label={formatMessage({id:'expressway.tab.workOrder.form.spec.machineHour'})}>
                    {getFieldDecorator('spec.machineHour', {
                      initialValue:1,
                      rules: [
                          {
                              required: true,
                              message: formatMessage({id:'expressway.tab.workOrder.form.spec.machineHour.required.message'}),
                          },
                      ],
                    })(
                      <InputNumber
                        min={1}
                        formatter={this.formatMachineHour}
                        parser={value => parseInt(value.replace('小时', '')) }
                      />
                    )}
                </Form.Item>
            </>
        );
    }
}

// const WrappedMachineTimeFormItemsComponent = Form.create()(MachineTimeFormItemsComponent);
const WrappedMachineTimeFormItemsComponent = MachineTimeFormItemsComponent;

export default WrappedMachineTimeFormItemsComponent;
