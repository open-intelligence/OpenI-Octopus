# from keras.applications.resnet50 import ResNet50
# from keras.preprocessing import image
# from keras.applications.resnet50 import preprocess_input, decode_predictions
# import numpy as np

# model = ResNet50(weights='imagenet')

# json_string = model.to_json()

# with open('resnet-50-keras.json', "w") as of:
#     of.write(json_string)

# # model.save_to_json('resnet-50-keras.json')
# model.save_weights('resnet-50-keras.h5')

import os
import sys
sys.path.append('./../')
from common.keras.keras_converter import KerasConverter
# from common.keras.mxnet_recover import MXNetRecover

# Test for MxNetConverter
def Keras_Converter():

    json_file_path = "./lenet-keras.json"
    params_file_path = "./lenet-keras.h5"
    input_shape = (1, 28, 28)

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

    args = (json_file_path, params_file_path, model)
    mxnet_model = KerasConverter(args)
    mxnet_model.keras_to_IR()
    mxnet_model.save_to_json("lenet-keras-open-exchange.json")
    mxnet_model.save_to_proto("lenet-keras-open-exchange.pb")
    mxnet_model.save_weights("lenet-keras-open-exchange.npy")

    return


def Keras_Recover():
    pass

def main():
    Keras_Converter()
    # MXNet_Recover()

if __name__ == '__main__':
    main()