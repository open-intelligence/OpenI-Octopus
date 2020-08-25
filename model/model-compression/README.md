# OPENI compression

## Introduction

This is the baseline of deep neural networks compression, including prune, quantization and encoding.

## Parameters

- `--model`: Name of the model (eg. alexnet, vgg16)

### Quantization Parameters
- `--quant_method`: method of quantization
- `--bits`: quantization bit width
- `--overflow_rate`: overflow rate

### Encoding Parameters
- `--codec`: encode or decode
- `--coded`: encode/decode file

### Prune Parameters
- `--prune_method`: method of prune
- `--rate`: prune rate
- `--epochs`: retrain epochs
- `--lr`: learning rate
- `--lr_adjust`: epochs of adjusting learning rate
- `--layer_begin`: the beginning layer for prune
- `--layer_inter`: internal of two prune (vgg:2; resnet50:3; inception_v3:3)
- `--layer_end`: the end layer for prune (vgg:28; resnet50:156; inception_v3:287)
- `--skip_downsample`: skip downsample layer
- `--save_dir`: save path to pruned model
- `--eval`: test path for pruned model


### Other Parameters
- `--batch_size`: batch size
- `--gpu`: gpu ID
- `--train_data_root`: dataset for train
- `--test_data_root`: dataset for test
- `--print-freq`: print frequency

## Quantization and Encoding

### Examples

#### Vgg16 8bit quantization and encoding
```shell
python main.py --model vgg16 --quant_method linear --codec encode --model_save ./vgg16.torch -coded ./vgg16_coded.pkl --batch_size 16 --bits 8
```


#### Vgg16 decoding
```shell
python main.py --model vgg16 --codec decode --gpu 1 --model_save ./vgg16_de.torch --coded vgg16_coded.pkl
```


## Prune(including retrain)

### Examples

#### Vgg16 (pruning rate=70%)
```shell
python main.py --model vgg16 --prune_method norm2 --rate 0.7 --epochs 12 --lr 0.001 --lr_adjust 3 --layer_begin 0 --layer_end 28 --layer_inter 2 --skip_downsample 1 --save_dir ${dir to vgg16.torch} --batch_size 64 --gpu 1,2 --train_data_root ${dir to train dataset} --test_data_root ${dir to test dataset} --print-freq 400
```

#### Vgg16 model test
```shell
python main.py --model vgg16 --eval ${dir to best.vgg16.torch} --gpu 1,2
```

## Results

### Quantization and Encoding
network | bit-width | top1-accuracy | top5-accuracy | model size |
--------|-----------|---------------|---------------|------------| 
VGG16 | 8 | 0.7157 | 0.9038	| 90.18MB |
ResNet18 | 8 | 0.6943 | 0.8891	| 6.26MB | 
ResNet50 | 8 | 0.7573 | 0.9269 | 13.38MB | 
Inception-v3 | 8 | 0.7645 | 0.9301 | 15.43MB | 


### Prune
network | prune | top1-accuracy | top5-accuracy |
--------|---------------|---------------|---------------|
VGG16 | 0.7 | 0.6765 | 0.8821	|
ResNet50 | 0.7 | 0.7362 | 0.9177 | 
Inception-v3 | 0.7 | 0.7330 | 0.9183 | 