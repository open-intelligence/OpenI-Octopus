import torch
import os
from utils import *
import numpy as np

def prune(model, compress_rate, criterion, optimizer, train_loader, test_loader, arch, save_dir, epochs,
layer_begin, layer_end, layer_inter, skip_downsample, learning_rate, lr_adjust, print_freq):
    best_prec1 = 0
    filename = os.path.join(save_dir, 'checkpoint.{}_{}.torch'.format(arch, compress_rate))
    bestname = os.path.join(save_dir, 'best.{}_{}.torch'.format(arch, compress_rate))

    # val_acc_1 = test(model, test_loader, print_freq)
    # print(">>>>> accu before is: {:}".format(val_acc_1))

    m = Prune(model, layer_begin, layer_end, layer_inter, arch, skip_downsample)
    m.if_zero()
    prune_dict = m.get_prune_dict(compress_rate)
    print(prune_dict)
    m.prune_(compress_rate)
    m.if_zero()
    model = m.model

    # val_acc_2 = test(model, test_loader, print_freq)
    # print(">>>>> accu after is: {:}".format(val_acc_2))

    for epoch in range(epochs):
        adjust_learning_rate(learning_rate, lr_adjust, optimizer, epoch)

        # train for one epoch
        train(model, train_loader, criterion, optimizer, epoch, print_freq, prune_dict)
        m.model = model
        m.if_zero() # check the result
        # evaluate on validation set
        val_acc_2 = test(model, test_loader, print_freq)
        print(">>>>> accu is: {:}".format(val_acc_2))
        # remember best prec@1 and save checkpoint
        is_best = val_acc_2 > best_prec1
        best_prec1 = max(val_acc_2, best_prec1)
        save_checkpoint({
            'epoch': epoch + 1,
            'arch': arch,
            'state_dict': model.state_dict(),
            'best_prec1': best_prec1,
            # 'optimizer': optimizer.state_dict(),
        }, is_best, filename, bestname)

    model.load_state_dict(torch.load(bestname)['state_dict'])

class Prune:
    def __init__(self, model, layer_begin, layer_end, layer_inter, arch, skip_downsample):
        self.model = model
        self.layer_begin = layer_begin
        self.layer_end = layer_end
        self.layer_inter = layer_inter
        self.arch = arch
        self.skip_downsample = skip_downsample
        self.compress_rate = {}  # {ind:rate}
        self.mask_index = []     # [index of prune layer]

    # self.compress_rate/ self.mask_index
    def init_rate(self, layer_rate):
        for index, item in enumerate(self.model.parameters()):
            self.compress_rate[index] = 1
        for key in range(self.layer_begin, self.layer_end + 1, self.layer_inter):
            self.compress_rate[key] = layer_rate
        skip_list = []
        if self.arch == 'resnet18':
            # last index include last fc layer
            last_index = 60
            skip_list = [21, 36, 51]
        elif self.arch == 'resnet34':
            last_index = 108
            skip_list = [27, 54, 93]
        elif self.arch == 'resnet50':
            last_index = 159
            skip_list = [12, 42, 81, 138]
        elif self.arch == 'resnet101':
            last_index = 312
            skip_list = [12, 42, 81, 291]
        elif self.arch == 'resnet152':
            last_index = 465
            skip_list = [12, 42, 117, 444]
        elif self.arch == 'vgg16':
            last_index = 30
            pass
        elif self.arch == 'inception_v3':
            last_index = 290
            pass
        self.mask_index = [x for x in range(self.layer_begin, self.layer_end + 1, self.layer_inter)]
        # skip downsample layer
        if self.skip_downsample:
            for x in skip_list:
                self.compress_rate[x] = 1
                self.mask_index.remove(x)
        else:
            pass

    def get_prune_dict(self, layer_rate):
        self.init_rate(layer_rate)
        prune_dict = {}
        for index, item in enumerate(self.model.parameters()):
             if (index in self.mask_index):
                filter_pruned_num = int(item.data.size()[0] * (1 - self.compress_rate[index]))
                weight_vec = item.data.view(item.data.size()[0], -1)
                norm2 = torch.norm(weight_vec, 2, 1)
                norm2_np = norm2.cpu().numpy()
                prune_index = norm2_np.argsort()[:filter_pruned_num]
                prune_dict[index] = prune_index
        return prune_dict

    def prune_(self, layer_rate):
        prune_dict = self.get_prune_dict(layer_rate)
        for index, item in enumerate(self.model.parameters()):
            if (index in self.mask_index):
                prune_index = prune_dict[index]
                for prune_ind in prune_index:
                    item.data[prune_ind].zero_()

        print("Prune Done")

    # compute number of nonzero and zero/ frozen index
    def if_zero(self):
        for index, item in enumerate(self.model.parameters()):
            if index in [x for x in range(self.layer_begin, self.layer_end + 1, self.layer_inter)]:
                a = item.data.view(-1)
                b = a.cpu().numpy()
                c = item.data.view(item.data.size()[0], -1)
                frozen_index = []
                for ind, param in enumerate(c.cpu().numpy()):
                    if not param.any():
                        frozen_index.append(ind)

                print("layer: %d, number of nonzero weight is %d, zero is %d" % (
                    index, np.count_nonzero(b), len(b) - np.count_nonzero(b)))
                print("layer: {}, frozen_index is {}".format(index, frozen_index))

def train(model, train_loader, criterion, optimizer, epoch, print_freq, prune_dict):
    losses = AverageMeter()
    top1 = AverageMeter()
    top5 = AverageMeter()
    # switch to train mode
    model.train()
    for i, (input, target) in enumerate(train_loader):
        target = target.cuda()
        input = input.cuda()

        # compute output
        output = model(input)

        loss = None
        prec1 = None
        prec5 = None
        # for nets that have multiple outputs such as inception
        if isinstance(output, tuple):
            loss = sum((criterion(out, target) for out in output))
            prec1, prec5 = accuracy(output[0], target, topk=(1, 5))
        else:
            loss = criterion(output, target)
            prec1, prec5 = accuracy(output, target, topk=(1, 5))
        losses.update(loss.item(), input.size(0))
        top1.update(prec1[0], input.size(0))
        top5.update(prec5[0], input.size(0))

        # compute gradient and do SGD step        
        optimizer.zero_grad()
        loss.backward()
        # freeze grad
        for index, item in enumerate(model.parameters()):
            if index in prune_dict.keys():
                prune_index = prune_dict[index]
                for prune_ind in prune_index:
                    item.grad.data[prune_ind].zero_()
        optimizer.step()

        if i % print_freq == 0:
            print('Epoch: [{0}][{1}/{2}]\t'
                      'Loss {loss.val:.4f} ({loss.avg:.4f})\t'
                      'Prec@1 {top1.val:.3f} ({top1.avg:.3f})\t'
                      'Prec@5 {top5.val:.3f} ({top5.avg:.3f})'.format(
                epoch, i, len(train_loader), loss=losses, top1=top1, top5=top5))
    