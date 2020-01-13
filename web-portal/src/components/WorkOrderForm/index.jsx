import React, {Component} from 'react';
import {Form, Input, Button, Select, message } from 'antd';

import {formatMessage } from 'umi/locale';
import styles from './index.less';

import MachineTimeFormItems from "@/components/WorkOrderForm/MachineTimeFormItems";
import {connect} from 'dva';
const { Option } = Select;

const namespace = "workOrderForm";

function mapStateToProps(state) {
    return {
        ...state.workOrderForm
    };
}

const mapDispatchToProps=(dispatch)=>{
    return {
        changeOrderType: (selectOrderType) => {
            dispatch({type:`${namespace}/changeOrderType`,payload:{selectOrderType}})
        },
        submitWorkOrder:(workOrder,callback)=>{
            dispatch({type:`${namespace}/submitWorkOrder`,payload:{workOrder,callback}});
        },
    }
};

const formItemLayout = {
    labelCol: {
        xs: { span: 24 },
        sm: { span: 4 },
    },
    wrapperCol: {
        xs: { span: 24 },
        sm: { span: 20 },
    },
};
const tailFormItemLayout = {
    wrapperCol: {
        xs: {
            span: 24,
            offset: 0,
        },
        sm: {
            span: 16,
            offset: 4,
        },
    },
};
@connect(mapStateToProps,mapDispatchToProps)
class WorkOrderFormComponent extends Component {

    handleSubmit = (e) =>{
        e.preventDefault();
        this.props.form.validateFieldsAndScroll((err, values) => {
            if (err) {
              return
            }
            this.props.submitWorkOrder(values,(err)=>{
              if(err){
                message.error(err.message || err);
                return;
              }
              message.success("提交成功");
              this.props.form.resetFields();
            });
        });
    }

    render() {
        const { getFieldDecorator } = this.props.form;
        const props = this.props;

        let dynamicSpecFormItems
        if(props.selectOrderType === props.orderTypes.ApplyMachineTime){
            dynamicSpecFormItems = (<MachineTimeFormItems form={this.props.form}></MachineTimeFormItems>)
        }else{
            dynamicSpecFormItems = (<></>);
        }
        return (
            <Form {...formItemLayout} onSubmit={this.handleSubmit}>
                <Form.Item label={formatMessage({id:'expressway.tab.workOrder.form.type'})}>
                  {getFieldDecorator('type', {
                    initialValue: props.defaultSelectOrderType,
                    rules: [
                        {
                            required: true,
                            message: formatMessage({id:'expressway.tab.workOrder.form.type.required.message'}),
                        },
                    ],
                  })(
                      <Select placeholder={formatMessage({id:'expressway.tab.workOrder.form.type.required.message'})} onChange={props.changeOrderType}>
                          <Option value={props.orderTypes.ApplyMachineTime}>{formatMessage({id:'expressway.tab.workOrder.form.type.applyMachineTime'})}</Option>
                      </Select>
                  )}
                </Form.Item>
                {
                    dynamicSpecFormItems
                }
                <Form.Item label={formatMessage({id:'expressway.tab.workOrder.form.description'})}>
                    {getFieldDecorator('description', {
                        rules: [
                            {
                                required: true,
                                message: formatMessage({id:'expressway.tab.workOrder.form.description.required.message'}),
                            },
                        ],
                    })(
                      <Input.TextArea placeholder={formatMessage({id:"expressway.tab.workOrder.form.description.required.message"})} autosize />
                    )}
                </Form.Item>
                <Form.Item {...tailFormItemLayout}>
                    <Button type="primary" htmlType="submit">
                      {formatMessage({id:'expressway.tab.workOrder.form.submit'})}
                    </Button>
                </Form.Item>
            </Form>
        );
    }
}

const WrappedWorkOrderFormComponent = Form.create()(WorkOrderFormComponent);

export default WrappedWorkOrderFormComponent;
