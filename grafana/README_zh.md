# 简介

openi章鱼使用grafana展示子任务的性能指标

# 指标细节

## grafana配置prometheus(k8s service访问地址：http://prometheus:9090)为数据源

背景知识：

本文的是云脑监控指标的一份描述，具体开发接口不强制约定，请先阅读开源监控系统Prometheus中的一些概念
https://www.jianshu.com/p/a52fd5ec2713

Prometheus的Guage类型指标返回格式。

格式如下：

metricName{key1=value1,key2=value2,...} metricValue


可以参考英伟达如何在k8s监控gpu指标的一个github例子：

https://github.com/NVIDIA/gpu-monitoring-tools/tree/master/exporters/prometheus-dcgm

Guage类型指标总体分为三部分：

1. **metricName**：是一类性能指标的名字

2. **{key1=value1,key2=value2,...}**: 是一连串的键值对，大括号包住，表示在metricName相同情况下，同一类性能指标里也能表示不同的曲线，是一个曲线族的概念。

3. **metricValue**: Guage指标的具体值，指标接口返回的瞬间值。


-------以下为云脑的Prometheus数据库主动向不同的监控服务获取的一些指标-------


#### 1. 节点数量（整数）

```
使用指标名：kubelet_node_config_error

含义：节点配置是否有错误

关键键值对：

{instance=~".+"}

instance代表节点名字
```

```
统计含义：统计有多少个节点配置错误指标族中的指标个数 = 节点数量

节点数量——Prometheus查询语句：

count(kubelet_node_config_error{instance=~".+"})

```

#### 2. 集群GPU总数（整数）

```
使用指标名：dcgm_gpu_temp

含义：NVIDIA Data Center GPU Manager返回每个gpu的温度指标

关键键值对：

{uuid=~".+"}

uuid代表gpu的uuid

```
```

统计含义：统计gpu的温度指标族中的指标个数 = gpu总数

集群GPU总数——Prometheus查询语句：

count(dcgm_gpu_temp{uuid=~".+"})


```

#### 3. 集群活动的GPU数（整数）

```
使用指标名：dcgm_gpu_utilization

含义：NVIDIA Data Center GPU Manager返回每个gpu的使用率指标

关键键值对：

{pod_name=~".+"}

pod_name代表在k8s系统中英伟达gpu被k8s的pod占用，如果没有一个gpu被使用，搜索到的指标数量为null

```
```
统计含义：统计与pod_name配对的gpu使用率指标族中的指标个数

与pod_name配对的gpu使用率指标族中的指标个数 = 集群活动的GPU数

集群活动的GPU数—Prometheus查询语句：

count(dcgm_gpu_utilization{pod_name=~".+"} or vector(0))-1

（如果与pod_name配对的gpu使用率指标的个数为0，会返回null，由于Prometheus的null不能计算。为了计算，使用vector(0)模拟1个空指标，统计数为1，然后-1 = 0个正在使用的GPU数量）

```

#### 4. 集群GPU占用率（%）

（集群活动的GPU数量 / 集群GPU总数）* 100

#### 5. 集群活动GPU的平均使用率（%）

```
使用指标名：dcgm_gpu_utilization (单位：%)

含义：NVIDIA Data Center GPU Manager返回每个gpu的使用率指标

关键键值对：

{pod_name=~".+"}

pod_name代表在k8s系统中英伟达gpu被k8s的pod占用，如果没有一个gpu被使用，搜索到的指标数量为null

所有带有pod_name键的GPU使用率指标，都是活动的GPU使用率指标。对应的值就是每个活动GPU的使用率


```
```


统计含义：集群活动GPU平均使用率 = 每个活动GPU的使用率的和 / 集群活动GPU数量

集群活动GPU平均使用率—Prometheus查询语句：

sum(dcgm_gpu_utilization{pod_name=~".+"}or vector(0)) / count(dcgm_gpu_utilization{pod_name=~".+"} or vector(0))


（如果与pod_name配对的gpu使用率指标的个数为0，会返回null，由于Prometheus的null不能计算。如果为null为了计算，使用vector(0)模拟1个空指标，统计数为1。0/1 = 0 ）

```

#### 6. 集群活动GPU的平均显存使用率（%）

```
使用指标名：dcgm_mem_copy_utilization (单位：%)

含义：NVIDIA Data Center GPU Manager返回每个gpu的显存使用率指标

关键键值对：

{pod_name=~".+"}

pod_name代表在k8s系统中英伟达gpu被k8s的pod占用，如果没有一个gpu被使用，搜索到的指标数量为null

所有带有pod_name键的GPU的显存使用率指标，都是活动的GPU使用率指标。对应的值就是每个活动GPU的显存使用率

```
```


统计含义：集群活动GPU平均显存使用率 = 每个活动GPU的显存使用率的和 / 集群活动GPU数量

集群活动GPU平均显存使用率——Prometheus查询语句：

sum(dcgm_mem_copy_utilization{pod_name=~".+"} or vector(0)) / count(dcgm_gpu_utilization{pod_name=~".+"} or vector(0))

（如果与pod_name配对的gpu显存使用率指标的个数为0，会返回null，由于Prometheus的null不能计算。如果为null为了计算，使用vector(0)模拟1个空指标，统计数为1。0/1 = 0 ）

```

#### 7. 集群网络接收率（单位 byte/s）

```
使用指标名：container_network_receive_bytes_total（单位bytes）

含义：哪个容器的从哪个节点，哪个网卡中接收的总字节数

关键键值对：

{kubernetes_io_hostname=~"^$Node$"}

kubernetes_io_hostname代表节点名字

```

