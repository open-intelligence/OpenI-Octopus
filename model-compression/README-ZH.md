# **OPENI压缩**

## **介绍**

OPENI模型压缩是深度神经网络压缩的基础，包括剪枝，量化和编码。

## **参数**

- --model：模型名称（例如alexnet，vgg16）

### **量化参数**

- --quant_method：量化方法
- --bits：量化位宽
- --overflow_rate：溢流率

### **编码参数**

- --codec：编码或解码
- --coded：编码/解码文件

### **剪枝参数**

- --prune_method：剪枝方法
- --rate：剪枝率
- --epochs：重训次数
- --lr：学习率
- --lr_adjust：调整学习率的时期
- --layer_begin：剪枝开始层
- --layer_inter：剪枝两个内部层（vgg：2; resnet50：3; inception_v3：3）
- --layer_end：剪枝结束层（vgg：28; resnet50：156; inception_v3：287）
- --skip_downsample：跳过下采样层
- --save_dir：保存剪枝模型路径
- --eval：剪枝模型的测试路径

### **其他参数**

- --batch_size：批量大小
- --gpu：gpu的 ID
- --train_data_root：训练数据集
- --test_data_root：测试数据集
- --print-freq：打印频率

## **量化和编码**

### **例子**

#### **Vgg16 8bit量化和编码**

python main.py --model vgg16 --quant_method linear --codec encode --model_save ./vgg16.torch -coded ./vgg16_coded.pkl --batch_size 16 --bits 8

**Vgg16****解码**

python main.py --model vgg16 --codec decode --gpu 1 --model_save ./vgg16_de.torch --coded vgg16_coded.pkl

## **剪枝（包括重训）**

### **例子**

#### **Vgg16（剪枝率= 70％）**

python main.py --model vgg16 --prune_method norm2 --rate 0.7 --epss 12 --lr 0.001 --lr_adjust 3 --layer_begin 0 --layer_end 28 --layer_inter 2 --skip_downsample 1 --save_dir $ {dir to vgg16.torch} --batch_size 64 --gpu 1,2 --train_data_root $ {dir to train dataset} --test_data_root $ {dir to test dataset} --print-freq 400

#### **Vgg16型号测试**

python main.py --model vgg16 --eval $ {dir to best.vgg16.torch} --gpu 1,2

#### **结果**

##### **量化和编码**

| **网络**     | **位宽** | **TOP1精度** | **TOP5精度** | **型号尺寸** |
| ------------ | -------- | ------------ | ------------ | ------------ |
| VGG16        | 8        | 0.7157       | 0.9038       | 90.18MB      |
| ResNet18     | 8        | 0.6943       | 0.8891       | 6.26MB       |
| ResNet50     | 8        | 0.7573       | 0.9269       | 13.38MB      |
| Inception-V3 | 8        | 0.7645       | 0.9301       | 15.43MB      |

##### **剪枝**

| **网络**     | **修剪** | **TOP1精度** | **TOP5精度** |
| ------------ | -------- | ------------ | ------------ |
| VGG16        | 0.7      | 0.6765       | 0.8821       |
| ResNet50     | 0.7      | 0.7362       | 0.9177       |
| Inception-V3 | 0.7      | 0.7330       | 0.9183       |

 