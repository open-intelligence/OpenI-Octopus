from __future__ import absolute_import
from __future__ import division
from __future__ import print_function
from __future__ import unicode_literals

"""
MXNet Protobuf to IR converter & 
IR to MXNet net converter
To run this, you will need to have MXNet installed as well.
"""

import os
import sys
sys.path.append('./../')
import json
import numpy as np
import mxnet as mx
from six import text_type, binary_type, integer_types
from common.IR import model_pb2
from common.IR.model_pb2 import Model, Graph, Node
from common.IR.converter import Converter
from common.mxnet.mxnet_graph import MXNetGraph

"""
Converter between MXNet and IR 
"""
class MxNetConverter(Converter):

    dtype_map = {
        "int8"      : model_pb2.INT8,
        "int16"     : model_pb2.INT16,
        "int32"     : model_pb2.INT32,
        "int64"     : model_pb2.INT64,
        "uint8"     : model_pb2.UINT8,
        "uint16"    : model_pb2.UINT16,
        "uint32"    : model_pb2.UINT32,
        "uint64"    : model_pb2.UINT64,
        "float16"   : model_pb2.FLOAT16,
        "float32"   : model_pb2.FLOAT32,
        "float64"   : model_pb2.FLOAT64
    }

    activation_map = {
        "relu"      : "Relu",
        "sigmoid"   : "Sigmoid",
        "tanh"      : "Tanh",
        # Not support yet
        # "softrelu"  : "SoftReLU"
    }

    channels_last = ['NDHWC', 'NHWC', 'NWC']
    channels_first = ['NCDHW', 'NCHW', 'NCW']

    @staticmethod
    def load_mxnet_weights_file(prefix, epoch):
        """
        The format of the params of the mxnet model:
        - 
        """
        # load the model network and weights
        symbol, arg_params, aux_params = mx.model.load_checkpoint(prefix, epoch)
        model = mx.mod.Module(symbol = symbol)
        arg_params.update(aux_params)

        return model, arg_params

    @staticmethod
    def load_mxnet_json_file(file_path):
        """
        The format of the json file of the mxnet model
        - data['nodes'][layer_num][params = {'name', 'op', 'attr', 'inputs'}]
        """
        with open(file_path, 'r') as net_json:
            json_data = json.load(net_json)
        
        # adjust the data format
        assert isinstance(json_data["nodes"], list)
        return json_data['nodes']
    
    @property
    def src_graph(self):
        return self.mxnet_graph

    @staticmethod
    def str2bool(v):
        return v.lower() in ("1", "true")

    @staticmethod
    def str2intList(v):
        v = v.replace("(", "")
        v = v.replace(")", "")
        if v == "":
            return list()
        else:
            return [int(s) for s in v.split(',')]

    @staticmethod
    def transpose(data, dim):
        if dim == 1:
            data = data.transpose((2, 1, 0))
        elif dim == 2:
            data = data.transpose((2, 3, 1, 0))
        elif dim == 3:
            data = data.transpose((2, 3, 4, 1, 0))
        else:
            print("Warning: The weight of dim {0} cannot transpose" % dim)

        return data

    def trace_shape(self, source_node, IR_node):
        while (not IR_node.operator == "flatten"):
            IR_node = self.IR_layer_map[IR_node.input[0]]
        IR_node = self.IR_layer_map[IR_node.input[0]]
        input_shape = list()
        for e in IR_node.attribute["_output_shapes"].val.shape.dim:
            input_shape.append(e.size)
        C = input_shape.pop()
        ret = [C] + input_shape[1:]
        return ret

    @staticmethod
    def assign_attr_value(attr, val):
        from common.IR.model_pb2 import TensorShape
        '''Assign value to AttrValue proto according to data type.'''
        if isinstance(val, bool):
            attr.val.b = val
        elif isinstance(val, integer_types):
            attr.val.i = val
        elif isinstance(val, float):
            attr.val.f = val
        elif isinstance(val, binary_type) or isinstance(val, text_type):
            if hasattr(val, 'encode'):
                val = val.encode()
            attr.val.s = val
        elif isinstance(val, TensorShape):
            attr.shape.MergeFromString(val.SerializeToString())
        elif isinstance(val, list):
            if not val: return
            if isinstance(val[0], integer_types):
                attr.list.i.extend(val)
            elif isinstance(val[0], TensorShape):
                attr.list.shape.extend(val)
            else:
                raise NotImplementedError('AttrValue cannot be of list[{}].'.format(val[0]))
        else:
            raise NotImplementedError('AttrValue cannot be of %s' % type(val))

    
    @staticmethod
    def assign_IRnode_values(IR_node, val_dict):
        for name, val in val_dict.items():
            MxNetConverter.assign_attr_value(IR_node.attribute[name], val)


    @staticmethod
    def _convert_axis(IR_node, axis):
        ndim = len(IR_node.attribute['_output_shapes'].val.shape.dim)
        if axis == 0:
            return 0
        elif axis == 1:
            return ndim - 1
        else:
            return axis - 1

    @staticmethod
    def _add_model_info(IR_model, model):

        IR_model.doc_url = model['doc_url']
        IR_model.framework_name = model['framework_name']
        IR_model.framework_version = model['framework_version']
        IR_model.model_name = model['model_name']
        IR_model.model_version = model['model_version']
        IR_model.version = model['version']
        # Contributor
        IR_model.contributors.name.append(model['contributor_name'])
        contributor_email = IR_model.contributors.email.append(model['contributor_email'])
        contributor_institute = IR_model.contributors.institute.append(model['contributor_institute'])

        print('Success to add information of %s model !' % (IR_model.model_name))

    def __init__(self, args):
        """
        Args:
            [0]: 'IR' (MXNet Protobuf to IR converter)
                - [1]: the json file path of the mxnet model
                - [2] (optional): the params file path of the mxnet model
            [0]: 'MXNet' (IR to MXNet network converter)
                - [1]: the json or proto file path of the IR model
                - [2]: the npy file of the IR model
        """

        super(MxNetConverter, self).__init__()

        self.data_shape = tuple()
        if args[0].lower() in 'mxnet':
            pass
            # TODO
        elif args[0].lower() in 'ir': # MXNet Protobuf to IR converter
            if len(args) <= 3:
                with open(args[1], 'r') as net_json:
                    json_str = net_json.read()
                    symbol = mx.sym.load_json(json_str)
                    self.model = mx.mod.Module(symbol = symbol)
            # load weights    
            elif len(args) <= 5:
                weigths, _ = args[2].rsplit('.', 1)
                prefix, epoch = weigths.rsplit('-', 1)
                self.model, self.weigths = MxNetConverter.load_mxnet_weights_file(prefix, int(epoch))
                self.weight_loaded = True
                self.data_shape = tuple([1] + list(map(int, args[3])))
            else:
                ValueError('The arguments of input are not supported!')

            if len(args) >= 5:
                MxNetConverter._add_model_info(self.IR_model, args[4])

            json_data = MxNetConverter.load_mxnet_json_file(args[1])

            # Build network graph
            self.data_format = 'None'
            self.mxnet_graph = MXNetGraph(self.model)
            self.mxnet_graph.build(json_data)
            self.bias_num = 0

        else:
            ValueError('Please input IR or MXNet')

        # print(self.weigths)

    def mxnet_to_IR(self):
        self.IR_layer_map = dict()
        num_node = dict()
        for layer in self.mxnet_graph.topological_sort:
            current_node = self.mxnet_graph.get_node(layer)
            node_type = current_node.type
            # print(current_node, node_type, hasattr(self, "rename_" + node_type))
            print("rename " + node_type)
            if hasattr(self, "rename_" + node_type):
                # print('hasattr_rename_node_type:', layer)
                func = getattr(self, "rename_" + node_type)
                if node_type in num_node:
                    num_node[node_type] += 1
                else:
                    num_node[node_type] = 1
                # print("rename " + node_type)
                func(current_node)

            else:
                # pass
                # print('rename:', layer)
                self.rename_node(current_node)
        
        print(num_node, "bias: ", self.bias_num)

    def rename_node(self, node):
        print("Warning: MXNet Converter has not supported operator %s with name %s."
            % (node.type, node.name))

    def IR_to_mxnet(self):
        pass


    ###################################################################

    def _copy_and_reop(self, source_node, IR_node, new_op = None):
        new_op = source_node.type if new_op == None else new_op
        if source_node.name.startswith('_'):
            source_node.real_name = source_node.name[1:]
        IR_node.name = source_node.real_name
        IR_node.operator = new_op
        self.IR_layer_map[IR_node.name] = IR_node

    def _copy_and_reop_activation(self, source_node, IR_node, new_op = None):
        new_op = source_node.type if new_op == None else new_op
        if source_node.name.startswith('_'):
            source_node.real_name = source_node.name[1:]
        IR_node.name = source_node.real_name
        if "relu" in new_op.lower():
            IR_node.operator = "relu"
        elif "sigmoid" in new_op.lower():
            IR_node.operator = "sigmoid"
            IR_node.definition = "Y = 1 / (1 + exp(-X))"
        elif "softmax" in new_op.lower():
            IR_node.operator = "softmax"
            IR_node.definition = "Y = exp(X – max(X)) / sum(exp(X – max(X)))"
        elif "tanh" in new_op.lower():
            IR_node.operator = "tanh"
            IR_node.definition = "Y = (exp(X) – exp(-X)) / (exp(X) + exp(-X))"
        else:
            IR_node.operator = new_op
        self.IR_layer_map[IR_node.name] = IR_node

    def set_output_shape(self, source_node, IR_node, attr_name="_output_shapes"):
        sym_group = self.model.symbol.get_internals()
        for sym in sym_group:
            if source_node.name == sym.name:
                arg_shape, output_shape, aux_shape = sym.infer_shape(data = self.data_shape)
                for idx in range(len(output_shape)):
                    output_list = list(output_shape[idx])

                    # transpose to channel last
                    if not self.data_format in MxNetConverter.channels_last:
                        channel = output_list.pop(1)
                        output_list.append(channel)

                    if IR_node.operator == "DataInput":
                        MxNetConverter._copy_shape(IR_node, [-1] + output_list[1:])

                    shape = model_pb2.TensorShape()
                    for dim in output_list:
                        new_dim = IR_node.attribute[attr_name].val.shape.dim.add()
                        if dim == None:
                            new_dim.size = -1
                        else:
                            new_dim.size = dim

                    # attr = MxNetConverter._add_attr(IR_node, "_output_shapes")
                    # attr.list.shape.extend([shape])
                    # attr.list.shape.extend([shape])
                    # IR_node.attribute[attr_name].val.shape = shape
                break


    def _convert_arithmetic(self, source_node, new_op = None):
        IR_node = self.IR_graph.node.add()

        # name, op
        if new_op == None:
            self._copy_and_reop(source_node, IR_node)
        else:
            self._copy_and_reop(source_node, IR_node, new_op)

        # input edge
        self.convert_inedge(source_node, IR_node)

        # output shape
        self.set_output_shape(source_node, IR_node)


    def _defuse_padding(self, source_node):
        IR_node = self.IR_graph.node.add()
        IR_node.name = source_node.name + "_pad"
        IR_node.operator = "Pad"
        # input edge
        self.convert_inedge(source_node, IR_node)

        self.IR_layer_map[IR_node.name] = IR_node

        # attr
        MxNetConverter.assign_IRnode_values(IR_node, {'mode' : 'CONSTANT'})
        # print("Warning: MXNet symbol pad does not support channel last")

        assert "attrs" in source_node.layer or "param" in source_node.layer
        layer_attr = dict()
        if "attrs" in source_node.layer:
            layer_attr = source_node.layer["attrs"]
        elif "param" in source_node.layer:
            layer_attr = source_node.layer["param"]

        assert "pad" in layer_attr
        pad = MxNetConverter.str2intList(layer_attr.get("pad"))
        args['pads'] = [0, 0]
        for e in pad:
            args['pads'].extend([e, e])
        args['pads'] += [0, 0]
        args['pads'] = convert_tf_pad_to_onnx(args['pads'])
        IR_node.set_attrs(args)

        # IR_node.attr["pads"].list.i.extend([0, 0])
        # for e in pad:
        #     IR_node.attr["pads"].list.i.extend([e, e])
        # IR_node.attr["pads"].list.i.extend([0, 0])

        IR_node.attribute["constant_values"].val.f = 0.

    def _add_shift_node(self, source_node, IR_node, out_channel=None):
        shift_node = self.IR_graph.node.add()
        shift_node.name = "bias_" + str(self.bias_num)
        shift_node.operator = "shift"
        self.IR_layer_map[shift_node.name] = shift_node

        # add input
        shift_node.input.append(IR_node.name)

        # set shape of bias
        if out_channel == None:
            MxNetConverter._copy_shape(shift_node, [1])
        else:
            MxNetConverter._copy_shape(shift_node, [out_channel])

        # set next node
        # if self.next_node == None:
        #     self.next_node = dict()
        #     self.next_node[IR_node.name] = {shift_node.name}
        # else:
        self.next_node[IR_node.name] = shift_node.name
        
        # self.next_node = shift_node

        # add bias number
        self.bias_num = self.bias_num +1

        # output shape
        self.set_output_shape(source_node, shift_node)


    @staticmethod
    def _copy_shape(IR_node, output_list):
        if not output_list == None:
            for dim in output_list:
                new_dim = IR_node.attribute["shape"].val.shape.dim.add()
                if dim == None:
                    new_dim.size = -1
                else:
                    new_dim.size = dim
        else:
            IR_node.attribute["shape"].val.shape.unknown = True

    """
    Rename the mxnet to IR
    ====================================
    Here start with Neural Network Symbol
    """

    # FC
    def rename_FullyConnected(self, source_node):
        IR_node = self.IR_graph.node.add()

        # name, op
        self._copy_and_reop(source_node, IR_node, "full_connected")

        # input edge
        self.convert_inedge(source_node, IR_node)

        # attr
        assert "attrs" in source_node.layer or "param" in source_node.layer
        layer_attr = dict()
        if "attrs" in source_node.layer:
            layer_attr = source_node.layer["attrs"]
        elif "param" in source_node.layer:
            layer_attr = source_node.layer["param"]

        # units
        IR_node.attribute["units"].val.i = int(layer_attr.get("num_hidden"))

        # use bias (no_bias default = False)
        if not MxNetConverter.str2bool(layer_attr.get("no_bias", "False")):
            self._add_shift_node(source_node, IR_node)    

        # IR_node.attribute["use_bias"].val.b = 
        
        # output shape
        self.set_output_shape(source_node, IR_node)

        # weights
        if self.weight_loaded:
            if self.data_format == 'NM':
                self.set_weight(source_node.name, "weights", self.weigths.get(source_node.name + "_weight").asnumpy().transpose((1, 0)))
            else:
                weight = self.weigths.get(source_node.name + "_weight").asnumpy().transpose((1, 0))
                original_shape = weight.shape

                channel_first_list = self.trace_shape(source_node, IR_node)
                dim = len(channel_first_list) + 1
                weight = weight.reshape(channel_first_list + [original_shape[1]])
                assert dim > 2
                weight = weight.transpose(list(range(1, dim-1)) + [0, dim-1])
                weight = weight.reshape(original_shape)
                self.set_weight(source_node.name, "weights", weight)

            if not MxNetConverter.str2bool(layer_attr.get("no_bias", "False")):
                self.set_weight(source_node.name, "bias", self.weigths.get(source_node.name + "_bias").asnumpy())

        if not self.data_format == 'NM':
            # print("Warning: Layer [{}] has changed model data format from [{}] to [NM]".format(source_node.name, self.data_format))
            self.data_format = 'NM'

    # Convolution + bias
    def rename_Convolution(self, source_node):
        IR_node = self.IR_graph.node.add()

        # name, op
        self._copy_and_reop(source_node, IR_node, "conv")

        # input edge
        self.convert_inedge(source_node, IR_node)

        # output shape
        self.set_output_shape(source_node, IR_node)

        dim = 0
        layout = 'None'
        # print(source_node.layer)
        # attr
        assert "attrs" in source_node.layer or "param" in source_node.layer
        layer_attr = dict()
        if "attrs" in source_node.layer:
            layer_attr = source_node.layer["attrs"]
        elif "param" in source_node.layer:
            layer_attr = source_node.layer["param"]

        # kernel_shape
        assert "kernel" in layer_attr
        kernel = MxNetConverter.str2intList(layer_attr.get("kernel"))
        dim = len(kernel)
        IR_node.attribute["kernel_shape"].list.i.extend(kernel)

        layout = layer_attr.get("layout")
        if layout == None or layout == 'None':
            if dim == 1:
                layout = "NCW"
            elif dim == 2:
                layout = "NCHW"
            elif dim == 3:
                layout = "NCDHW"

        if not self.data_format == layout:
            # print("Warning: Layer [{}] has changed model data format from [{}] to [{}]".format(source_node.name, self.data_format, layout))
            self.data_format = layout

        # print(IR_node.input, self.IR_layer_map)
        in_channel = self.IR_layer_map[IR_node.input[0]].attribute["_output_shapes"].val.shape.dim[-1].size

        assert "num_filter" in layer_attr
        out_channel = int(layer_attr.get("num_filter"))

        IR_node.attribute["kernel_shape"].list.i.extend([in_channel, out_channel])

        # use_bias (no_bias default = False)
        # IR_node.attribute["use_bias"].val.b = not MxNetConverter.str2bool(layer_attr.get("no_bias", "False"))
        if not MxNetConverter.str2bool(layer_attr.get("no_bias", "False")):
            self._add_shift_node(source_node, IR_node, out_channel)  

        # strides
        strides = layer_attr.get("stride")
        IR_node.attribute["strides"].list.i.append(1)
        if not strides == None:
            IR_node.attribute["strides"].list.i.extend(MxNetConverter.str2intList(strides))
        IR_node.attribute["strides"].list.i.append(1)

        # dilations
        dilate = layer_attr.get("dilate")
        IR_node.attribute["dilations"].list.i.append(1)
        if not dilate == None:
            IR_node.attribute["dilations"].list.i.extend(MxNetConverter.str2intList(dilate))
        IR_node.attribute["dilations"].list.i.append(1)

        # data_format
        MxNetConverter.assign_IRnode_values(IR_node, {'data_format' : layout})

        # groups
        group = int(layer_attr.get("num_group", "1"))
        IR_node.attribute["group"].val.i = group
        if group == in_channel:
            self._copy_and_reop(source_node, IR_node, "DepthwiseConv")
        else:
            self._copy_and_reop(source_node, IR_node, "Conv")

        # padding
        if "pad" in layer_attr:
            pad = MxNetConverter.str2intList(layer_attr.get("pad"))
            IR_node.attribute["pads"].list.i.extend(([0]+pad+[0])*2)
        elif "auto_pad" in layer_attr:
            IR_node.attribute["auto_pad"].val.s = MxNetConverter.str2intList(layer_attr.get("auto_pad"))
        else:
            IR_node.attribute["auto_pad"].val.s = "same"

        # weights
        if self.weight_loaded:
            weight = self.weigths.get(source_node.name + "_weight").asnumpy()
            print(weight.shape, dim, layout)
            if not layout in MxNetConverter.channels_last:
                weight = MxNetConverter.transpose(weight, dim)
            print(weight.shape)
            self.set_weight(source_node.name, "weights", weight)

            if not MxNetConverter.str2bool(layer_attr.get("no_bias", "False")):
                self.set_weight(source_node.name, "bias", self.weigths.get(source_node.name + "_bias").asnumpy())


    # Activation function
    def rename_Activation(self, source_node):
        IR_node = self.IR_graph.node.add()

        assert "attrs" in source_node.layer or "param" in source_node.layer
        layer_attr = dict()
        if "attrs" in source_node.layer:
            layer_attr = source_node.layer["attrs"]
        elif "param" in source_node.layer:
            layer_attr = source_node.layer["param"]

        assert "act_type" in layer_attr
        self._copy_and_reop_activation(
            source_node, IR_node, MxNetConverter.activation_map[layer_attr.get("act_type")])

        # output shape
        self.set_output_shape(source_node, IR_node)

        self.convert_inedge(source_node, IR_node)


    # Batch Norm
    def rename_BatchNorm(self, source_node):
        IR_node = self.IR_graph.node.add()

        # name, op
        self._copy_and_reop(source_node, IR_node, "batch_normalization")

        # input edge
        self.convert_inedge(source_node, IR_node)

        # output shape
        self.set_output_shape(source_node, IR_node)

        layer_attr = dict()
        if "attrs" in source_node.layer:
            layer_attr = source_node.layer["attrs"]
        elif "param" in source_node.layer:
            layer_attr = source_node.layer["param"]

        # axis
        if self.data_format in MxNetConverter.channels_first or self.data_format == 'None':
            # attr = MxNetConverter._add_attr(IR_node, "axis")
            # attr.val.i = MxNetConverter._convert_axis(IR_node, int(layer_attr.get("axis", "1")))
            IR_node.attribute["axis"].val.i = MxNetConverter._convert_axis(IR_node, int(layer_attr.get("axis", "1")))
        else:
            # attr = MxNetConverter._add_attr(IR_node, "axis")
            # attr.val.i = int(layer_attr.get("axis", "1"))
            IR_node.attribute["axis"].val.i = int(layer_attr.get("axis", "1"))

        # scale
        # attr = MxNetConverter._add_attr(IR_node, "scale")
        # attr.val.b = not MxNetConverter.str2bool(layer_attr.get("fix_gamma", "True"))
        IR_node.attribute["W"].val.b = not MxNetConverter.str2bool(layer_attr.get("fix_gamma", "True"))
        # attr = MxNetConverter._add_attr(IR_node, "bias")
        # attr.val.b = True
        # IR_node.attribute["bias"].val.b = True
        self._add_shift_node(source_node, IR_node)  
        # epsilon
        # attr = MxNetConverter._add_attr(IR_node, "epsilon")
        # attr.val.f = float(layer_attr.get("eps", "0.001"))
        IR_node.attribute["epsilon"].val.f = float(layer_attr.get("eps", "0.001"))

        # IR_node.attr["scale"].val.b = not MxNetConverter.str2bool(layer_attr.get("fix_gamma", "True"))
        # IR_node.attr["bias"].val.b = True

        # momentum
        # attr = MxNetConverter._add_attr(IR_node, "momentum")
        # attr.val.f = float(layer_attr.get("momentum", "0.9"))
        IR_node.attribute["momentum"].val.f = float(layer_attr.get("momentum", "0.9"))

        # is training default as False
        IR_node.attribute["is_training"].val.b = False
        IR_node.definition = "Y = shift(scale(div(sub(X, means), sqrt(add(var, epsilon)), W), B)"
        
        # spatial (bool) default as True
        IR_node.attribute["spatial"].val.b = True

        # print(IR_node.attribute["scale"].val.b)

        # weights
        if self.weight_loaded:
            # gamma
            if IR_node.attribute["W"].val.b:
                self.set_weight(source_node.name, "W", self.weigths.get(source_node.name + "_gamma").asnumpy())

            # beta
            # if IR_node.attribute["bias"].val.b:
            self.set_weight(source_node.name, "bias", self.weigths.get(source_node.name + "_beta").asnumpy())

            # if MxNetConverter.str2bool(layer_attr.get("use_global_stats", "False")):
            # mean
            self.set_weight(source_node.name, "mean", self.weigths.get(source_node.name + "_moving_mean").asnumpy())

            # var
            self.set_weight(source_node.name, "var", self.weigths.get(source_node.name + "_moving_var").asnumpy())


    # Pooling
    def rename_Pooling(self, source_node):
        IR_node = self.IR_graph.node.add()

        # input edge
        self.convert_inedge(source_node, IR_node)

        layer_attr = dict()
        if "attrs" in source_node.layer:
            layer_attr = source_node.layer["attrs"]
        elif "param" in source_node.layer:
            layer_attr = source_node.layer["param"]

        # pooling type (sum not allowed yet)
        pool_type = layer_attr.get("pool_type")
        if pool_type == "sum":
            print("Warning: sum pooling is not supported yet.")
        elif pool_type == "max":
            # name, op
            self._copy_and_reop(source_node, IR_node, "max_pool")
            # MxNetConverter.assign_IRnode_values(IR_node, {'pooling_type' : 'MAX'})
        elif pool_type == "avg":
            # name, op
            self._copy_and_reop(source_node, IR_node, "average_pool")
            # MxNetConverter.assign_IRnode_values(IR_node, {'pooling_type' : 'AVG'})
        else:
            raise ValueError("Error pool_type {}.".format(pool_type))

        assert "kernel" in layer_attr
        kernel_shape = MxNetConverter.str2intList(layer_attr.get("kernel"))

        if MxNetConverter.str2bool(layer_attr.get("global_pool", "False")):
            IR_node.attribute['global_pooling'].val.b = True
            IR_node.attribute["kernel_shape"].list.i[:] = [1] * (len(kernel_shape) + 2)
            IR_node.attribute["strides"].list.i[:] = [1] * (len(kernel_shape) + 2)
        else:
            # IR_node.attribute['global_pooling'].val.b = False

            # strides
            strides = layer_attr.get("stride")
            IR_node.attribute["strides"].list.i.append(1)
            if not strides == None:
                IR_node.attribute["strides"].list.i.extend(MxNetConverter.str2intList(strides))
            IR_node.attribute["strides"].list.i.append(1)

            # kernel_shape
            IR_node.attribute["kernel_shape"].list.i.append(1)
            IR_node.attribute["kernel_shape"].list.i.extend(kernel_shape)
            IR_node.attribute["kernel_shape"].list.i.append(1)

            # padding
            if "pad" in layer_attr:
                pad = MxNetConverter.str2intList(layer_attr.get("pad"))
                IR_node.attribute["pads"].list.i.extend(([0]+pad+[0])*2)
            elif "auto_pad" in layer_attr:
                IR_node.attribute["auto_pad"].val.s = MxNetConverter.str2intList(layer_attr.get("auto_pad"))
            else:
                IR_node.attribute["auto_pad"].val.s = "same"

        # output shape
        self.set_output_shape(source_node, IR_node)

    # Softmax Output
    def rename_SoftmaxOutput(self, source_node):
        IR_node = self.IR_graph.node.add()

        # name, op
        self._copy_and_reop(source_node, IR_node, "softmax")

        # input edge
        self.convert_inedge(source_node, IR_node)

        if "attrs" in source_node.layer or "param" in source_node.layer:
            print("Warning: SoftmaxOutput attrs are not supported in IR.")

        # output shape
        self.set_output_shape(source_node, IR_node)

    # softmax
    def rename_softmax(self, source_node):
        IR_node = self.IR_graph.node.add()

        # name, op
        self._copy_and_reop(source_node, IR_node, "softmax")

        # input edge
        self.convert_inedge(source_node, IR_node)

        layer_attr = dict()
        if "attrs" in source_node.layer:
            layer_attr = source_node.layer["attrs"]
        elif "param" in source_node.layer:
            layer_attr = source_node.layer["param"]

        # dim
        if self.data_format in MxNetConverter.channels_first or self.data_format == 'None':
            IR_node.attribute["axis"].val.i = MxNetConverter._convert_axis(IR_node, int(layer_attr.get("axis", "-1")))
        else:
            IR_node.attribute["axis"].val.i = int(layer_attr.get("axis", "-1"))

        # output shape
        self.set_output_shape(source_node, IR_node)

        # definition
        IR_node.definition = "Y = exp(X – max(X)) / sum(exp(X – max(X)))"


    # def rename_log_softmax(self, source_node):
    #   raise NotImplementedError("not support yet")


    # def rename_Correlation(self, source_node):
    #   raise NotImplementedError("not support yet")

    # conv_transpose
    def rename_Deconvolution(self, source_node):
        IR_node = self.IR_graph.node.add()

        # name, op
        self._copy_and_reop(source_node, IR_node, "conv_transpose")

        # input edge
        self.convert_inedge(source_node, IR_node)

        dim = 0
        layout = 'None'
        layer_attr = dict()
        if "attrs" in source_node.layer:
            layer_attr = source_node.layer["attrs"]
        elif "param" in source_node.layer:
            layer_attr = source_node.layer["param"]

        # padding
        if "pad" in layer_attr:
            pad = MxNetConverter.str2intList(layer_attr.get("pad"))
            IR_node.attribute["pads"].list.i.extend(([0]+pad+[0])*2)
        elif "auto_pad" in layer_attr:
            IR_node.attribute["auto_pad"].val.s = MxNetConverter.str2intList(layer_attr.get("auto_pad"))
        else:
            IR_node.attribute["auto_pad"].val.s = "same"

        # output shape
        self.set_output_shape(source_node, IR_node)

        # kernel_shape
        assert "kernel" in layer_attr
        kernel = MxNetConverter.str2intList(layer_attr.get("kernel"))
        dim = len(kernel)
        IR_node.attribute["kernel_shape"].list.i.extend(kernel)

        layout = layer_attr.get("layout")
        if layout == None or layout == 'None':
            if dim == 1:
                layout = "NCW"
            elif dim == 2:
                layout = "NCHW"
            elif dim == 3:
                layout = "NCDHW"

        if not self.data_format == layout:
            # print("Warning: Layer [{}] has changed model data format from [{}] to [{}]".format(source_node.name, self.data_format, layout))
            self.data_format = layout

        in_channel = self.IR_layer_map[IR_node.input[0]].attribute["_output_shapes"].val.shape.dim[-1].size

        assert "num_filter" in layer_attr
        out_channel = int(layer_attr.get("num_filter"))

        IR_node.attribute["kernel_shape"].list.i.extend([out_channel, in_channel])

        # use_bias (no_bias default = False)
        # IR_node.attribute["use_bias"].val.b = not MxNetConverter.str2bool(layer_attr.get("no_bias", "False"))
        if not MxNetConverter.str2bool(layer_attr.get("no_bias", "False")):
            self._add_shift_node(source_node, IR_node, out_channel) 
        

        # strides
        strides = layer_attr.get("strides")
        IR_node.attribute["strides"].list.i.append(1)
        if not strides == None:
            IR_node.attribute["strides"].list.i.extend(MxNetConverter.str2intList(strides))
        IR_node.attribute["strides"].list.i.append(1)

        # dilations
        dilate = layer_attr.get("dilate")
        IR_node.attribute["dilations"].list.i.append(1)
        if not dilate == None:
            IR_node.attribute["dilations"].list.i.extend(MxNetConverter.str2intList(dilate))
        IR_node.attribute["dilations"].list.i.append(1)

        # data_format
        IR_node.attribute["data_format"].val.s = layout

        # groups
        IR_node.attribute["group"].val.i = int(layer_attr.get("num_group", "1"))

        # weights
        if self.weight_loaded:
            weight = self.weigths.get(source_node.name + "_weight").asnumpy()
            # if not layout in MxNetConverter.channels_last:
            weight = MxNetConverter.transpose(weight, dim)
            self.set_weight(source_node.name, "weights", weight)

            if not MxNetConverter.str2bool(layer_attr.get("no_bias", "False")):
                self.set_weight(source_node.name, "bias", self.weigths.get(source_node.name + "_bias").asnumpy())


    # def rename_RNN(self, source_node):
    #   raise NotImplementedError("RNN not support yet")

    # Embedding Not support yet
    def rename_Embedding(self, source_node):
        IR_node = self.IR_graph.node.add()

        # name, op
        self._copy_and_reop(source_node, IR_node)

        # input edge
        self.convert_inedge(source_node, IR_node)

        # attr
        layer_attr = dict()
        if "attrs" in source_node.layer:
            layer_attr = source_node.layer["attrs"]
        elif "param" in source_node.layer:
            layer_attr = source_node.layer["param"]

        # input_dim
        IR_node.attribute["input_dim"].val.i = int(layer_attr.get("input_dim"))

        # output_dim
        IR_node.attribute["output_dim"].val.i = int(layer_attr.get("output_dim"))

        # dtype
        IR_node.attribute["dtype"].val.v = MxNetConverter.dtype_map[layer_attr.get("dtype", "float32")]

        # output shape
        self.set_output_shape(source_node, IR_node)


    # Leaky ReLU
    # IR only support elu from {'elu', 'leaky', 'prelu', 'rrelu'}
    def rename_LeakyReLU(self, source_node):
        # judge whether meaningful
        assert "attrs"
        layer_attr = dict()
        if "attrs" in source_node.layer:
            layer_attr = source_node.layer["attrs"]
        elif "param" in source_node.layer:
            if "act_type" in source_node.layer["attrs"]:
                if not source_node.layer["attrs"]["act_type"] == "elu":
                    print("Warning: Activation Type %s is not supported yet." % source_node.layer["attrs"]["act_type"])
                    return

        IR_node = self.IR_graph.node.add()

        # name, op
        self._copy_and_reop(source_node, IR_node, "elu")

        # input edge
        self.convert_inedge(source_node, IR_node)

        # attr
        layer_attr = source_node.layer["attrs"]

        # alpha [exp(x) - alpha], but mxnet attr slope [slope*(exp(x) - 1)] when x < 0
        if "slope" in layer_attr:
            raise ValueError("Attribute Slope is not supported in IR format")
        # aplpa default as 0.01
        IR_node.attribute["alpha"].val.f = 0.01
        # definition
        IR_node.definition = "Y = clip(X, 0, inf) + alpha*clip(X, -inf, 0)"

        # output shape
        self.set_output_shape(source_node, IR_node)

        # raise NotImplementedError("slope cannot convert to alpha")


    # def rename_InstanceNorm(self, source_node):
    #   raise NotImplementedError


    # def rename_L2Normalization(self, source_node):
    #   raise NotImplementedError

    # LRN
    def rename_LRN(self, source_node):
        IR_node = self.IR_graph.node.add()

        # name, op
        self._copy_and_reop(source_node, IR_node, "LRN")

        # input edge
        self.convert_inedge(source_node, IR_node)

        layer_attr = dict()
        if "attrs" in source_node.layer:
            layer_attr = source_node.layer["attrs"]
        elif "param" in source_node.layer:
            layer_attr = source_node.layer["param"]

        # alpha
        IR_node.attribute["alpha"].val.f = float(layer_attr.get("alpha", "0.0001"))
        # beta
        IR_node.attribute["beta"].val.f = float(layer_attr.get("beta", "0.75"))
        # knorm
        IR_node.attribute["k"].val.f = float(layer_attr.get("knorm", "2"))
        # bias
        if "bias" in layer_attr:
            IR_node.attribute["bias"].val.f = float(layer_attr.get("bias", "0.1"))
        else:
            IR_node.attribute["bias"].val.f = 0.1
        # nsize
        assert "nsize" in layer_attr
        IR_node.attribute["size"].val.i = int(layer_attr["nsize"])

        IR_node.definition = "Y = (bias + (alpha/size)*sum(LpNorm(X, 2))^beta"

        # output shape
        self.set_output_shape(source_node, IR_node)


    # def rename_ROIPooling(self, source_node):
    #   raise NotImplementedError

    # Dropout
    def rename_Dropout(self, source_node):
        IR_node = self.IR_graph.node.add()

        # name, op
        self._copy_and_reop(source_node, IR_node, "dropout")

        # input edge
        self.convert_inedge(source_node, IR_node)

        layer_attr = dict()
        if "attrs" in source_node.layer:
            layer_attr = source_node.layer["attrs"]
        elif "param" in source_node.layer:
            layer_attr = source_node.layer["param"]

        # keep_prob
        IR_node.attribute["ratio"].val.f = float(layer_attr.get("p", "0.5"))

        # mode
        # MxNetConverter.assign_IRnode_values(IR_node, {'mode' : 'training'})

        # is_training default False
        IR_node.attribute["is_training"].val.b = False

        # output shape
        self.set_output_shape(source_node, IR_node)


    """
    Here start with Symbol manipulation routines
    """

    # reshape
    # reverse cannot support yet
    def rename_reshape(self, source_node):
        IR_node = self.IR_graph.node.add()

        # name, op
        self._copy_and_reop(source_node, IR_node, "reshape")

        # input edge
        self.convert_inedge(source_node, IR_node)

        layer_attr = dict()
        if "attrs" in source_node.layer:
            layer_attr = source_node.layer["attrs"]
        elif "param" in source_node.layer:
            layer_attr = source_node.layer["param"]

        # old API target_shape not support yet
        shape = layer_attr.get("shape")
        if not shape == None:
            shape_list = MxNetConverter.str2intList(shape)
            for param in shape_list:
                if param <= 0 and not param == -1:
                    raise ValueError("special value %d for Reshape is not pre-defined in IR." % param)
            IR_node.attribute["shape"].list.i.extend(shape_list)

        # output shape
        self.set_output_shape(source_node, IR_node)

        # raise NotImplementedError("adjust output shape")

    # Flatten
    def rename_Flatten(self, source_node):
        IR_node = self.IR_graph.node.add()

        # name, op
        self._copy_and_reop(source_node, IR_node, "flatten")

        # input edge
        self.convert_inedge(source_node, IR_node)

        # output shape
        self.set_output_shape(source_node, IR_node)

        # axis default as -1
        IR_node.attribute["axis"].val.i = -1

    # Concat
    def rename_Concat(self, source_node):
        IR_node = self.IR_graph.node.add()

        # name, op
        self._copy_and_reop(source_node, IR_node, "concat")

        # output shape
        self.set_output_shape(source_node, IR_node)

        # input edge
        self.convert_inedge(source_node, IR_node)

        # attr
        layer_attr = dict()
        if "attrs" in source_node.layer:
            layer_attr = source_node.layer["attrs"]
        elif "param" in source_node.layer:
            layer_attr = source_node.layer["param"]

        # dim
        if self.data_format in MxNetConverter.channels_first or self.data_format == 'None':
            IR_node.attribute["axis"].val.i = MxNetConverter._convert_axis(IR_node, int(layer_attr.get("dim", "1")))
        else:
            IR_node.attribute["axis"].val.i = int(layer_attr.get("dim", "1"))

    # cast
    def rename_cast(self, source_node):
        IR_node = self.IR_graph.node.add()

        # name, op
        self._copy_and_reop(source_node, IR_node, "cast")

        # input edge
        self.convert_inedge(source_node, IR_node)

        # attr
        assert "attrs" in source_node.layer or "param" in source_node.layer
        layer_attr = dict()
        if "attrs" in source_node.layer:
            layer_attr = source_node.layer["attrs"]
        else:
            layer_attr = source_node.layer["param"]

        # dtype
        IR_node.attribute["to"].val.v = MxNetConverter.dtype_map[layer_attr.get("dtype")]

        # output shape
        self.set_output_shape(source_node, IR_node)


    def rename_expand_dims(self, source_node):
        IR_node = self.IR_graph.node.add()

        # name, op
        self._copy_and_reop(source_node, IR_node, "expand_dims")

        # input edge
        self.convert_inedge(source_node, IR_node)

        # output shape
        self.set_output_shape(source_node, IR_node)

        # attr
        assert "attrs" in source_node.layer or "param" in source_node.layer
        layer_attr = dict()
        if "attrs" in source_node.layer:
            layer_attr = source_node.layer["attrs"]
        else:
            layer_attr = source_node.layer["param"]

        # axis
        if self.data_format in MxNetConverter.channels_first or self.data_format == 'None':
            IR_node.attribute["axis"].val.i = MxNetConverter._convert_axis(IR_node, int(layer_attr.get("axis")))
        else:
            IR_node.attribute["axis"].val.i = int(layer_attr.get("axis"))


    def rename_elemwise_add(self, source_node):
        self._convert_arithmetic(source_node, 'add')


    def rename__Plus(self, source_node):
        self._convert_arithmetic(source_node, 'add')


    def rename_broadcast_add(self, source_node):
        self._convert_arithmetic(source_node, 'add')


    def rename_broadcast_mul(self, source_node):
        self._convert_arithmetic(source_node, 'mul')


    def rename__mul(self, source_node):
        self._convert_arithmetic(source_node, 'mul')

    def rename_null(self, source_node):
        self._convert_arithmetic(source_node, 'null')


    def rename__copy(self, source_node):
        IR_node = self.IR_graph.node.add()

        # name, op
        self._copy_and_reop(source_node, IR_node)

        # input edge
        self.convert_inedge(source_node, IR_node)

        # output shape
        self.set_output_shape(source_node, IR_node)

        # raise NotImplementedError("No matching IR api")