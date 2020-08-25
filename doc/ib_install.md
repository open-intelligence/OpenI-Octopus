# Use of InfiniBand in K8S

To use the IB network for pod communication, you need to virtualize multiple ib host devices, and then mount the ib virtual device to the pod. At this stage, two modes are supported:

## HCA mode

1. Install configMap in Hca mode, [reference](https://github.com/Mellanox/k8s-rdma-sriov-dev-plugin/blob/master/example/hca/rdma-hca-node-config.yaml)

2. Install Mellanox device plugin, [reference](https://github.com/Mellanox/k8s-rdma-sriov-dev-plugin)

3. If the node has an ib device, the K8s node will find rdma/hca devices by default, and the number of device resources is 1k. Pod only needs to mount a virtual rdma/hca device to communicate with ib.

## SRIOV mode(Octopus supported)

The physical node must be configured first, so that the ib master device of the physical node will be virtualized at the linux system layer to virtualize a virtual SR_IO_V mode ib virtual device. A master ib device can be configured with up to 128 virtual devices,[reference](http://note.youdao.com/noteshare?id=089ab40711392010891a50d524302554&sub=AC889D88459745E2AE589DE7197AB600)

1. `ibdev2netdev`，Verify how many ib devices are started.

2. `cat /sys/class/net/$Up_IB_NetDev/device/sriov_totalvfs`，The command to view the name of the ib network card in the Up state.

Use the name of the network card in the Up state to verify how many virtual ib devices are activated by the ib device corresponding to the network card.

Create Sr-io-v mode ConfigMap: kubectl apply -f rdma-sriov-node-config.yaml

```
apiVersion: v1
kind: ConfigMap
metadata:
name: rdma-devices
namespace: kube-system
data:
config.json: | {
"mode" : "sriov",
"pfNetdevices": [ " $Name of the ib network card in the Up state " ]
}
```

### Deploy Mellanox device plugin

1. [Download the code](https://github.com/Mellanox/k8s-rdma-sriov-dev-plugin)

2. kubectl create -f example/device-plugin.yaml

Execute `k8s describe node $ibnode`, if normal, the number of rdma/vhca devices on the node = the number of virtual ib devices in sriov mode for each node

Deploy pod, allocate rdma/vhca device resources.

## Related documents

1. How to install the IB driver? [Link](https://www.mellanox.com/related-docs/prod_software/Mellanox_OFED_Linux_User_Manual_v4_5.pdf)

2. The official tutorial how to configure a virtualized IB device (SRIOV virtual device) at the Linux system level. [Link](https://community.mellanox.com/s/article/kubernetes-ipoib-ethernet-rdma-sr-iov-networking-with-connectx4-connectx5)

3. How do K8s nodes discover IB virtual devices? [Link](https://github.com/Mellanox/k8s-rdma-sriov-dev-plugin)

4. Distributed network framework that can use IB network. [Link](https://github.com/NVIDIA/nccl)