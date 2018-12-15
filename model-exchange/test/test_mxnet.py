
import os
import sys
sys.path.append('./../')
from common.mxnet.mxnet_converter import MxNetConverter
from common.mxnet.mxnet_recover import MXNetRecover

# Test for MxNetConverter
def MXNet_Converter():
    # json_file_path = "../common/mxnet/model/resnet-50-symbol.json"
    # params_file_path = "../common/mxnet/model/resnet-50-0000.params"
    # input_shape = (3, 224, 224)

    # model = {
    #     'doc_url': 'http://arxiv.org/abs/1512.03385',
    #     'contributor_name': 'Kaiming He',
    #     'contributor_email': 'kaiminghe@fb.com',
    #     'contributor_institute': 'Facebook AI Research (FAIR), Menlo Park, CA',
    #     'framework_name': 'mxnet',
    #     'framework_version': '1.0.0',
    #     'model_name': 'ResNet-50',
    #     'model_version': '0.0.1',
    #     'version': '0.1.0'
    # } 

    # args = ('IR', json_file_path, params_file_path, input_shape, model)
    # mxnet_model = MxNetConverter(args)
    # mxnet_model.mxnet_to_IR()
    # mxnet_model.save_to_json("resnet-50-open-exchange.json")
    # mxnet_model.save_to_proto("resnet-50-open-exchange.pb")
    # mxnet_model.save_weights("resnet-50-open-exchange.npy")


    # json_file_path = "../common/mxnet/model/resnet-152-symbol.json"
    # params_file_path = "../common/mxnet/model/resnet-152-0000.params"
    # input_shape = (3, 224, 224)

    # model = {
    #     'doc_url': 'http://arxiv.org/abs/1512.03385',
    #     'contributor_name': 'Kaiming He',
    #     'contributor_email': 'kaiminghe@fb.com',
    #     'contributor_institute': 'Facebook AI Research (FAIR), Menlo Park, CA',
    #     'framework_name': 'mxnet',
    #     'framework_version': '1.0.0',
    #     'model_name': 'ResNet-152',
    #     'model_version': '0.0.1',
    #     'version': '0.1.0'
    # } 

    # args = ('IR', json_file_path, params_file_path, input_shape, model)
    # mxnet_model = MxNetConverter(args)
    # mxnet_model.mxnet_to_IR()
    # mxnet_model.save_to_json("resnet-152-open-exchange.json")
    # mxnet_model.save_to_proto("resnet-152-open-exchange.pb")
    # mxnet_model.save_weights("resnet-152-open-exchange.npy")


    # json_file_path = "../common/mxnet/model/caffenet-symbol.json"
    # params_file_path = "../common/mxnet/model/caffenet-0000.params"
    # input_shape = (3, 224, 224)

    # model = {
    #     'doc_url': 'http://papers.nips.cc/paper/4824-imagenet-classification-with-deep-convolutional-neural-networks',
    #     'contributor_name': 'Alex Krizhevsky',
    #     'contributor_email': 'kriz@cs.utoronto.ca',
    #     'contributor_institute': 'University of Toronto',
    #     'framework_name': 'mxnet',
    #     'framework_version': '1.0.0',
    #     'model_name': 'CaffeNet',
    #     'model_version': '0.0.1',
    #     'version': '0.1.0'
    # } 

    # args = ('IR', json_file_path, params_file_path, input_shape, model)
    # mxnet_model = MxNetConverter(args)
    # mxnet_model.mxnet_to_IR()
    # mxnet_model.save_to_json("caffenet-open-exchange.json")
    # mxnet_model.save_to_proto("caffenet-open-exchange.pb")
    # mxnet_model.save_weights("caffenet-open-exchange.npy")


    # json_file_path = "../common/mxnet/model/Inception-BN-symbol.json"
    # params_file_path = "../common/mxnet/model/Inception-BN-0126.params"
    # input_shape = (3, 224, 224)

    # model = {
    #     'doc_url': 'https://arxiv.org/pdf/1512.00567.pdf',
    #     'contributor_name': 'Christian Szegedy',
    #     'contributor_email': 'szegedy@google.com',
    #     'contributor_institute': 'Google Inc',
    #     'framework_name': 'mxnet',
    #     'framework_version': '1.0.0',
    #     'model_name': 'Inception v3 w/BatchNorm',
    #     'model_version': '0.0.1',
    #     'version': '0.1.0'
    # } 

    # args = ('IR', json_file_path, params_file_path, input_shape, model)
    # mxnet_model = MxNetConverter(args)
    # mxnet_model.mxnet_to_IR()
    # mxnet_model.save_to_json("Inception-BN-open-exchange.json")
    # mxnet_model.save_to_proto("Inception-BN-open-exchange.pb")
    # mxnet_model.save_weights("Inception-BN-open-exchange.npy")


    # json_file_path = "../common/mxnet/model/nin-symbol.json"
    # params_file_path = "../common/mxnet/model/nin-0000.params"
    # input_shape = (3, 224, 224)

    # model = {
    #     'doc_url': 'https://arxiv.org/pdf/1312.4400v3.pdf',
    #     'contributor_name': 'Min Lin',
    #     'contributor_email': 'linmin@nus.edu.sg',
    #     'contributor_institute': 'Graduate School for Integrative Sciences and Engineering',
    #     'framework_name': 'mxnet',
    #     'framework_version': '1.0.0',
    #     'model_name': 'Network in Network (NiN)',
    #     'model_version': '0.0.1',
    #     'version': '0.1.0'
    # } 

    # args = ('IR', json_file_path, params_file_path, input_shape, model)
    # mxnet_model = MxNetConverter(args)
    # mxnet_model.mxnet_to_IR()
    # mxnet_model.save_to_json("nin-open-exchange.json")
    # mxnet_model.save_to_proto("nin-open-exchange.pb")
    # mxnet_model.save_weights("nin-open-exchange.npy")


    json_file_path = "../common/mxnet/model/vgg16-symbol.json"
    params_file_path = "../common/mxnet/model/vgg16-0000.params"
    input_shape = (3, 224, 224)

    model = {
        'doc_url': 'https://arxiv.org/pdf/1409.1556v6.pdf',
        'contributor_name': 'Karen Simonyan',
        'contributor_email': 'karen@robots.ox.ac.uk',
        'contributor_institute': 'Visual Geometry Group, Department of Engineering Science, University of Oxford',
        'framework_name': 'mxnet',
        'framework_version': '1.0.0',
        'model_name': 'VGG16',
        'model_version': '0.0.1',
        'version': '0.1.0'
    } 

    args = ('IR', json_file_path, params_file_path, input_shape, model)
    mxnet_model = MxNetConverter(args)
    mxnet_model.mxnet_to_IR()
    mxnet_model.save_to_json("vgg16-open-exchange.json")
    mxnet_model.save_to_proto("vgg16-open-exchange.pb")
    mxnet_model.save_weights("vgg16-open-exchange.npy")

    json_file_path = "../common/mxnet/model/vgg19-symbol.json"
    params_file_path = "../common/mxnet/model/vgg19-0000.params"
    input_shape = (3, 224, 224)

    model = {
        'doc_url': 'https://arxiv.org/pdf/1409.1556v6.pdf',
        'contributor_name': 'Karen Simonyan',
        'contributor_email': 'karen@robots.ox.ac.uk',
        'contributor_institute': 'Visual Geometry Group, Department of Engineering Science, University of Oxford',
        'framework_name': 'mxnet',
        'framework_version': '1.0.0',
        'model_name': 'VGG19',
        'model_version': '0.0.1',
        'version': '0.1.0'
    } 

    args = ('IR', json_file_path, params_file_path, input_shape, model)
    mxnet_model = MxNetConverter(args)
    mxnet_model.mxnet_to_IR()
    mxnet_model.save_to_json("vgg19-open-exchange.json")
    mxnet_model.save_to_proto("vgg19-open-exchange.pb")
    mxnet_model.save_weights("vgg19-open-exchange.npy")

    # json_file_path = "./lenet-symbol.json"
    # params_file_path = "./lenet-0020.params"
    # input_shape = (1, 28, 28)

    # model = {
    #     'doc_url': 'https://pdfs.semanticscholar.org/943d/6db0c56a5f4d04a3f81db633fec7cc4fde0f.pdf',
    #     'contributor_name': 'Yann LeCun',
    #     'contributor_email': 'yann@research.att.com',
    #     'contributor_institute': 'AT&T Bel l Laboratories',
    #     'framework_name': 'mxnet',
    #     'framework_version': '1.0.0',
    #     'model_name': 'LeNet-5',
    #     'model_version': '0.0.1',
    #     'version': '0.1.0'
    # } 

    # args = ('IR', json_file_path, params_file_path, input_shape, model)
    # mxnet_model = MxNetConverter(args)
    # mxnet_model.mxnet_to_IR()
    # mxnet_model.save_to_json("lenet-open-exchange.json")
    # mxnet_model.save_to_proto("lenet-open-exchange.pb")
    # mxnet_model.save_weights("lenet-open-exchange.npy")


    # json_file_path = "./mlp-symbol.json"
    # params_file_path = "./mlp-0020.params"
    # input_shape = (1, 28, 28)

    # model = {
    #     'doc_url': 'https://pdfs.semanticscholar.org/943d/6db0c56a5f4d04a3f81db633fec7cc4fde0f.pdf',
    #     'contributor_name': 'Yann LeCun',
    #     'contributor_email': 'yann@research.att.com',
    #     'contributor_institute': 'AT&T Bel l Laboratories',
    #     'framework_name': 'mxnet',
    #     'framework_version': '1.0.0',
    #     'model_name': 'mlp',
    #     'model_version': '0.0.1',
    #     'version': '0.1.0'
    # } 

    # args = ('IR', json_file_path, params_file_path, input_shape, model)
    # mxnet_model = MxNetConverter(args)
    # mxnet_model.mxnet_to_IR()
    # mxnet_model.save_to_json("mlp-open-exchange.json")
    # mxnet_model.save_to_proto("mlp-open-exchange.pb")
    # mxnet_model.save_weights("mlp-open-exchange.npy")


def MXNet_Recover():
    json_file_path = "./lenet-keras-open-exchange.json"
    protobuf_file_path = "./lenet-keras-open-exchange.pb"
    params_file_path = "./lenet-keras-open-exchange.npy"
    weights_output_path = "./lenet-keras-recover.params"
    input_shape = (1, 28, 28)

    args = (protobuf_file_path, params_file_path, weights_output_path)
    mxnet_model = MXNetRecover(args)
    mxnet_model.IR_to_mxnet()
    # mxnet_model.save_code("lenet-open-exchange.json")
    # mxnet_model.save_to_proto("lenet-open-exchange.pb")
    # mxnet_model.save_weights("lenet-open-exchange.npy")


    # json_file_path = "./mlp-open-exchange.json"
    # protobuf_file_path = "./mlp-open-exchange.pb"
    # params_file_path = "./mlp-open-exchange.npy"
    # weights_output_path = "./mlp-0020-recover.params"
    # input_shape = (1, 28, 28)

    # args = (protobuf_file_path, params_file_path, weights_output_path)
    # mxnet_model = MXNetRecover(args)
    # mxnet_model.IR_to_mxnet()

def main():
    MXNet_Converter()
    # MXNet_Recover()

if __name__ == '__main__':
    main()