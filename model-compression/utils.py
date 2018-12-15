import torch
import torchvision.transforms as transforms
import torchvision.datasets as datasets
import shutil

def train_data_loader(path, batch_size = 64, resize = 224, workers = 2):
    normalize = transforms.Normalize(mean=[0.485, 0.456, 0.406],
                                     std=[0.229, 0.224, 0.225])

    train_dataset = datasets.ImageFolder(
        path,
        transforms.Compose([
            transforms.RandomResizedCrop(resize),
            transforms.RandomHorizontalFlip(),
            transforms.ToTensor(),
            normalize,
        ]))

    train_loader = torch.utils.data.DataLoader(
        train_dataset, batch_size=batch_size, shuffle=True,
        num_workers=workers, pin_memory=True, sampler=None)
    return train_loader

def test_data_loader(path, batch_size = 64, resize = 256, shuffle = False, workers = 2):
    normalize = transforms.Normalize(mean=[0.485, 0.456, 0.406],
                                     std=[0.229, 0.224, 0.225])

    test_loader = torch.utils.data.DataLoader(
        datasets.ImageFolder(path, transforms.Compose([
            transforms.Resize(resize),
            transforms.CenterCrop(resize),
            transforms.ToTensor(),
            normalize,
        ])),
        batch_size=batch_size, shuffle=shuffle,
        num_workers=workers, pin_memory=True)
    return test_loader

class AverageMeter(object):
    """Computes and stores the average and current value"""
    def __init__(self):
        self.reset()

    def reset(self):
        self.val = 0
        self.avg = 0
        self.sum = 0
        self.count = 0

    def update(self, val, n=1):
        self.val = val
        self.sum += val * n
        self.count += n
        self.avg = self.sum / self.count
        
def accuracy(output, target, topk=(1,)):
    """Computes the precision@k for the specified values of k"""
    maxk = max(topk)
    batch_size = target.size(0)

    _, pred = output.topk(maxk, 1, True, True)
    pred = pred.t()
    correct = pred.eq(target.view(1, -1).expand_as(pred))

    res = []
    for k in topk:
        correct_k = correct[:k].view(-1).float().sum(0, keepdim=True)
        res.append(correct_k.mul_(100.0 / batch_size))
    return res

def adjust_learning_rate(learning_rate, lr_adjust, optimizer, epoch):
    """Sets the learning rate to the initial LR decayed by 10 every lr_adjust epochs"""
    lr = learning_rate * (0.1 **(epoch // lr_adjust))
    for param_group in optimizer.param_groups:
        param_group['lr'] = lr

def test(model, test_loader, print_freq):
    losses = AverageMeter()
    top1 = AverageMeter()
    top5 = AverageMeter()
    model.eval()
    for i, (data, target) in enumerate(test_loader):

        data = data.cuda(async=True)
        target = target.cuda(async=True)
        data_var = torch.autograd.Variable(data)
        target_var = torch.autograd.Variable(target)
        output = model(data_var)

        prec1, prec5 = accuracy(output.data, target, topk=(1, 5))
        top1.update(prec1[0], data.size(0))
        top5.update(prec5[0], data.size(0))
        if i % print_freq == 0:
            print('Test: [{0}/{1}]\t'
                  'Prec@1 {top1.val:.3f} ({top1.avg:.3f})\t'
                  'Prec@5 {top5.val:.3f} ({top5.avg:.3f})'.format(
                i, len(test_loader), top1=top1, top5=top5))
    print(' Prec@1 {top1.avg:.3f} Prec@5 {top5.avg:.3f} '.format(top1=top1, top5=top5))
    return top1.avg

def save_checkpoint(state, is_best, filename, bestname):
    torch.save(state, filename)
    if is_best:
        shutil.copyfile(filename, bestname)