```

统计含义：前1分钟内，平均每秒所有节点内所有容器接收的总字节数的和

集群网络接收率——Prometheus查询语句：

sum (rate (container_network_receive_bytes_total{kubernetes_io_hostname=~"^$Node$"}[1m]))

```

#### 8. 集群网络发送率 （单位 byte/s）

 ```
使用指标名：container_network_transmit_bytes_total（单位bytes）

含义：哪个容器，哪个节点，哪个网卡中发送的总字节数

关键键值对：

{kubernetes_io_hostname=~"^$Node$"}

kubernetes_io_hostname代表哪个节点
```

```
统计含义：
前1分钟内，平均每秒所有节点内所有容器发送的总字节数的和

集群网络发送率——Prometheus查询语句：

sum (rate (container_network_receive_bytes_total{kubernetes_io_hostname=~"^$Node$"}[1m]))



```


#### 9.集群正在使用的CPU核心数
```
使用指标名：container_cpu_usage_seconds_total（单位：秒）

含义：哪个容器，哪个节点，累计消耗的CPU时间

关键键值对：

{id="/",kubernetes_io_hostname=~"^$Node$"}

kubernetes_io_hostname代表哪个节点

id代表哪个容器id, 特别的值，id="/" 代表一个节点中所有的容器

```

```
CPU为分时使用设备，我们定义集群正在使用的CPU核数为：前1分钟内，集群所有服务每秒内使用Cpu的时间。

例子：

前1分钟内，集群所有服务每秒使用CPU时间为2秒，代表有2个CPU核心正在同时被使用


统计含义：所有节点所有容器前一分钟已使用CPU核心数

集群已使用CPU核心数——prometheus查询语句:

sum (rate (container_cpu_usage_seconds_total{id="/",kubernetes_io_hostname=~"^$Node$"}[1m]))



```

#### 10. 集群总CPU 核心数

```
使用指标名：machine_cpu_cores （单位：整数）

含义：哪个节点的CPU核心数

关键键值对：

{kubernetes_io_hostname=~"^$Node$"} 

kubernetes_io_hostname：代表哪个节点

```

```
统计含义：所有节点CPU核心数相加

集群总CPU核心数——prometheus查询语句:

sum (machine_cpu_cores{kubernetes_io_hostname=~"^$Node$"})

```

#### 11. 集群CPU使用率（%）

（集群已使用CPU核心数 / 集群总CPU 核心数） * 100


#### 12. 集群已使用内存（单位：byte）

```
使用指标名：container_memory_working_set_bytes

含义： 容器的工作内存使用量

关键键值对：

{id="/",kubernetes_io_hostname=~"^$Node$"}

```


```

统计含义：所有节点的所有容器的工作内存字节数相加

集群已使用内存——prometheus查询语句:

sum (container_memory_working_set_bytes{id="/",kubernetes_io_hostname=~"^$Node$"})

```

#### 13. 集群内存总量（单位：byte）

```
使用指标名：
machine_memory_bytes


含义： 节点的内存总量

关键键值对：

{kubernetes_io_hostname=~"^$Node$"}

kubernetes_io_hostname：代表哪个节点

```



```

统计含义：所有节点的内存字节数相加

集群内存总量——prometheus查询语句:

sum (machine_memory_bytes{kubernetes_io_hostname=~"^$Node$"})


```


#### 14. 集群内存使用率（%）

（ 集群已使用内存 / 集群内存总量 ）* 100

#### 15. 集群文件系统已使用量（单位：byte）


```
使用指标名：container_fs_usage_bytes

含义：哪个节点，哪个容器使用哪个文件系统分区的字节数

关键键值对：

{id="/",kubernetes_io_hostname=~"^$Node$"}

kubernetes_io_hostname：代表哪个节点

id：代表哪个容器id, 特别的值，id="/" 代表一个节点中所有的容器

```


```

统计含义：所有节点的所有容器的文件系统使用量相加

集群文件系统已使用量 —— prometheus查询语句:

sum (container_fs_usage_bytes{id="/",kubernetes_io_hostname=~"^$Node$"})

```

#### 16. 集群文件系统总量（单位：byte）

```
使用指标名：container_fs_limit_bytes

含义：节点上容器可以使用的文件系统各个分区总量

关键键值对：

{device=~"^/dev/.*$",id="/",kubernetes_io_hostname=~"^$Node$"}

device：代表挂载的哪个分区

kubernetes_io_hostname：代表哪个节点

id：代表哪个容器id, 特别的值，id="/" 代表一个节点中所有的容器
```


```

统计含义：所有节点容器可用的文件系统各个分区总量相加


集群文件系统总量——prometheus查询语句:

sum (container_fs_limit_bytes{device=~"^/dev/.*$",id="/",kubernetes_io_hostname=~"^$Node$"})

```

#### 17.集群文件系统使用率（%）

（集群文件系统已使用量 / 集群文件系统总量）* 100



# 访问

1. 部署grafana的pod，设置grafana的root_url为/grafana

2. 部署grafana的k8s内部域名服务（K8s service）映射到grafana的pod

3. 由于grafan服务需要被Webportal调用，需要还要部署grafana的K8s ingress映射到grafana的服务
通过nginx-ingress-controller网关来统一代理webprotal调用grafana展示子任务性能指标的请求

4. 管理员登录：http://$nodeIP/grafana/login

5. 请求子任务的性能指标：http://$nodeIP/grafana/d/Ncm6Cf7Zz/taskmetrics?refresh=10s&orgId=1&var-pod=$task_pod_name

# 镜像

1. grafana-deploy.yml => grafana/grafana:5.1.0

# 前提

1.Kubernetes version >= 1.13

2.给k8s节点node打label

kubectl label nodes <node-name> openinode=worker


# 部署

1. kubectl apply -f ./grafana
