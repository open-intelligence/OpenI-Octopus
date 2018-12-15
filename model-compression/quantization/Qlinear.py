import torch
from torch.autograd import Variable
import math

def linear(model, bits, overflow_rate = 0, out_file = None):
    assert 1<=bits<=32, bits
    print('Start linear quantization.')
    for k, v in model.state_dict().items():
        print(k)
        if 'running' in k or 'batches' in k:
            continue
        else:
            sf = bits - 1. - compute_integral_part(v, overflow_rate=overflow_rate)
            v_quant  = linear_quantize(v, sf, bits=bits)
            v.data.copy_(v_quant)# 复制 model.state_dict()[k]
    if out_file is not None:
        torch.save(model.state_dict(), out_file)

def compute_integral_part(input, overflow_rate):
    abs_value = input.abs().view(-1)
    sorted_value = abs_value.sort(dim=0, descending=True)[0]
    split_idx = int(overflow_rate * len(sorted_value))
    v = sorted_value[split_idx]
    if isinstance(v, Variable):
        v = v.data.cpu().numpy()
    sf = math.ceil(math.log2(v+1e-12))
    return sf

def linear_quantize(input, sf, bits):
    assert bits >= 1, bits
    if bits == 1:
        return torch.sign(input) - 1
    delta = math.pow(2.0, -sf)
    bound = math.pow(2.0, bits-1)
    min_val = - bound
    max_val = bound - 1
    rounded = torch.floor(input / delta + 0.5)

    clipped_value = torch.clamp(rounded, min_val, max_val) * delta
    return clipped_value