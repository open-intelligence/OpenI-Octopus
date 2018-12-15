from __future__ import absolute_import
from __future__ import division
from __future__ import print_function
from __future__ import unicode_literals

"""
IR Graph Class
"""

import os
import sys
import keras as _keras
from common.IR.graph import NodeClass, GraphClass

class KerasNode(NodeClass):

    def __init__(self, layer):
        super(KerasNode, self).__init__(layer)


    @property
    def name(self):
        return self.layer.name


    @property
    def type(self):
        return self.layer.__class__.__name__


    @property
    def keras_layer(self):
        return self.layer


class KerasGraph(GraphClass):

    def __init__(self, model):
        # super(KerasGraph, self).__init__(model)
        # sanity check.
        if not (type(model) == _keras.models.Sequential or type(model) == _keras.models.Model):
            raise TypeError("Keras layer of type %s is not supported." % type(model))
        super(KerasGraph, self).__init__(model)
        self.model = model

    def build(self):

        self.input_layers = list()
        for i, layer in enumerate(self.model.layers):
            self.layer_map[layer.name] = KerasNode(layer)
            self.layer_name_map[layer.name] = layer.name
            # if hasattr(layer, '_inbound_nodes'):
            for node in layer._inbound_nodes:
                # print (dir(node), type(node), type(layer))
                # assert False
                # for pred in node._inbound_nodes:
                for pred in node.inbound_layers:
                    if pred.name not in self.layer_map:
                        self.layer_map[pred.name] = KerasNode(pred)
                        self.layer_name_map[pred.name] = pred.name
                    self._make_connection(pred.name, layer.name)

        super(KerasGraph, self).build()
        
        # raise NotImplementedError("Cannot support multi-input")