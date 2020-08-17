# InfiniBand在K8S中的应用

pod通信要使用ib网络，需要把ib主机设备虚拟化多个，然后把ib虚拟设备挂载到pod中，现阶段支持两种模式：

## ib设备共享模式：Hca模式（HCA主机通道适配器)

1. 安装Hca模式的configMap, [参考](https://github.com/Mellanox/k8s-rdma-sriov-dev-plugin/blob/master/example/hca/rdma-hca-node-config.yaml)

2. 安装Mellanox device plugin, [参考](https://github.com/Mellanox/k8s-rdma-sriov-dev-plugin)

3. 如果节点有ib设备，K8s node默认会发现rdma/hca 设备，设备资源数量是1k个，Pod只需要挂载1个虚拟的rdma/hca设备就可以进行ib通信

## ib设备虚拟模式：SR-IO-V模式(Octopus支持)

先要配置物理节点，使得物理节点的ib主设备，在linux系统层就要虚拟化出虚拟的SR_IO_V模式的ib虚拟设备，1个主ib设备最多可以配置128个虚拟设备,[参考](http://note.youdao.com/noteshare?id=089ab40711392010891a50d524302554&sub=AC889D88459745E2AE589DE7197AB600)

1. `ibdev2netdev`，验证启动了多少个ib设备

2. `cat /sys/class/net/$Up_IB_NetDev/device/sriov_totalvfs`，该命令查看Up状态的ib网卡名字

利用Up状态的网卡名字验证该网卡对应的ib设备启动了多少个虚拟ib设备。

创建Sr-io-v模式的ConfigMap: kubectl apply -f rdma-sriov-node-config.yaml

```
apiVersion: v1
kind: ConfigMap
metadata:
name: rdma-devices
namespace: kube-system
data:
config.json: | {
"mode" : "sriov",
"pfNetdevices": [ " $Up状态的ib网卡名字 " ]
}
```

### 部署Mellanox device plugin

1. 到github官方仓库[下载代码](https://github.com/Mellanox/k8s-rdma-sriov-dev-plugin)

2. kubectl create -f example/device-plugin.yaml

执行 `k8s describe node $ibnode`，正常的话，节点会出现rdma/vhca设备数量 = 每个节点sriov模式的虚拟ib设备数量

部署pod, 分配rdma/vhca设备资源

## 相关文档

1. 如何安装IB驱动? [链接](https://www.mellanox.com/related-docs/prod_software/Mellanox_OFED_Linux_User_Manual_v4_5.pdf)

2. 官方教程如何在Linux系统层面配置虚拟化的IB设备（SRIOV虚拟设备）[链接](https://community.mellanox.com/s/article/kubernetes-ipoib-ethernet-rdma-sr-iov-networking-with-connectx4-connectx5)

3. K8s节点如何发现IB虚拟设备？[链接](https://github.com/Mellanox/k8s-rdma-sriov-dev-plugin)

4. 可以使用IB网络的分布式网络框架[链接](https://github.com/NVIDIA/nccl)