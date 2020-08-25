import argparse
import os
import torch, torchvision
import torch.nn as nn
import torch.backends.cudnn as cudnn
import torchvision.models as models
cudnn.benchmark =True
from collections import OrderedDict
from codec import huffman
from quantization import Qlinear
from prune import pruning
from utils import *

parser = argparse.ArgumentParser(description='AITISA PyTorch prune, quantization, codec baseline.')
# model parameters
parser.add_argument('--model', default='resnet18', help='Models in torchvision.models')
parser.add_argument('--weights', type=str, default=None, help='Use weights file for quantization')
parser.add_argument('--model_root', default='~/.torch/models/', help='Folder to load the pretrain model')
parser.add_argument('--model_save', default='./output_model.torch', help='File to save the output model')

# pruning parameters
parser.add_argument('--prune_method', type=str, default=None, help='norm2')
parser.add_argument('--rate', type=float, default=0.7, help='compress rate of model')
parser.add_argument('--epochs', default=12, type=int, metavar='N', help='number of total epochs to retrain')
parser.add_argument('--lr', '--learning-rate', default=0.001, type=float, metavar='LR', help='initial learning rate')
parser.add_argument('--lr_adjust', type=int, default=3, help='number of epochs that change learning rate')
parser.add_argument('--momentum', default=0.9, type=float, metavar='M', help='momentum')
parser.add_argument('--weight-decay', '--wd', default=1e-4, type=float, metavar='W', help='weight decay (default: 1e-4)')
parser.add_argument('--layer_begin', type=int, default=3, help='beginning pruning_layer of model')
parser.add_argument('--layer_end', type=int, default=3, help='ending pruning_layer of model')
parser.add_argument('--layer_inter', type=int, default=1, help='interval pruning_layers of model')
parser.add_argument('--skip_downsample', type=int, default=1, help='whether skip resnet downsample layers or not')
parser.add_argument('--save_dir', type=str, default='./save', help='Folder to save pruning checkpoints.')
parser.add_argument('--eval', type=str, default='', help='path to the model for evaling')

# quantizaton parameters
parser.add_argument('--quant_method', type=str, default=None, help='linear')
parser.add_argument('--bits', type=int, default=8, help='bit-width for parameters')
parser.add_argument('--overflow_rate', type=float, default=0.0, help='overflow rate')

# codec parameters
parser.add_argument('--codec', type=str, default=None, help='encode|decode')
parser.add_argument('--coded', type=str, default=None, help='Load or Save to the coded file')

# dataset parameters
parser.add_argument('--batch_size', type=int, default=64, help='Input batch size for test')
parser.add_argument('--train_data_root', default='/datasets/cluster/public/imagenet/ILSVRC2012_train', help='Folder of imagenet dataset')
parser.add_argument('--test_data_root', default='/datasets/cluster/public/imagenet/ILSVRC2012_val', help='Folder of imagenet dataset')
parser.add_argument('--input_size', type=int, default=224, help='input size of image')

# other
parser.add_argument('--gpu', type=str, default=None, help='Index of gpus to use')
parser.add_argument('--seed', type=int, default=76, help='Random seed (default: 76)')
parser.add_argument('--print-freq', '-p', default=400, type=int, metavar='N', help='print frequency (default: 400)')

args = parser.parse_args()

os.environ["CUDA_VISIBLE_DEVICES"] = args.gpu
args.input_size = 299 if 'inception' in args.model else args.input_size
assert args.quant_method in ['linear', None] 
print("=================FLAGS==================")
for k, v in args.__dict__.items():
    print('{}: {}'.format(k, v))
print("========================================")


torch.manual_seed(args.seed)


if args.weights is None:
    print('Using the pretrain model weights.')
    model = models.__dict__[args.model](pretrained=True)
else:
    model = models.__dict__[args.model](pretrained=False)
    model.load_state_dict(torch.load(args.weights))
    
if args.gpu is not None:
    assert torch.cuda.is_available(), 'no cuda available'
    torch.cuda.manual_seed(args.seed)
    if args.model.startswith('alexnet') or args.model.startswith('vgg'):
        model.features = torch.nn.DataParallel(model.features)
        model.cuda()
    else:
        model = torch.nn.DataParallel(model).cuda()

if args.eval:
    if os.path.isfile(args.eval):
        checkpoint = torch.load(args.eval)
        epoch = checkpoint['epoch']
        best_prec1 = checkpoint['best_prec1']
        model.load_state_dict(checkpoint['state_dict'])
        # optimizer.load_state_dict(checkpoint['optimizer'])
    else:
        pass
        
if not os.path.isdir(args.save_dir):
    os.makedirs(args.save_dir)

if args.prune_method == 'norm2':
    train_loader = train_data_loader(args.train_data_root, batch_size = args.batch_size,
                                    resize = args.input_size, workers = 2)
    test_loader = test_data_loader(args.test_data_root, batch_size = args.batch_size,
                                   resize = args.input_size, shuffle = False, workers = 2)
    criterion = nn.CrossEntropyLoss()
    optimizer = torch.optim.SGD(model.parameters(), args.lr,
                                momentum=args.momentum,
                                weight_decay=args.weight_decay,
                                nesterov=True)
    pruning.prune(model, compress_rate = args.rate, criterion = criterion, optimizer = optimizer,
                  train_loader = train_loader, test_loader = test_loader, arch = args.model, 
                  save_dir = args.save_dir, epochs = args.epochs, layer_begin = args.layer_begin, 
                  layer_end = args.layer_end, layer_inter = args.layer_inter, skip_downsample = args.skip_downsample,
                  learning_rate = args.lr, lr_adjust = args.lr_adjust, print_freq = args.print_freq)

if args.quant_method == 'linear':
    assert args.codec != 'decode', 'Can not quantize coded file.'
    Qlinear.linear(model, bits = args.bits, overflow_rate = args.overflow_rate, out_file = args.model_save)

if args.codec == 'encode':
    print('Please ensure that the input model has been quantized!')
    huffman.encode(model, out_file = args.coded)
elif args.codec == 'decode':
    huffman.decode(model, huffman_file = args.coded, out_file = args.model_save)

test_loader = test_data_loader(args.test_data_root, batch_size = args.batch_size , 
                    resize = args.input_size, shuffle = False, workers = 2)
test(model, test_loader, args.print_freq)
