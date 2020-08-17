import pickle
from dahuffman import HuffmanCodec
import torch
from collections import OrderedDict
import numpy as np

# encode
def encode(model, out_file = 'out.pkl'):
    print('Start encoding...')
    quanti_dic = OrderedDict()
    for k, v in model.state_dict().items():
        print(k)
        if 'running' in k or 'batches' in k:
            print("Ignoring {}".format(k))
            quanti_dic[k] = v
            continue
        else:
            layer_w = v.data.cpu().numpy().flatten()
            codec = HuffmanCodec.from_data(layer_w)
            encoded = codec.encode(layer_w)
            quanti_dic[k] = [encoded, codec]
    outfile = open(out_file, 'wb')
    pickle.dump(quanti_dic, outfile)
    outfile.close()
    print('Done. Save to {}'.format(out_file))
    

# decode
def decode(model, huffman_file = 'out.pkl', out_file = None):
    in_file = open(huffman_file, 'rb')
    in_dic = pickle.load(in_file)
    in_file.close()
    for k, v in in_dic.items():
        print(k)
        if isinstance(v,list):
            coded = v[0]
            codec = v[1]
            decode = codec.decode(coded)
            decode_np = np.array(decode)
            decode_torch = torch.from_numpy(decode_np)
            shape = model.state_dict()[k].shape
            torch_weight = decode_torch.reshape(shape)
            model.state_dict()[k].data.copy_(torch_weight)
        else:
            model.state_dict()[k].data.copy_(v)
    if out_file is not None:
        torch.save(model.state_dict(), out_file)
    return model
