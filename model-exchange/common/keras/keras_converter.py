from __future__ import absolute_import
from __future__ import division
from __future__ import print_function
from __future__ import unicode_literals

"""
Keras Protobuf to IR converter & 
IR to MXNet net converter
To run this, you will need to have MXNet installed as well.
"""

import os
import sys
sys.path.append('./../')
import json
import numpy as np
import keras as _keras
from keras import backend as _K
from six import string_types as _string_types
from common.IR import model_pb2
from common.IR.model_pb2 import Model, Graph, Node
from common.IR.converter import Converter
from common.keras.keras_graph import KerasGraph
from common.IR.utils import *

"""
Converter between MXNet and IR 
"""
class KerasConverter(Converter):
    dtype_map = {
        "float16" : model_pb2.FLOAT16,
        "float32" : model_pb2.FLOAT32,
        "float64" : model_pb2.FLOAT64,
        "int16"   : model_pb2.INT16,
        "int32"   : model_pb2.INT32,
        "int64"   : model_pb2.INT64,
        "uint8"   : model_pb2.UINT8,
        "uint16"  : model_pb2.UINT16
    }

    activation_map = {
        "relu"          : "Relu",
        'softmax'       : "Softmax",
        'sigmoid'       : "Sigmoid",
        "tanh"          : "Tanh",
        "elu"           : "Elu",
        "relu6"         : "Relu6",
        'softplus'      : 'Softplus',
        'softsign'      : 'Softsign',
        'hard_sigmoid'  : 'HardSigmoid'
    }


    def _load_model(self, model_network_path, model_weight_path):
        """Load a keras model from disk

        Parameters
        ----------
        model_network_path: str
            Path where the model network path is (json file)

        model_weight_path: str
            Path where the model network weights are (hd5 file)

        Returns
        -------
        model: A keras model
        """
        from keras.models import model_from_json

        print(model_network_path, model_weight_path)
        # Load the model network
        json_file = open(model_network_path, 'r')
        loaded_model_json = json_file.read()
        json_file.close()

        # Load the model weights
        loaded_model = model_from_json(loaded_model_json, custom_objects={
            'relu6': _keras.applications.mobilenet.relu6,
            'DepthwiseConv2D': _keras.applications.mobilenet.DepthwiseConv2D})

        if model_weight_path:
            if os.path.isfile(model_weight_path):
                loaded_model.load_weights(model_weight_path)
                self.weight_loaded = True
                print("Network file [{}] and [{}] is loaded successfully.".format(model_network_path, model_weight_path))

            else:
                print("Warning: Weights File [%s] is not found." % (model_weight_path))

        return loaded_model

    @property
    def src_graph(self):
        return self.keras_graph

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
        super(KerasConverter, self).__init__()

        # load model files into Keras graph
        if isinstance(args, _string_types):
            model = _keras.models.load_model(
                args,
                custom_objects={
                    'relu6': _keras.applications.mobilenet.relu6,
                    'DepthwiseConv2D': _keras.applications.mobilenet.DepthwiseConv2D
                }
            )
            self.weight_loaded = True

        elif isinstance(args, tuple):
            model = self._load_model(args[0], args[1])
            # print(args[2])
            KerasConverter._add_model_info(self.IR_model, args[2])

        else:
            assert False

        # _keras.utils.plot_model(model, "model.png", show_shapes = True)

        # Build network graph
        self.data_format = _keras.backend.image_data_format()
        self.keras_graph = KerasGraph(model)
        self.keras_graph.build()
        self.bias_num = 0


    def keras_to_IR(self):
        for layer in self.keras_graph.topological_sort:
            current_node = self.keras_graph.get_node(layer)
            node_type = current_node.type

            if hasattr(self, "rename_" + node_type):
                func = getattr(self, "rename_" + node_type)
                print("rename_" + node_type)
                func(current_node)
            else:
                print("KerasParser has not supported operator [%s]." % (node_type))
                self.rename_UNKNOWN(current_node)

        _K.clear_session()


    @staticmethod
    def _set_output_shape(source_node, IR_node):
        shape = IR_node.attribute["_output_shapes"].val.shape
        for dim in source_node.layer.output_shape:
            new_dim = shape.dim.add()
            new_dim.size = dim if dim else -1

        # IR_node.attribute["_output_shapes"].val.shape.extend([shape])


    @staticmethod
    def _copy_and_reop(source_node, IR_node, new_op = None):
        IR_node.name = source_node.name
        IR_node.operator = source_node.type if new_op == None else new_op

        if hasattr(source_node.layer, "dtype"):
            IR_node.attribute["dtype"].val.v = KerasConverter.dtype_map[source_node.layer.dtype]

        KerasConverter._set_output_shape(source_node, IR_node)


    @staticmethod
    def _copy_shape(source_node, target_node):
        if hasattr(source_node, "output_shape"):
            for dim in source_node.output_shape:
                new_dim = target_node.attribute["shape"].val.shape.dim.add()
                new_dim.size = -1 if dim == None else dim

        else:
            target_node.attribute["shape"].val.shape.unknown = True


    @staticmethod
    def _convert_dataformat(source_node, target_node):
        if source_node.keras_layer.data_format == 'channels_last':
            target_node.attribute["data_format"].val.s = "NHWC"
        elif source_node.keras_layer.data_format == 'channels_first':
            target_node.attribute["data_format"].val.s = "NCHW"
        else:
            print("Warning: [%s] don't have data format info." % (source_node.keras_layer.name))


    @staticmethod
    def _convert_padding(source_node, IR_node):
        # TODO: Fused conv and pool with padding is different from defused operators
        dims = len(source_node.layer.input_shape)
        if source_node.layer.padding == 'valid':
            assign_IRnode_values(IR_node, {'auto_pad' : "VALID", 'pads' : [0, 0] * dims})

        elif source_node.layer.padding == 'same':
            kernel_shape = source_node.layer.kernel_size if hasattr(source_node.layer, 'kernel_size') else source_node.layer.pool_size
            padding = compute_tf_same_padding(
                source_node.layer.input_shape,
                kernel_shape,
                list(source_node.layer.strides))
            assign_IRnode_values(IR_node, {'auto_pad' : "SAME_LOWER", 'pads' : padding})

        else:
            assert False


    def _defuse_activation(self, source_node):
        if source_node.layer.activation is None or source_node.layer.activation.__name__ == "linear":
            return

        IR_node = self.IR_graph.node.add()
        IR_node.name = source_node.real_name + "_activation"
        IR_node.operator = KerasConverter.activation_map[source_node.layer.activation.__name__]
        IR_node.input.append(source_node.real_name)
        KerasConverter._set_output_shape(source_node, IR_node)

        # TODO: More activation functions
        # for ELU
        if hasattr(source_node.layer, 'alpha'):
            assign_attr_value(IR_node['alpha'], source_node.layer.alpha)

        source_node.real_name = IR_node.name

    @staticmethod
    def _copy_bias_shape(IR_node, output_list):
        if not output_list == None:
            for dim in output_list:
                new_dim = IR_node.attribute["shape"].val.shape.dim.add()
                if dim == None:
                    new_dim.size = -1
                else:
                    new_dim.size = dim
        else:
            IR_node.attribute["shape"].val.shape.unknown = True

    def _add_shift_node(self, source_node, IR_node, out_channel=None):
        shift_node = self.IR_graph.node.add()
        shift_node.name = "bias_" + str(self.bias_num)
        shift_node.operator = "shift"
        # self.IR_layer_map[shift_node.name] = shift_node

        # add input
        shift_node.input.append(IR_node.name)

        # set shape of bias
        if out_channel == None:
            KerasConverter._copy_bias_shape(shift_node, [1])
        else:
            KerasConverter._copy_bias_shape(shift_node, [out_channel])

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
        self._set_output_shape(source_node, shift_node)

    def _convert_convolution(self, source_node, dim):
        IR_node = self.IR_graph.node.add()

        # input edge
        self.convert_inedge(source_node, IR_node)

        # name, op
        if source_node.type.startswith('Separable'):
            KerasConverter._copy_and_reop(source_node, IR_node, "separable_conv")
            if self.weight_loaded:
                self.set_weight(source_node.name, 'depthwise_filter', source_node.layer.get_weights()[0])
                self.set_weight(source_node.name, 'pointwise_filter', source_node.layer.get_weights()[1])

        else:
            if source_node.type.startswith('Conv'):
                KerasConverter._copy_and_reop(source_node, IR_node, "conv")

            elif source_node.type.startswith('Deconv'):
                KerasConverter._copy_and_reop(source_node, IR_node, "conv_transpose")

            elif source_node.type.startswith('Depthwise'):
                KerasConverter._copy_and_reop(source_node, IR_node, "depthwise_conv")

            else:
                raise NotImplementedError("Convolution layer [{}] is not supported.".format(source_node.type))

            # weights
            if self.weight_loaded:
                self.set_weight(source_node.name, "weights", source_node.layer.get_weights()[0])
                if source_node.layer.use_bias:
                    self.set_weight(source_node.name, "bias", source_node.layer.get_weights()[1])
                    out_channel = source_node.layer.filters or source_node.layer.depth_multiplier
                    self._add_shift_node(source_node, IR_node, out_channel)
        
        if isinstance(source_node.layer.kernel_size, int):
            source_node.layer.kernel_size = (source_node.layer.kernel_size) * dim

        if isinstance(source_node.layer.strides, int):
            source_node.layer.strides = (source_node.layer.strides) * dim

        if isinstance(source_node.layer.dilation_rate, int):
            source_node.layer.dilation_rate = (source_node.layer.dilation_rate) * dim

        kwargs = dict()

        # pads
        KerasConverter._convert_padding(source_node, IR_node)

        # filter
        # [kd, kh, kw, channel_size, filter number]
        in_channel = source_node.layer.input_shape[-1] if self.data_format == "channels_last" else source_node.layer.input_shape[1]
        out_channel = source_node.layer.filters or source_node.layer.depth_multiplier

        if source_node.type.startswith("Deconv"):
            kwargs['kernel_shape'] = list(source_node.layer.kernel_size) + [out_channel, in_channel]
        else:
            kwargs['kernel_shape'] = list(source_node.layer.kernel_size) + [in_channel, out_channel]

        # use_bias
        kwargs['use_bias'] = source_node.keras_layer.use_bias

        # strides
        # [1, sd, sh, sw, 1]
        kwargs['strides'] = [1] + list(source_node.layer.strides) + [1]

        # dilations
        # [1, dd, dh, dw, 1]
        kwargs['dilations'] = [1] + list(source_node.layer.dilation_rate) + [1]

        assign_IRnode_values(IR_node, kwargs)

        # activation
        self._defuse_activation(source_node)


    def _convert_pooling(self, source_node, dim, pooling_type, is_global):
        IR_node = self.IR_graph.node.add()

        # name, op
        KerasConverter._copy_and_reop(source_node, IR_node, pooling_type)

        # input edge
        self.convert_inedge(source_node, IR_node)

        kwargs = {}

        # kwargs['pooling_type'] = pooling_type

        if is_global:
            kwargs['global_pooling'] = True
            kwargs['strides'] = [1] * (dim + 2)
        else:
            if isinstance(source_node.layer.pool_size, int):
                source_node.layer.pool_size = (source_node.layer.pool_size) * dim

            if isinstance(source_node.layer.strides, int):
                source_node.layer.strides = (source_node.layer.strides) * dim

            # padding
            self._convert_padding(source_node, IR_node)

            # strides
            # [1, sd, sh, sw, 1]
            kwargs['strides'] = [1] + list(source_node.layer.strides) + [1]

            # window_shape
            # [1, pd, ph, pw, 1]
            kwargs['kernel_shape'] = [1] + list(source_node.layer.pool_size) + [1]

        assign_IRnode_values(IR_node, kwargs)

        if is_global:
            flatten_node = self.IR_graph.node.add()
            flatten_node.name = source_node.name + '_flatten'
            flatten_node.operator = 'Flatten'
            flatten_node.input.append(source_node.name)
            KerasConverter._set_output_shape(source_node, flatten_node)
            source_node.real_name = flatten_node.name


    def _convert_merge(self, source_node, new_name = None):
        IR_node = self.IR_graph.node.add()

        # name, op
        KerasConverter._copy_and_reop(source_node, IR_node, new_name)

        # input edge
        self.convert_inedge(source_node, IR_node)

        # For concat axis
        if hasattr(source_node.layer, 'axis'):
            IR_node.attribute['axis'].val.i = source_node.layer.axis
        return IR_node


    def _convert_padding_api(self, source_node, IR_node, mode):
         # name, op
        KerasConverter._copy_and_reop(source_node, IR_node, "pad")

        # input edge
        self.convert_inedge(source_node, IR_node)

        kwargs = dict()
        kwargs['mode'] = mode

        # padding
        kwargs['pads'] = [0, 0]
        for padding_pair in source_node.layer.padding:
            kwargs['pads'].extend(padding_pair)
        kwargs['pads'] += [0, 0]
        kwargs['pads'] = convert_tf_pad_to_onnx(kwargs['pads'])
        assign_IRnode_values(IR_node, kwargs)


    def rename_UNKNOWN(self, source_node):
        print (source_node.layer.get_config())

        # only for training
        IR_node = self.IR_graph.node.add()

        # name, op
        KerasConverter._copy_and_reop(source_node, IR_node)

        # input edge
        self.convert_inedge(source_node, IR_node)


    def rename_Activation(self, keras_node):
        IR_node = self.IR_graph.node.add()

        # name, op
        KerasConverter._copy_and_reop(keras_node, IR_node, self.activation_map[keras_node.keras_layer.activation.__name__])

        # input edge
        self.convert_inedge(keras_node, IR_node)


    # Merge Layers
    def rename_Add(self, source_node):
        self._convert_merge(source_node)


    def rename_Conv1D(self, source_node):
        self._convert_convolution(source_node, 1)


    def rename_Conv2D(self, source_node):
        self._convert_convolution(source_node, 2)


    def rename_Conv3D(self, source_node):
        self._convert_convolution(source_node, 3)


    def rename_InputLayer(self, source_node):
        # only for training
        IR_node = self.IR_graph.node.add()

        # name, op
        KerasConverter._copy_and_reop(source_node, IR_node, "DataInput")

        # input edge
        self.convert_inedge(source_node, IR_node)

        # shape
        KerasConverter._copy_shape(source_node.keras_layer, IR_node)



    def rename_GlobalMaxPooling1D(self, source_node):
        self._convert_pooling(source_node, 1, "global_pool", True)


    def rename_GlobalMaxPooling2D(self, source_node):
        self._convert_pooling(source_node, 2, "global_pool", True)


    def rename_GlobalMaxPooling3D(self, source_node):
        self._convert_pooling(source_node, 3, "global_pool", True)


    def rename_GlobalAveragePooling1D(self, source_node):
        self._convert_pooling(source_node, 1, "global_pool", True)


    def rename_GlobalAveragePooling2D(self, source_node):
        self._convert_pooling(source_node, 2, "global_pool", True)


    def rename_GlobalAveragePooling3D(self, source_node):
        self._convert_pooling(source_node, 3, "global_pool", True)


    def rename_MaxPooling1D(self, source_node):
        self._convert_pooling(source_node, 1, "max_pool", False)


    def rename_MaxPooling2D(self, source_node):
        self._convert_pooling(source_node, 2, "max_pool", False)


    def rename_MaxPooling3D(self, source_node):
        self._convert_pooling(source_node, 3, "max_pool", False)


    def rename_AveragePooling1D(self, source_node):
        self._convert_pooling(source_node, 1, "average_pool", False)


    def rename_AveragePooling2D(self, source_node):
        self._convert_pooling(source_node, 2, "average_pool", False)


    def rename_AveragePooling3D(self, source_node):
        self._convert_pooling(source_node, 3, "average_pool", False)


    def rename_Dropout(self, source_node):
        # only for training
        IR_node = self.IR_graph.node.add()

        # name, op
        KerasConverter._copy_and_reop(source_node, IR_node, 'dropout')

        # input edge
        self.convert_inedge(source_node, IR_node)

        IR_node.attribute["ratio"].val.f = source_node.keras_layer.rate
        if source_node.keras_layer.seed != None:
            IR_node.attribute["seed"].val.i = source_node.keras_layer.seed
        
        IR_node.attribute["is_training"].val.b = False

    # Core Layers
    def rename_Dense(self, source_node):
        IR_node = self.IR_graph.node.add()

        # name, op
        KerasConverter._copy_and_reop(source_node, IR_node, "full_connected")

        # input edge
        self.convert_inedge(source_node, IR_node)

        # units
        IR_node.attribute["units"].val.i = source_node.keras_layer.units

        # use_bias
        # IR_node.attribute["use_bias"].b = 
        if source_node.keras_layer.use_bias:
            self._add_shift_node(source_node, IR_node)

        # weights
        if self.weight_loaded == True:
            self.set_weight(source_node.name, 'weights', source_node.layer.get_weights()[0])
            if source_node.keras_layer.use_bias:
                self.set_weight(source_node.name, 'bias', source_node.layer.get_weights()[1])

        # activation
        self._defuse_activation(source_node)


    def rename_Flatten(self, source_node):
        IR_node = self.IR_graph.node.add()

        # name, op
        KerasConverter._copy_and_reop(source_node, IR_node, "flatten")

        # input edge
        self.convert_inedge(source_node, IR_node)


    def rename_Embedding(self, source_node):
        IR_node = self.IR_graph.node.add()

        # name, op
        KerasConverter._copy_and_reop(source_node, IR_node)

        # input edge
        self.convert_inedge(source_node, IR_node)

        # input_dim
        IR_node.attribute["input_dim"].val.i = source_node.keras_layer.input_dim

        # output_dim
        IR_node.attribute["output_dim"].val.i = source_node.keras_layer.output_dim

        # mask_zero
        IR_node.attribute["mask_zero"].val.b = source_node.keras_layer.mask_zero

        # weights
        if self.weight_loaded:
            self.set_weight(source_node.name, 'embedding_weights', source_node.layer.get_weights()[0])


    def rename_GRU(self, source_node):
        IR_node = self.IR_graph.node.add()

        # name, op
        KerasConverter._copy_and_reop(source_node, IR_node)

        # input edge
        self.convert_inedge(source_node, IR_node)

        # units
        IR_node.attribute["units"].val.i = source_node.keras_layer.units

        # activation
        self._defuse_activation(source_node)

        # weights
        if self.weight_loaded:
            self.set_weight(source_node.name, 'gru_weights', source_node.layer.get_weights()[0])
            self.set_weight(source_node.name, 'gru_recurrent_weights', source_node.layer.get_weights()[1])
            if source_node.layer.use_bias:
                self.set_weight(source_node.name, "gru_bias", source_node.layer.get_weights()[2])


    def rename_Multiply(self, source_node):
        self._convert_merge(source_node, 'mul')


    def rename_Average(self, source_node):
        # Kit TODO : need to search the tf
        self._convert_merge(source_node, 'avg')


    def rename_Maximum(self, source_node):
        self._convert_merge(source_node)


    def rename_Concatenate(self, source_node):
        IR_node = self._convert_merge(source_node, 'concat')


    def rename_Reshape(self, source_node):
        IR_node = self.IR_graph.node.add()

        # name, op
        KerasConverter._copy_and_reop(source_node, IR_node, 'reshape')

        # input edge
        self.convert_inedge(source_node, IR_node)

        # for target shape
        IR_node.attribute["shape"].list.i.append(-1)
        IR_node.attribute["shape"].list.i.extend(source_node.layer.target_shape)


    def rename_Lambda(self, source_node):
        # print (source_node.layer.function)
        # import marshal
        # raw_code = marshal.dumps(source_node.layer.function.__code__)
        # print (raw_code)
        # print (source_node.layer.get_config())
        raise NotImplementedError("Lambda layer in keras is not supported yet.")

        IR_node = self.IR_graph.node.add()

        # name, op
        KerasConverter._copy_and_reop(source_node, IR_node, "Keras Lambda")

        # input edge
        self.convert_inedge(source_node, IR_node)

        IR_node.attribute['function'].val.s = source_node.keras_layer.function.__name__
        for dim in source_node.keras_layer.output_shape:
            new_dim = IR_node.attribute["output_shape"].val.shape.dim.add()
            if dim == None:
                new_dim.size = -1
            else:
                new_dim.size = dim

        # arguments not implementent
        #print (type(source_node.keras_layer.arguments))



    def rename_BatchNormalization(self, keras_node):
        IR_node = self.IR_graph.node.add()

        # name, op
        KerasConverter._copy_and_reop(keras_node, IR_node, 'batch_normalization')

        # input edge
        self.convert_inedge(keras_node, IR_node)

        # axis
        IR_node.attribute['axis'].val.i = keras_node.keras_layer.axis

        IR_node.attribute['scale'].val.b = keras_node.keras_layer.scale

        IR_node.attribute['bias'].val.b = keras_node.keras_layer.center

        IR_node.attribute['epsilon'].val.f = keras_node.layer.epsilon

        if self.weight_loaded:
            # Parameter arrangement in Keras: gamma, beta, mean, variance
            idx = 0

            # scale
            if IR_node.attribute['scale'].val.b:
                self.set_weight(keras_node.name, "scale", keras_node.layer.get_weights()[idx])
                idx += 1

            # beta
            if IR_node.attribute['bias'].val.b:
                self._add_shift_node(keras_node, IR_node)  
                self.set_weight(keras_node.name, "bias", keras_node.layer.get_weights()[idx])
                idx += 1

            # mean
            self.set_weight(keras_node.name, "mean", keras_node.layer.get_weights()[idx])

            # var
            self.set_weight(keras_node.name, "var", keras_node.layer.get_weights()[idx + 1])


    def rename_ZeroPadding2D(self, keras_node):
        IR_node = self.IR_graph.node.add()
        self._convert_padding_api(keras_node, IR_node, "constant")


    def rename_SeparableConv2D(self, source_node):
        self._convert_convolution(source_node, 2)


    def rename_DepthwiseConv2D(self, source_node):
        self._convert_convolution(source_node, 2)


    def custom_relu6(x):
        return _keras.relu(x, max_value=6)


    def _convert_crop(self, source_node):
        IR_node = self.IR_graph.node.add()

        KerasConverter._copy_and_reop(source_node, IR_node, "crop")

        self.convert_inedge(source_node, IR_node)

        border = []
        for i in source_node.layer.cropping:
            for j in i:
                border.append(j)

        assign_IRnode_values(IR_node, {'border' : border})



    def rename_Cropping1D(self, source_node):
        self._convert_crop(source_node)


    def rename_Cropping2D(self, source_node):
        self._convert_crop(source_node)


    def rename_Cropping3D(self, source_node):
        self._convert_crop(source_node)
