# 简介

openi章鱼使用prometheus时序数据库获取和存储任务的性能指标

该部署Prometheus方案可以监控子任务Pod的指标如下:

1.CPU利用率

2.内存利用率

3.使用文件系统字节数

4.网络的I/O

5.英伟达GPU的利用率

6.英伟达GPU的显存利用率

# 方案

1. 创建一个K8s的用户角色，分配给Prometheus的pod

2. Prometheus有访问K8s集群中API Server的权限

3. 配置Prometheus监控K8s资源，endpoints/node/service/ingress/pod

4. 配置Prometheus每隔15s就会请求K8s APIServer获取k8s的资源请求，存储到时序数据库

5. 请求http://$APIServerIP:30003，可以查看Prometheus获取的指标情况

6. 要获取Pod的GPU使用情况，还要部署英伟达的pod-gpu-metrics-exporter

# 镜像

1. prometheus.deploy.yml => prom/prometheus:v2.0.0

2. pod-gpu-metrics-exporter-daemonset.yaml => nvidia/pod-gpu-metrics-exporter:v1.0.0-alpha

# 前提

1.Kubernetes version >= 1.13

2.如果默认系统K8s集群已经安装好![英伟达的K8s设备插件](https://github.com/NVIDIA/k8s-device-plugin)

3.设置多个节点的kubelet的Pod资源参数：

* vim /etc/default/kubelet
* 配置参数：KUBELET_EXTRA_ARGS=--feature-gates=KubeletPodResources=true
* sudo systemctl restart kubelet

4.给k8s节点node打label

kubectl label nodes <gpu-node-name> hardware-type=NVIDIAGPU

# 部署

1. cd openi

2. kubectl apply -f ./prometheus
