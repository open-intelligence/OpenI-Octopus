# OPENI Platform ![alt text][logo]

[logo]: ./openilogo.png "OPENI"

[![Build Status](https://travis-ci.org/Microsoft/openi.svg?branch=master)](https://travis-ci.org/open-intelligence/openi)
[![Coverage Status](https://coveralls.io/repos/github/open-intelligence/openi/badge.svg?branch=master)](https://coveralls.io/github/open-intelligence/openi?branch=master)


## 简介

OpenI-Octopus是一个集群管理工具和资源调度平台，由北京大学，西安交通大学，浙江大学和中国科学技术大学联合设计并开发， 由鹏城实验室、北京大学、中国科学技术大学和 AITISA 进行维护。 该平台结合了一些在大规模生产环境中表现良好的成熟设计，主要为提升学术研究效率，复现学术研究成果而量身打造。

### 特点

- 基于Kubernetes开发资源调度平台，以镜像方式管理任务运行环境，一次配置随处可用；
- 针对AI场景设计，AI场景的任务调度和任务启动有一定特殊性，如PS-Worker架构的分布式任务，需要至少满足两个角色的资源请求才能启动任务，否则即使启动任务也会造成资源浪费，而OpenI-Octopus针对类似场景做了很多设计和优化；
- 插件式设计理念，以核心的业务流为基础，通过插件化的方式提供扩展性，不限制插件开发语言；
- 易于部署，OpenI-Octopus支持helm方式的快速部署，同时支持服务的自定义部署；
- 支持异构硬件，如GPU、NPU、FPGA等，由于采用OpenI-Octopus基于Kubernetes开发，可自定义不同异构硬件插件；
- 支持多种深度学习框架，如 tensorflow、pytorch、paddlepaddle等，并通过镜像方式可方便的支持新增框架。

### 适用场景

- 构建大规模AI计算平台；
- 希望共享计算资源；
- 希望在统一的环境下完成模型训练；
- 希望使用集成的插件辅助模型训练，提升效率。

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

1. [部署适配OpenI章鱼系统的kubernetes](./deepops/README_zh.md)
2. [部署OpenI章鱼系统服务](./doc/install_openi_octopus_zh.md)
3. 访问[web门户页面](./web-portal/README.zh-CN.md) 进行任务提交和集群管理

#### 作业管理

系统服务部署完成后, 用户可以访问Web门户页面（一个Web UI界面）来进行集群和作业管理。
关于任务作业的提交，请参阅[指南](./user%20manual.pdf)。

#### 集群管理

Web门户上也提供了Web UI进行集群的管理。

## 系统结构

<p style="text-align: left;">
  <img src="./sysarch.png" title="System Architecture" alt="System Architecture" width = 70% height = 70% />
</p>

系统的整体结构如上图所示。
用户通过Web门户提交了任务作业或集群状态监视的申请，该操作会调用[Restserver服务](./rest-server/README.zh-CN.md)提供的API。
第三方工具也可以直接调用Restserver服务进行作业管理。收到API调用后，Restserver服务会将任务作业提交到k8s ApiServer，k8s的调度引擎负责对任务作业进行调度，调度完成后任务就可以使用集群节点中的GPU资源进行深度学习运算。
[TaskSetController服务](./taskset/README.md)负责监控任务作业在K8s集群中的生命周期。Rest-Server服务向k8s ApiServer获取任务的状态，并且Web网页可以展示在界面上。
其他基于CPU的AI工作或者传统的大数据任务作业也可以在平台上运行，与那些基于GPU的作业共存。平台训练数据和训练结果储存可根据平台/设备需求自定义。

