# -*- coding: UTF-8 -*-
from __future__ import absolute_import
from __future__ import division
from __future__ import print_function
from __future__ import unicode_literals

"""
IR Graph Class
"""

import os
import sys
import mxnet as mx
from common.IR.graph import NodeClass, GraphClass

class MXNetNode(NodeClass):

    def __init__(self, layer):
        super(MXNetNode, self).__init__(layer)


    @property
    def name(self):
        return self.layer["name"]


    @property
    def type(self):
        return self.layer["op"]


    @property
    def mx_layer(self):
        return self.layer


class MXNetGraph(GraphClass):

    def __init__(self, model):
        super(MXNetGraph, self).__init__(model)
        

    def build(self, json_data):

        self.input_layers = list()
        input_dict = dict() # dict{layer_num, layer_name}
        layer_num = -1

        import re

        for layer in json_data:

            layer_num += 1

            if re.search("_(weight|bias|var|mean|gamma|beta|label)", layer["name"]) and layer["op"] == "null":
                continue

            input_dict.update({layer_num: layer["name"]})
            self.layer_map[layer["name"]] = MXNetNode(layer)
            self.layer_name_map[layer["name"]] = layer["name"]
            for input_layer in layer["inputs"]:
                assert isinstance(input_layer, list)
                if input_layer[0] in input_dict:
                    pred = input_dict.get(input_layer[0])

                    if pred not in self.layer_map:
                        new_node = dict({'op': 'NoOp', 'name': pred, 'inputs': list()})
                        self.layer_map[pred] = MXNetNode(new_node)
                        self.layer_name_map[pred] = pred

                    self._make_connection(pred, layer["name"])

        super(MXNetGraph, self).build()
        
        # raise NotImplementedError("Cannot support multi-input")