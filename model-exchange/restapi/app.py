# -*- coding: UTF-8 -*-
from flask import Flask, render_template, request, jsonify, abort
from flask import make_response

import os
import sys
sys.path.append('./../')
from common.keras.keras_converter import KerasConverter
from common.mxnet.mxnet_converter import MxNetConverter
from common.mxnet.mxnet_recover import MXNetRecover
import common.pytorch as pt
os.environ["CUDA_VISIBLE_DEVICES"] = "0"

app = Flask(__name__)

@app.errorhandler(401)
def not_found(error):
    return make_response(jsonify({'error': 'Not found, 401'}), 401)


@app.route('/api/v1/exchange', methods=['POST'])
def open_exchange():
    # Check the params
    if not request.json:
        make_response(jsonify({'error': 'Wrong Paramters'}), 401)
    params =  request.json
    # Check the framwork
    framworks = ['MXNet', 'IR', 'Keras', 'PyTorch']
    if not params["destination_framework"] in framworks:
        make_response(jsonify({'error': params["destination_framework"] + 'not supported'}), 401)
    if not params["source_framework"] in framworks:
        make_response(jsonify({'error': params["source_framework"] + 'not supported'}), 401)

    if not 'model' in params:
        model = {
            'doc_url': 'http://arxiv.org/abs/1512.03385',
            'contributor_name': 'Kaiming He',
            'contributor_email': 'kaiminghe@fb.com',
            'contributor_institute': 'Facebook AI Research (FAIR), Menlo Park, CA',
            'framework_name': 'mxnet',
            'framework_version': '1.0.0',
            'model_name': 'ResNet-50',
            'model_version': '0.0.1',
            'version': '0.1.0'
        }
    else:
        params["model"].update({'version': '0.1.0'})
        model = params["model"]

    # source_framework to IR
    if params["destination_framework"] == "IR":
        params["input_shape"] = (3, 224, 224)
        if params["source_framework"] == "MXNet":
            if not os.path.exists(params['json_file_path']):
                return make_response(jsonify({'error': params["json_file_path"] + ' not exist'}), 401)
            if not os.path.exists(params['params_file_path']):
                return make_response(jsonify({'error': params["params_file_path"] + ' not exist'}), 401)
            args = ('IR', params['json_file_path'], params['params_file_path'], params['input_shape'], model)
            try:
                mxnet_model = MxNetConverter(args)
                mxnet_model.mxnet_to_IR()
                mxnet_model.save_to_json(params['output_path'] + "/open-exchange.json")
                mxnet_model.save_to_proto(params['output_path'] + "/open-exchange.pb")
                mxnet_model.save_weights(params['output_path'] + "/open-exchange.npy")
            except:
                return make_response(jsonify({'error': 'An error occurred during the conversion!'}), 401)
            
            response = { 
                'response' : params["source_framework"] + ' to ' + params["destination_framework"] + ' success!',
                "json_file_name": "open-exchange.json",
                "proto_file_name": "open-exchange.pb",
                "weights_file_name": "open-exchange.npy"
            }
        elif params["source_framework"] == "Keras":
            if not os.path.exists(params['json_file_path']):
                return make_response(jsonify({'error': params["json_file_path"] + ' not exist'}), 401)
            if not os.path.exists(params['model_file_path']):
                return make_response(jsonify({'error': params["model_file_path"] + ' not exist'}), 401)
            args = (params['json_file_path'], params['model_file_path'], model)
            try:
                mxnet_model = KerasConverter(args)
                mxnet_model.keras_to_IR()
                mxnet_model.save_to_json(params['output_path'] + "/open-exchange.json")
                mxnet_model.save_to_proto(params['output_path'] + "/open-exchange.pb")
                mxnet_model.save_weights(params['output_path'] + "/open-exchange.npy")
            except:
                return make_response(jsonify({'error': 'An error occurred during the conversion!'}), 401)
            
            response = { 
                'response' : params["source_framework"] + ' to ' + params["destination_framework"] + ' success!',
                "json_file_name": "open-exchange.json",
                "proto_file_name": "open-exchange.pb",
                "weights_file_name": "open-exchange.npy"
            }
        elif params["source_framework"] == "PyTorch":
            app.logger.info("I am in")
            if not os.path.exists(params['model_file_path']):
                return make_response(jsonify({'error': params["model_file_path"] + ' not exist'}), 401)
            try:
                parser = pt.PytorchParser(params['model_file_path'], params["input_shape"])
                parser.run(params['output_path'])
            except:
                return make_response(jsonify({'error': 'An error occurred during the conversion!'}), 401)
            
            response = { 
                'response' : params["source_framework"] + ' to ' + params["destination_framework"] + ' success!',
                "json_file_name": "open-exchange.json",
                "proto_file_name": "open-exchange.pb",
                "weights_file_name": "open-exchange.npy"
            }
        else:
            make_response(jsonify({'error': params["source_framework"] + ' not supported'}), 401)

    # IR (Intermediate Representation) to destination_framework
    else:
        if params["destination_framework"] == "MXNet":
            print(os.path.exists(params['params_file_path']))
            if not os.path.exists(params['params_file_path']):
                return make_response(jsonify({'error': params["params_file_path"] + ' not exist'}), 401)
            if not os.path.exists(params['proto_file_path']):
                return make_response(jsonify({'error': params["proto_file_path"] + ' not exist'}), 401)
            args = (params['proto_file_path'], params['params_file_path'], params['output_path'])
            try:
                mxnet_model = MXNetRecover(args)
                mxnet_model.IR_to_mxnet()
            except:
                return make_response(jsonify({'error': 'An error occurred during the conversion!'}), 401)
            
            response = { 
                'response' : params["source_framework"] + ' to ' + params["destination_framework"] + ' success!',
                "weights_file_name": "open-exchange.npy"
            }
        elif params["destination_framework"] == "PyTorch":
            if not os.path.exists(params['params_file_path']):
                return make_response(jsonify({'error': params["params_file_path"] + ' not exist'}), 401)
            if not os.path.exists(params['proto_file_path']):
                return make_response(jsonify({'error': params["proto_file_path"] + ' not exist'}), 401)
            try:
                recover = pt.PytorchEmitter((params['proto_file_path'], params['params_file_path']))
                file_path = os.path.join(params["output_path"],"pytorch_weights.npy")
                recover.run(None,file_path)
            except:
                return make_response(jsonify({'error': 'An error occurred during the conversion!'}), 401)
            
            response = { 
                'response' : params["source_framework"] + ' to ' + params["destination_framework"] + ' success!',
                "weights_file_name": "open-exchange.npy"
            }
        else:
            return make_response(jsonify({'error': params["source_framework"] + ' not supported'}), 401)

    return jsonify(response), 201

if __name__ == '__main__':
    app.run(debug=False, threaded=True, port=6023)
    # app.run(debug=True,port=6023)
