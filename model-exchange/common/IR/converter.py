from __future__ import absolute_import
from __future__ import division
from __future__ import print_function
from __future__ import unicode_literals

import sys
sys.path.append('./../')
from common.IR.model_pb2 import Model, Graph


class Converter(object):
    
    def __init__(self):
        self.IR_model = Model()
        # self.IR_model.Graph = Graph()
        self.IR_graph = self.IR_model.graph
        self.weight_loaded = False
        
        # name --> (weight_name --> ndarray)
        self.weights = dict()

        # next node
        self.next_node = dict()
        self.bias_num = 0
        # self.num_node = dict()


    @property
    def src_graph(self):
        return self.IR_graph
        # raise NotImplementedError        


    def get_son(self, name, path, set_flag = False):
        return self.src_graph.get_son(name, path, set_flag)


    def get_parent(self, name, path, set_flag = False):
        return self.src_graph.get_parent(name, path, set_flag)

    
    def set_weight(self, layer_name, weight_name, data):        
        if not layer_name in self.weights:
            self.weights[layer_name] = dict()
        layer = self.weights[layer_name]
        layer[weight_name] = data


    def save_to_json(self, filename):        
        import google.protobuf.json_format as json_format        
        json_str = json_format.MessageToJson(self.IR_model, preserving_proto_field_name = True)
        
        with open(filename, "w") as of:
            of.write(json_str)
        
        print ("IR network structure is saved as [{}].".format(filename))
        
        return json_str


    def save_to_proto(self, filename):
        proto_str = self.IR_model.SerializeToString()
        with open(filename, 'wb') as of:
            of.write(proto_str)

        print ("IR network structure is saved as [{}].".format(filename))
        
        return proto_str


    def save_weights(self, filename):
        if self.weight_loaded:
            import numpy as np
            for layer_name in self.weights:
                for name in self.weights[layer_name]:
                    print(layer_name, name, self.weights[layer_name][name].shape)
            with open(filename, 'wb') as of:
                np.save(of, self.weights)
            print ("IR weights are saved as [{}].".format(filename))

        else:
            print ("Warning: weights are not loaded.")
    
    
    def convert_inedge(self, source_node, IR_node, start_idx = 0, end_idx = None):

        if end_idx == None: end_idx = len(source_node.in_edges) 
        for idx in range(start_idx, end_idx):
            # print(source_node.in_edges[idx], IR_node.name, self.next_node)
            if source_node.in_edges[idx] in self.next_node:
                IR_node.input.append(self.next_node[source_node.in_edges[idx]])
                self.next_node.pop(source_node.in_edges[idx])
            else:
                IR_node.input.append(self.src_graph.get_node(source_node.in_edges[idx]).real_name)