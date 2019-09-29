# OPENI Platform ![alt text][logo]

[logo]: ./openilogo.png "OPENI"

[![Build Status](https://travis-ci.org/Microsoft/openi.svg?branch=master)](https://travis-ci.org/open-intelligence/openi)
[![Coverage Status](https://coveralls.io/repos/github/open-intelligence/openi/badge.svg?branch=master)](https://coveralls.io/github/open-intelligence/openi?branch=master)


## 简介

OPENI是一个集群管理工具和资源调度平台，最初由 [微软研究院(MSR)](https://www.microsoft.com/en-us/research/group/systems-research-group-asia/)，[微软搜索技术中心(STC)](https://www.microsoft.com/en-us/ard/company/introduction.aspx)，[北京大学](http://eecs.pku.edu.cn/EN/)，[西安交通大学](http://www.aiar.xjtu.edu.cn/)，[浙江大学](http://www.cesc.zju.edu.cn/index_e.htm)， 和[中国科学技术大学](http://eeis.ustc.edu.cn/) 联合设计并开发， 由 [鹏城实验室](http://www.pcl.ac.cn/)、[北京大学](http://idm.pku.edu.cn/) 、[中国科学技术大学](https://www.ustc.edu.cn/)和 [AITISA](http://www.aitisa.org.cn/) 进行维护。
该平台结合了一些在微软大规模生产环境中表现良好的成熟设计，主要为学术研究而量身打造。

OPENI支持在GPU集群中运行AI任务作业（比如深度学习任务作业）。平台提供了一系列接口，能够支持主流的深度学习框架，如CNTK, TensorFlow等。这些接口同时具有强大的可扩展性：添加一些额外的脚本或者Python代码后，平台即可支持新的深度学习框架（或者其他类型的工作）。


作为深度学习中非常重要的一项要求，OPENI支持GPU调度。
为了能得到更好的性能，OPENI支持细粒度的拓扑感知任务部署，可以获取到指定位置的GPU（比如获取在相同的PCI-E交换机下的GPU）。

启智采用[microservices](https://en.wikipedia.org/wiki/Microservices) 结构：每一个组件都在一个容器中运行。 
平台利用[Kubernetes](https://kubernetes.io/) 来部署和管理系统服务。
平台的最新版本，动态的深度学习任务的调度引擎也使用Kubernetes，使得系统服务和深度学习任务都使用Kubernetes进行调度和管理。 
训练数据和训练结果储存可根据平台/设备需求自定义。任务日志采用[Filebeat](https://www.elastic.co/cn/products/beats/filebeat)收集，
[Elasticsearch](https://www.elastic.co/cn/products/elasticsearch)集群存储。

## 用于研发及教育的开源AI平台

OPENI是完全开源的：它遵守Open-Intelligence许可。OPENI采用模块化的方式构建，可以根据用户的需要，插入不同的模块。 使用OPENI来实现和评价各种各样的研究思路是非常有吸引力的，因为它不仅仅包括：

* 深度学习任务的调度机制
* 需要在真实平台环境下进行评估的深度神经网络的应用
* 新的深度学习框架
* 适用于AI的编译技术
* 适用于AI的高性能网络
* 分析工具：包括网络、平台和AI作业的分析
* AI Benchmark基本套件
* 适用于AI的新硬件，包括FPGA、ASIC和神经处理器
* AI存储支持
* AI平台管理 

OPENI以开源的模式运营：来自学术和工业界的贡献我们都非常欢迎。 

## 系统部署

### 前提要求

该系统在一组机器集群上运行，每台机器都配有一块或多块GPU。
集群中的每台机器都运行Ubuntu 18.4 LTS，并有一个静态分配的IP地址。为了部署服务，系统进一步使用Docker注册服务 (例如[Docker hub](https://docs.docker.com/docker-hub/)) 来存储要部署的服务的Docker镜像。系统还需要一台可以完全访问集群的、运行有相同环境的开发机器。系统还需要[NTP](http://www.ntp.org/)服务进行时钟同步。

### 部署过程

执行以下几个步骤来部署和使用本系统。

1. [部署适配OpenI章鱼系统的kubernetes 1.13](https://www.processon.com/view/link/5d157ebae4b0a916e8f6bcc5)
2. [部署OpenI章鱼系统服务](./install_openi_octopus_zh.md)
3. 访问[web门户页面](https://github.com/open-intelligence/OpenI-Octopus/tree/k8s/web-portal) 进行任务提交和集群管理

#### 作业管理

系统服务部署完成后, 用户可以访问Web门户页面（一个Web UI界面）来进行集群和作业管理。
关于任务作业的提交，请参阅[指南](./user%20manual.pdf)。

#### 集群管理

Web门户上也提供了Web UI进行集群的管理。

## 系统结构

<p style="text-align: left;">
  <img src="./sysarch.png" title="System Architecture" alt="System Architecture" />
</p>

系统的整体结构如上图所示。
用户通过Web门户提交了任务作业或集群状态监视的申请，该操作会调用[Restserver服务](https://github.com/open-intelligence/OpenI-Octopus/tree/k8s/rest-server)提供的API。
第三方工具也可以直接调用Restserver服务进行作业管理。收到API调用后，Restserver服务会将任务作业提交到k8s ApiServer，k8s的调度引擎负责对任务作业进行调度，调度完成后任务就可以使用集群节点中的GPU资源进行深度学习运算。
[FrameworkController服务](https://github.com/open-intelligence/OpenI-Octopus/tree/k8s/frameworkcontroller)负责监控任务作业在K8s集群中的生命周期。Restserver服务向k8s ApiServer获取任务的状态，并且Web网页可以展示在界面上。
其他基于CPU的AI工作或者传统的大数据任务作业也可以在平台上运行，与那些基于GPU的作业共存。平台训练数据和训练结果储存可根据平台/设备需求自定义。

