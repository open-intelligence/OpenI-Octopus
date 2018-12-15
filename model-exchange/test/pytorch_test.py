import os
import sys
sys.path.append('./../')
import common.pytorch as pt 
import torch
import torchvision

def main():
    #define the imagenet resnet50
    ori_save_pth = '/gmodel/admin/PyTorch_IR/vv1/resnet50.pth'
   # model = torchvision.models.resnet50(pretrained=True)
   # torch.save(model, ori_save_pth)

    #convert pytorch to IR
    IR_pth = "log"
    parser = pt.PytorchParser(ori_save_pth, [3,224,224])
    parser.run(IR_pth)
 
    #from IR generate pytorch code 
   # IR_pb = IR_pth + ".pb"
   # IR_npy = IR_pth + ".npy"
   # pytorch_code = "log/pytorch_code.py"
   # pytorch_npy = "log/pytorch_weights.npy"
   # recover = pt.PytorchEmitter((IR_pb, IR_npy))
   # recover.run(pytorch_code, pytorch_npy)

    #from pytorch code generate pytorch model
   # pytorch_d_pth = "log/pytorch_model.pth"
   # name = "model"
   # import imp
   # MainModel = imp.load_source(name, pytorch_code) 
   # pt.save_model(MainModel, pytorch_code, pytorch_npy, pytorch_d_pth)

    #test the generated pytorch pth
   # dummy_input = torch.autograd.Variable(torch.randn([1,3,224,224]), requires_grad=False)
   # output_converted = torch.load(pytorch_d_pth)(dummy_input)
   # output_original = torch.load(ori_save_pth)(dummy_input)
   # distance = torch.nn.functional.pairwise_distance(output_converted, output_original)
   # print("Distance between output tensors of reconstructed model and original one is "+ str(distance.item()))
   # cos_sim = torch.nn.functional.cosine_similarity(output_converted, output_original)
   # print("cosine similarity between output tensors of reconstructed model and original one is "+ str(cos_sim.item()))

if __name__ == '__main__':
    main()
