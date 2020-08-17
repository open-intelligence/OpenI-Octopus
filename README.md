# OPENI Platform ![alt text][logo]

[logo]: ./openilogo.png "OPENI"

[![Build Status](https://travis-ci.org/Microsoft/openi.svg?branch=master)](https://travis-ci.org/open-intelligence/openi)
[![Coverage Status](https://coveralls.io/repos/github/open-intelligence/openi/badge.svg?branch=master)](https://coveralls.io/github/open-intelligence/openi?branch=master)

[简体中文](./README_zh.md)

## Introduction

Openi-octopus is a cluster management tool and resource scheduling platform jointly designed and developed by Peking University, Xi'an Jiaotong University, Zhejiang University and China University of science and technology, and maintained by Pengcheng laboratory, Peking University, China University of science and technology and aitisa. The platform combines some mature designs that perform well in large-scale production environment, and is mainly designed to improve the efficiency of academic research and reproduce academic research results.

### Feature

- Based on kubernetes, the resource scheduling platform is developed to manage the task running environment in a mirror way, and the primary configuration is available everywhere;
- For AI scenario design, task scheduling and start-up of AI scenario have certain particularity. For example, distributed tasks of PS worker architecture need to meet resource requests of at least two roles to start tasks. Otherwise, even start-up tasks will cause resource waste. Openi octopus has done a lot of design and Optimization for similar scenarios;
- The plug-in design concept, based on the core business flow, provides extensibility through plug-in, and does not limit the plug-in development language;
- It is easy to deploy. Openi Octopus supports rapid deployment in helm mode, and supports customized deployment of services;
- Support heterogeneous hardware, such as GPU, NPU, FPGA, etc. because openi octopus is used to develop based on kubernetes, different heterogeneous hardware plug-ins can be customized;
- Support a variety of deep learning frameworks such as tensorflow, pytorch, paddlepaddle, etc., and can easily support new frameworks by mirroring.

### Applicable Scenario

- Build large-scale AI computing platform;
- Want to share computing resources;
- Hope to complete the model training in a unified environment;
- We hope to use integrated plug-ins to assist model training and improve efficiency.

## An Open AI Platform for R&D and Education 

OPENI is completely open: it is under the Open-Intelligence license. OPENI is architected in a modular way: different module can be plugged in as appropriate. This makes OPENI particularly attractive to evaluate various research ideas, which include but not limited to the following components: 

* Scheduling mechanism for deep learning workload
* Deep neural network application that requires evaluation under realistic platform environment
* New deep learning framework
* Compiler technique for AI
* High performance networking for AI
* Profiling tool, including network, platform, and AI job profiling
* AI Benchmark suite
* New hardware for AI, including FPGA, ASIC, Neural Processor
* AI Storage support
* AI platform management 

OPENI operates in an open model: contributions from academia and industry are all highly welcome. 

## System Deployment

### Prerequisite

The system runs in a cluster of machines each equipped with one or multiple GPUs. 
Each machine in the cluster runs Ubuntu 18.04 LTS and has a statically assigned IP address.
To deploy services, the system further relies on a Docker registry service (e.g., [Docker hub](https://docs.docker.com/docker-hub/)) 
to store the Docker images for the services to be deployed.
The system also requires a dev machine that runs in the same environment that has full access to the cluster.
And the system need [NTP](http://www.ntp.org/) service for clock synchronization.

### Deployment process
To deploy and use the system, the process consists of the following steps.

1. [Deploy Kubernetes for OPENI-octopus system](./deepops/README_zh.md)
2. [Deploy OPENI-octopus system services](./doc/install_openi_octopus.md)
3. Access [web portal](./web-portal/README.md) for job submission and cluster management

#### Job management

After system services have been deployed, user can access the web portal, a Web UI, for cluster management and job management.
Please refer to this [tutorial](./user%20manual.pdf) for details about job submission.

#### Cluster management

The web portal also provides Web UI for cluster management.

## System Architecture

<p style="text-align: left;">
  <img src="./sysarch.png" title="System Architecture" alt="System Architecture" width = 70% height = 70%  />
</p>

The system architecture is illustrated above. 
User submits jobs or monitors cluster status through the Web Portal, 
which calls APIs provided by the [REST server](./rest-server/README.md).
Third party tools can also call REST server directly for job management.
Upon receiving API calls, the REST server coordinates with k8s ApiServer, k8s Scheduler will schedule the job to k8s node with CPU,GPU and other resources.
[TaskSetController](./taskset/README.md) will monitor the job life cycle in k8s cluster.
Restserver retrieve the status of jobs from k8s ApiServer, and its status can display on Web portal.
Other type of CPU based AI workloads or traditional big data job
can also run in the platform, coexisted with those GPU-based jobs. 
The storage of training data and results can be customized according to platform/equipment requirements.

