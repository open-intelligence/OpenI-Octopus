# -*- coding: UTF-8 -*-
import os
import sys
sys.path.append('./../')
import math
import mxnet as mx
import numpy as np
from common.IR.IR_graph import IRGraph
import common.IR.model_pb2 as model_pb2
from common.IR.recover import Recover

class MXNetRecover(Recover):

    dtype_map = {
        model_pb2.FLOAT16    : "float16",
        model_pb2.FLOAT32    : "float32",
        model_pb2.FLOAT64    : "float64",
        model_pb2.INT32      : "int32",
        model_pb2.UINT8      : "uint8"
    }

    activation_map = {
        "relu"    : "Relu",
        "sigmoid" : "Sigmoid",
        "tanh"    : "Tanh",
        "elu"     : "Elu"
    }

    transpose_map = {
        1 : 2,
        2 : 3,
       -1 : 1
    }

    channels_last = ['NDHWC', 'NHWC']

    def __init__(self, model):
        super(MXNetRecover, self).__init__()
        from six import string_types as _string_types

        if len(model) == 3:
            network_path = model[0]
            weight_path = model[1]
            self.output_weights_file = model[2]
            self.weights = np.load(weight_path).item()
            self.weight_loaded = True
            self.output_weights = dict()
        else:
            raise ValueError("the # of input arguments [{}] is not supported" % len(model))

        self.IR_graph = IRGraph(network_path)
        self.IR_graph.build()
        # self.save_weights(self.output_weights, self.output_weights_file)


    def IR_to_mxnet(self):
        self.IR_layer_map = dict()
        for layer in self.IR_graph.topological_sort:
            self.IR_layer_map[layer] = self.IR_graph.get_node(layer)

        shape = dict()
        for layer in self.IR_graph.topological_sort:
            current_node = self.IR_graph.get_node(layer)
            node_type = current_node.type
            # print(node_type)

            # if len(current_node.in_edges) == 0:
            #     current_node.in_edges.append('data')

            # if node_type.lower() in MXNetRecover.activation_map:
            #     func = getattr(self, "recover_Activation")
            #     line = func(current_node, MXNetRecover.activation_map[node_type.lower()].lower())
            #     # self.add_body(1, line)
            # elif hasattr(self, "recover_" + node_type):
            #     func = getattr(self, "recover_" + node_type)
            #     line = func(current_node)
            #     # self.add_body(1, line)
            # else:
            #     print("MXNet Recover has not supported operator [%s]." % (node_type))
            #     self.recover_UNKNOWN(current_node)

            # if node_type == "DataInput":
            #     cur_shape = list()
            #     first = True
            #     for dim in current_node.IR_layer.attribute["shape"].val.shape.dim:
            #         if dim.size == -1 and first:
            #             cur_shape.append(1)
            #             print("Detect input layer [{}] using infer batch size, set it as default value [1]".format(current_node.name))
            #         else:
            #             if dim.size == -1:
            #                 print("Warning: user should change input size manually")
            #             cur_shape.append(dim.size)
            #         first = False

            #     cur_shape.insert(1, cur_shape.pop())
            #     shape[current_node.name] = ', '.join('%s' % i for i in cur_shape)


        if self.weight_loaded:
            # fullpath = os.path.abspath(self.output_weights_file)
            # dirname = os.path.dirname(fullpath)
            # if not os.path.exists(dirname):
            #     os.makedirs(dirname)
            print(self.output_weights_file)
            with open(self.output_weights_file + '/open-exchange.npy', 'wb') as outfile:
                print("saved weight!!!")
                np.save(outfile, self.weights)



    @staticmethod
    def calculate_same_pad(data_shape, kernel, stride):
        if (data_shape % stride == 0):
            pad = max(kernel - stride, 0)
        else:
            pad = max(kernel - (data_shape % stride), 0)
        if pad % 2 == 0:
            return False, pad
        else:
            return True, pad


    @staticmethod
    def transfer_pad(pad_list):
        defuse_pad = False
        pad = list()

        assert len(pad_list) % 2 == 0
        mid = int(len(pad_list)/2)
        pad_first = pad_list[1:mid-1]
        pad_second = pad_list[mid+1:-1]

        for i in range(0, mid-2):
            if not pad_first[i] == pad_second[i]:
                defuse_pad = True

        if defuse_pad:
            pad.extend([0] * 4)
            for i in range(0, mid-2):
                pad.extend([pad_first[i], pad_second[i]])
        else:
            pad = pad_first

        return defuse_pad, pad


    @staticmethod
    def transpose(data, dim):
        if dim == 1:
            data = data.transpose((2, 1, 0))
        elif dim == 2:
            data = data.transpose((3, 2, 0, 1))
        elif dim == 3:
            data = data.transpose((4, 3, 0, 1, 2))
        else:
            raise ValueError("The weight of dim {} cannot transpose" % dim)

        return data


    def set_pad(self, IR_node, code, pad, _max_pool):
        if _max_pool:
            constant_value = "float('-inf')"
        else:
            constant_value = "0.0"

        code = "{:<15} = mx.sym.pad(data = {}, mode = 'constant', pad_width={}, constant_value = {}, name = '{}')".format(
                IR_node.variable_name + "_pad",
                self.parent_variable_name(IR_node),
                tuple(pad),
                constant_value,
                IR_node.name + "_pad")

        for e in IR_node.in_edges:
            if e == 'data':
                continue
            self.IR_layer_map[e].out_edges = [x if not self.IR_layer_map[x].name == IR_node.variable_name else IR_node.variable_name + "_pad" for x in self.IR_layer_map[e].out_edges]

        return code


    def recover_UNKNOWN(self, IR_node):
        print(IR_node.name)


    def recover_full_connected(self, IR_node):
        if self.weight_loaded:
            print('recover_full_connected')
            weight_dict = self.weights[IR_node.name]
            parent = self.IR_graph.get_parent(IR_node.name, [0])
            while parent.type == "Flatten":
                parent = self.IR_graph.get_parent(parent.name, [0])
            dim = len(parent.layer.attribute['_output_shapes'].val.shape.dim)

            # dim = len(parent.layer.attr['_output_shapes'].list.shape[0].dim)
            if dim > 2:
                original_dims = weight_dict['weights'].shape
                dims = [i.size for i in parent.layer.attribute['_output_shapes'].val.shape.dim[1:]] + [-1]
                weight_dict['weights'] = np.reshape(weight_dict['weights'], dims)
                weight_dict['weights'] = np.transpose(weight_dict['weights'], [dim - 2] + list(range(0, dim - 2)) + [dim - 1])
                weight_dict['weights'] = np.reshape(weight_dict['weights'], original_dims)
            self.output_weights[IR_node.name + "_weight"] = weight_dict['weights'].transpose((1, 0))

        num_hidden = IR_node.IR_layer.attribute["units"].val.i
        # no_bias = not IR_node.IR_layer.attribute["use_bias"].b
        print('bias' in self.IR_graph.get_son(IR_node.name, [0]).name)
        if 'bias' in self.IR_graph.get_son(IR_node.name, [0]).name and self.weight_loaded:
            self.output_weights[IR_node.name + "_bias"] = weight_dict['bias']


    def _recover_convolution(self, IR_node, pattern):
        if self.weight_loaded:
            print('_recover_conv')
            weight_dict = self.weights[IR_node.name]
            weights = weight_dict['weights']
            # print(weights.shape)

        # print(IR_node.IR_layer.attribute["kernel_shape"].list.i)
        dim = len(IR_node.IR_layer.attribute["kernel_shape"].list.i) - 2
        # print(dim)

        kernel = list()
        for idx in range(0, dim):
            kernel.append(IR_node.IR_layer.attribute["kernel_shape"].list.i[idx])

        stride = list()
        for e in IR_node.IR_layer.attribute["strides"].list.i[1:-1]:
            stride.append(e)

        dilate = list()
        for e in IR_node.IR_layer.attribute["dilations"].list.i[1:-1]:
            dilate.append(e)
        dilate = ', '.join('%s' % i for i in dilate)

        defuse_pad = False
        pad = list()
        if "pads" in IR_node.IR_layer.attribute:
            output_shape = list()
            for e in IR_node.IR_layer.attribute["_output_shapes"].val.shape.dim:
                output_shape.append(e.size)

            # print("Warning: MXNet Convolution Layer pad does not match IR Convolution Layer pad")
            defuse_pad, pad = MXNetRecover.transfer_pad(IR_node.IR_layer.attribute["pads"].list.i)

        num_filter = 0
        if pattern == "Deconvolution":
            num_filter = IR_node.IR_layer.attribute["kernel_shape"].list.i[-2]
        else:
            num_filter = IR_node.IR_layer.attribute["kernel_shape"].list.i[-1]

        # if pattern == "DepthwiseConv":
        #     num_group = IR_node.IR_layer.attribute["kernel_shape"].list.i[-2]
        #     num_filter = num_filter * num_group
        #     pattern = "Convolution"
        #     if self.weight_loaded:
        #         weights = np.swapaxes(weights, -1, -2)

        # else:
        #     num_group = IR_node.get_attr('group', 1)

        # layout = IR_node.IR_layer.attribute["data_format"].s
        if dim == 1:
            layout = 'NCW'
        elif dim == 2:
            layout = 'NCHW'
        elif dim == 3:
            layout = 'NCDHW'

        if self.weight_loaded:
            # if layout not in MXNetRecover.channels_last:
            # print(weights.shape)
            weights = MXNetRecover.transpose(weights, dim)
            # print(weights.shape)
            self.output_weights[IR_node.name + "_weight"] = weights

        # use_bias = IR_node.get_attr('use_bias', False)
        # print('bias' in self.IR_graph.get_son(IR_node.name, [0]).name)
        if 'bias' in self.IR_graph.get_son(IR_node.name, [0]).name and self.weight_loaded:
            self.output_weights[IR_node.name + "_bias"] = weight_dict['bias']

    def recover_shift(self, IR_node):
        pass

    def recover_flatten(self, IR_node):
        pass

    def recover_Softmax(self, IR_node):
        pass

    def recover_null(self, IR_node):
        pass

    def recover_Conv(self, IR_node):
        return self._recover_convolution(IR_node, "Convolution")


    def recover_DepthwiseConv(self, IR_node):
        return self._recover_convolution(IR_node, "DepthwiseConv")


    def recover_conv_transpose(self, IR_node):
        return self._recover_convolution(IR_node, "Deconvolution")


    def recover_DataInput(self, IR_node):
        shape = list()
        shape.extend(IR_node.IR_layer.attribute["shape"].list.i)


    # Add LeakyReLU Elu(slope not support)
    def recover_Activation(self, IR_node, act_type):

        act_type = act_type
        func_name = ""

        if act_type == "elu":
            func_name = "LeakyReLU"
        else:
            func_name = "Activation"


    def recover_batch_normalization(self, IR_node):
        if self.weight_loaded:
            print('recover_BatchNorm')
            weight_dict = self.weights[IR_node.name]

        # axis = IR_node.IR_layer.attribute["axis"].i
        axis = 1
        eps = IR_node.IR_layer.attribute["epsilon"].f
        momentum = IR_node.IR_layer.attribute["momentum"].f

        fix_gamma = not IR_node.IR_layer.attribute["scale"].b

        if self.weight_loaded:
            if not fix_gamma:
                self.output_weights[IR_node.name + "_gamma"] = weight_dict['scale']
            self.output_weights[IR_node.name + "_beta"] = weight_dict['bias']

        # not supported yet
        use_global_stats = "False"
        if self.weight_loaded:
            self.output_weights[IR_node.name + "_moving_var"] = weight_dict['var']
            self.output_weights[IR_node.name + "_moving_mean"] = weight_dict['mean']


    def recover_pool(self, IR_node):

        global_pool = IR_node.IR_layer.attribute["global_pooling"].b

        kernel = list()
        if global_pool:
            kernel = [1] * (len(IR_node.IR_layer.attribute["strides"].list.i) - 2)
        else:
            for e in IR_node.IR_layer.attribute["kernel_shape"].list.i[1:-1]:
                kernel.append(e)

        pool_type = IR_node.get_attr('pooling_type').lower()

        stride = list()
        for e in IR_node.IR_layer.attribute["strides"].list.i[1:-1]:
            stride.append(e)

        defuse_pad = False
        pad = list()
        if "pads" in IR_node.IR_layer.attribute:
            output_shape = list()
            for e in IR_node.IR_layer.attribute["_output_shapes"].list.shape[0].dim:
                output_shape.append(e.size)

            # print("Warning: MXNet Pooling Layer pad does not match IR Pooling Layer pad")
            defuse_pad, pad = MXNetRecover.transfer_pad(IR_node.IR_layer.attribute["pads"].list.i)

    def recover_max_pool(self, IR_node):
        return

    # def recover_SoftmaxOutput(self, IR_node):

    #     # code = "{:<15} = mx.sym.SoftmaxOutput(data = {}, name = 'softmax')".format(
    #     #     IR_node.variable_name,
    #     #     self.parent_variable_name(IR_node)
    #     # )

    #     # return code


    # def recover_Softmax(self, IR_node):

    #     # code = ""

    #     # if len(IR_node.out_edges) == 0:
    #     #     code = "{:<15} = mx.sym.SoftmaxOutput(data = {}, name = 'softmax')".format(
    #     #             IR_node.variable_name,
    #     #             self.parent_variable_name(IR_node))
    #     # else:
    #     #     axis = IR_node.IR_layer.attribute["dim"].i
    #     #     code = "{:<15} = mx.sym.softmax(data = {}, axis = {}, name = '{}')".format(
    #     #             IR_node.variable_name,
    #     #             self.parent_variable_name(IR_node),
    #     #             axis,
    #     #             IR_node.name)

    #     # return code


    def recover_squeeze(self, IR_node):
        return self.recover_Flatten(IR_node)


    def recover_embedding(self, IR_node):

        input_dim = IR_node.IR_layer.attribute["input_dim"].i
        output_dim = IR_node.IR_layer.attribute["output_dim"].i
        dtype = MXNetRecover.dtype_map.get(IR_node.layer.attribute["dtype"].type, "float32")


    def recover_dropout(self, IR_node):
        p = IR_node.IR_layer.attribute["keep_prob"].f
        mode = IR_node.IR_layer.attribute["mode"].s.lower().decode() if 'mode' in IR_node.layer.attribute else 'training'


    # reverse cannot support yet
    def recover_reshape(self, IR_node):

        shape = list()
        for e in IR_node.IR_layer.attribute["shape"].list.i:
            shape.append(e)
        shape = ', '.join('%s' % i for i in shape)
        reverse = False


    # def recover_Flatten(self, IR_node):

    @staticmethod
    def _convert_axis(IR_node, axis):
        ndim = len(IR_node.layer.attribute['_output_shapes'].list.shape[0].dim)
        if axis == 0:
            return 0
        elif axis == ndim - 1:
            return 1
        else:
            return axis + 1


    def recover_concat(self, IR_node):
        dim = MXNetRecover._convert_axis(IR_node, IR_node.IR_layer.attribute["axis"].i)


    def recover_Cast(self, IR_node):

        dtype = IR_node.IR_layer.attribute["dtype"].type


    def recover_expand_dims(self, IR_node):

        axis = IR_node.IR_layer.attribute["axis"].i


    def recover_pad(self, IR_node):
        mode = IR_node.IR_layer.attribute["mode"].s.lower().decode()
        pad_width = list()
        pad_width.extend([0]*4)
        padding = convert_onnx_pad_to_tf(IR_node.get_attr("pads"))[1:-1]
        for padding_pair in padding:
            pad_width.extend(padding_pair)

        pad_width = ', '.join('%s' % i for i in pad_width)


    # def recover_Add(self, IR_node):


    # def recover_Mul(self, IR_node):


    def recover_ReduceMean(self, IR_node):
        axes = IR_node.layer.attribute['axes'].list.i[:]
        axes = ','.join('%s' % MXNetRecover.transpose_map[i] for i in axes)


    def recover_LRN(self, IR_node):
        pass

    def recover_Constant(self, IR_node):
        raise NotImplementedError()

    # def recover_Sub(self, IR_node):


    def recover_Relu6(self, IR_node):
        self.add_body(1, self.recover_Activation(IR_node, 'relu'))
        old_name = IR_node.variable_name
        IR_node.real_name = IR_node.real_name + "_clip"
        self.add_body(1, "{:<15} = mx.sym.clip({}, a_min=0, a_max=6, name='{}')".format(
            IR_node.real_variable_name,
            old_name,
            IR_node.real_name))

        return ""