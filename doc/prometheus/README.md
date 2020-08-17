# 简介

openi章鱼使用prometheus时序数据库获取和存储任务的性能指标


# 前提

1.Kubernetes version >= 1.13

2.默认系统已经在K8s集群安装好[英伟达的K8s设备插件](https://github.com/NVIDIA/k8s-device-plugin)


# 实现思路

1. 通过kubernetes-cadvisor采集容器、Pod相关的性能指标数据，并通过暴露的/metrics接口，用prometheus抓取
2. 通过[英伟达gpu-monitoring-tools](https://github.com/NVIDIA/gpu-monitoring-tools/tree/master/exporters/prometheus-dcgm)采集分配给pod的gpu的性能指标，安装nvidia/pod-gpu-metrics-exporter，并通过暴露接口/gpu/metrics接口，用prometheus抓取
3. 通过kubernetes-apiservers、kubernetes-nodes、kubernetes-service-endpoints、kubernetes-services、kubernetes-ingresses、kubernetes-pods暴露的/metrics获取与k8s集群相关的一些特征指标数据。


# K8s系统中的应用如何主动暴露监控指标

1. Prometheus约定好带哪些annotation前缀的服务是自主暴露监控指标的服务

2. Prometheus服务运行后，会主动识别这些带哪些annotation前缀的服务的目标地址

3. K8s系统中部署的应用需要让自己被监控，可以添加如下Prometheus约定的annotation

例如:

```
prometheus.io/scrape
prometheus.io/path
prometheus.io/port
prometheus.io/scheme
```

prometheus.io/scrape, 为true则会将pod作为监控目标

prometheus.io/path, 默认为/metrics

prometheus.io/port, 端口

prometheus.io/scheme, 默认http，如果为了安全设置了https，此处需要改为https


# prometheus作业配置文件

prometheus job（作业）目的是找到目标数据源，主动拉取指标数据

prometheus的的作业配置在**configmap.yaml**文件中。可以查看[官方配置文档](https://prometheus.io/docs/prometheus/2.0/configuration/configuration/#kubernetes_sd_config)

本系统通过以下介绍几种作业获取与k8s集群相关的一些特征指标数据：

#### 1.kubernetes-apiservers

配置prometheus可以访问kube-apiserver，进而进行服务发现

主要服务发现：node，service，ingress，pod

#### 2. kubernetes-nodes

prometheus主动发现node以后，通过/api/v1/nodes/${1}/proxy/metrics来获取node的metrics

#### 3. kubernetes-cadvisor

kubernetes—cAdvisor 是容器、Pod相关的性能指标数据采集服务

cAdvisor是谷歌开源的一个容器监控工具

cadvisor已经被集成在kubelet中，所以发现了node就相当于发现了cadvisor。通过 /api/v1/nodes/${1}/proxy/metrics/cadvisor采集容器指标。


cadvisor提供的一些主要指标有：
```
container_cpu_*	
container_fs_*	
container_memory_*	
container_network_*	
container_spec_*(cpu/memory)		
container_start_time_*	
container_tasks_state_*
```


#### 4. kubernetes-pods

该job并不是监控pod的K8s系统资源指标，这种指标已经通过前面的cadvisor采集了。

该job的目的是对pod中应用的监控，是开发者自定义的其他监控指标，让prometheus来抓取。

如果要让prometheus监测pod，也是需要加注解：

- prometheus.io/scrape，为true则会将pod作为监控目标。
- prometheus.io/path，默认为/metrics
- prometheus.io/port , 端口
- prometheus.io/scheme 默认http，如果为了安全设置了https，此处需要改为https

#### 5.kubernetes-service-endpoints

如果某些部署应用只有pod没有service，那么这种情况只能在pod上加注解，通过kubernetes-pods采集metrics。

如果有service，那么就无需在pod加注解了，直接在service上加即可。毕竟service-endpoints最终也会落到pod上。

如果要让prometheus监测service-endpoints，需要对service加注解：

- prometheus.io/scrape，为true则会将pod作为监控目标。
- prometheus.io/path，默认为/metrics
- prometheus.io/port , 端口
- prometheus.io/scheme 默认http，如果为了安全设置了https，此处需要改为https


例子：

安装nvidia/pod-gpu-metrics-exporter后，为了让prometheus采集分配给pod的gpu的性能指标，可以用以下配置对应的K8s service：

```
kind: Service
apiVersion: v1
metadata:
  labels:
    app: pod-gpu-metrics-svc
  annotations:
    prometheus.io/port: "9400"
    prometheus.io/path: "/gpu/metrics"
    prometheus.io/scrape: "true"
  name: pod-gpu-metrics-svc
  namespace: kube-system
spec:
  type: NodePort
  ports:
  - port: 9400
    targetPort: 9400
    nodePort: 30400
  selector:
    app: pod-gpu-metrics-exporter
```



#### 4. kubernetes-services 与 kubernetes-ingresses

该两种资源监控方式差不多，都是需要在K8s系统中先部署blackbox-exporter服务。然后prometheus类似于探针去定时访问blackbox-exporter服务，根据返回的http状态码来判定service和ingress的服务可用性。

注意：

prometheus并不会获取所有的service和ingress的健康监测信息，是用户主动选择是否需要。

如果用户需要将自己的服务进行健康监测，那么部署应用的yaml文件加一些注解。

需要加注解：prometheus.io/scrape: 'true'

目前openi章鱼暂时没有启用blackbox-exporter服务，实际没有监控这两类资源


# prometheus作业配置解析

目标数据源target中必有的几个label：

1. **\__scheme__** : 协议名字，默认值: http

2. **\__address__**: 请求地址，(ip:port)

3. **\__metrics_path__**: 请求路径，默认值：metrics

4. **job** : 作业名字


#### 目标数据源target地址 = \__scheme__ +"://"+\__address__+\__metrics_path__


#### 作业配置例子：

一、 kubernetes-service-endpoints作业
```
- job_name: 'kubernetes-service-endpoints' #prometheus作业名字
  kubernetes_sd_configs: #prometheus如何发现target源地址
  - role: endpoints #从k8s系统中获得（ip:port）地址, 使用 kubectl get endpoints可以模拟
  relabel_configs:#target源地址会携带一系列的labels,可以对label的name进行替换、保留
  - source_labels: #target源地址会携带一系列的labels [__meta_kubernetes_service_annotation_prometheus_io_scrape]
    action: keep #如果以下正则表达式能匹配成功，对label的name的操作是：保留
    regex: true  #正则表达式可以根据label的值来选中对应的label、构造变量。如果__meta_kubernetes_service_annotation_prometheus_io_scrape的值是true,正则表达式会匹配成功
  - source_labels: [__meta_kubernetes_service_annotation_prometheus_io_scheme]
    action: replace #如果以下正则表达式能匹配成功，对label的name操作是：替换
    target_label: __scheme__ #__meta_kubernetes_service_annotation_prometheus_io_scheme替换成__scheme__
    regex: (https?) #__meta_kubernetes_service_annotation_prometheus_io_scheme的值为http|https,正则表达式会匹配成功
  - source_labels: [__meta_kubernetes_service_annotation_prometheus_io_path]
    action: replace
    target_label: __metrics_path__
    regex: (.+)
  - source_labels: [__address__, __meta_kubernetes_service_annotation_prometheus_io_port]
    action: replace
    target_label: __address__
    regex: ([^:]+)(?::\d+)?;(\d+) #两个label的值组合，分号;分开。利用正则表达式产生两个变量，可以被replacement使用,组成(ip:port)的模式，赋值到__address__这个label中
    replacement: $1:$2
  - action: labelmap #labelmap的行为表示，正则表达式regex对label的name起作用，而不是其值
    regex: __meta_kubernetes_service_label_(.+)
  - source_labels: [__meta_kubernetes_namespace]
    action: replace
    target_label: kubernetes_namespace
  - source_labels: [__meta_kubernetes_service_name]
    action: replace
    target_label: kubernetes_name
```

# prometheus作业配置项总结

- kubernetes-service-endpoints和kubernetes-pods采集应用中metrics，当然并不是所有的都提供了metrics接口。
- kubernetes-ingresses 和kubernetes-services 健康监测服务和ingress健康的状态
- kubernetes-cadvisor 和 kubernetes-nodes，通过发现node，监控node 和容器的cpu等指标


# 使用方法

1. 配置Prometheus每隔15s就会请求K8s APIServer获取k8s的资源请求，存储到时序数据库

2. 通过`kubectl port-forward` 导出服务端口，可以查看Prometheus获取的指标情况

# 镜像

prom/prometheus:v2.0.0+

nvidia/pod-gpu-metrics-exporter:v1.0.0-alpha

# 部署

1. 设置多个节点的kubelet的Pod资源参数：

    ```
    # vim /etc/default/kubelet
    # 输入配置参数：KUBELET_EXTRA_ARGS=--feature-gates=KubeletPodResources=true
    # sudo systemctl restart kubelet
    ```

2. 在k8s集群中已经安装了英伟达GPU的服务器节点，并且需要对该节点的英伟达GPU的性能指标做监控就需要对节点进行标记，使得英伟达的GPU监控软件能部署到这些节点中

    ```
    # kubectl label nodes <gpu-node-name> hardware-type=NVIDIAGPU
    ```

3. 给prometheus数据存储节点打上label
   
    ```
    kubectl label nodes <node-name> octopus.openi.pcl.cn/prometheus="yes"
    ```
   
4. 通过按需求修改 `./charts/prometheus/value.yaml` 文件中的配置
  
    ```
    // 安装
    helm install octopus ./charts/prometheus
    ```
