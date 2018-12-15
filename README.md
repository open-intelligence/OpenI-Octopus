# OPENI Platform ![alt text][logo]

[logo]: ./openilogo.png "OPENI"

[![Build Status](https://travis-ci.org/Microsoft/openi.svg?branch=master)](https://travis-ci.org/open-intelligence/openi)
[![Coverage Status](https://coveralls.io/repos/github/open-intelligence/openi/badge.svg?branch=master)](https://coveralls.io/github/open-intelligence/openi?branch=master)


## Introduction

OPENI is a cluster management tool and resource scheduling platform, initially designed and jointly developed by [Microsoft Research (MSR)](https://www.microsoft.com/en-us/research/group/systems-research-group-asia/), [Microsoft Search Technology Center (STC)](https://www.microsoft.com/en-us/ard/company/introduction.aspx), [Peking University](http://eecs.pku.edu.cn/EN/), [Xi'an Jiaotong University](http://www.aiar.xjtu.edu.cn/), [Zhejiang University](http://www.cesc.zju.edu.cn/index_e.htm), and [University of Science and Technology of China](http://eeis.ustc.edu.cn/), and [maintained by PCL LAB](http://www.pcl.ac.cn/), [Peking University](http://idm.pku.edu.cn/), [University of Science and Technology of China
](https://www.ustc.edu.cn/)and [AITISA](http://www.aitisa.org.cn/).
The platform incorporates some mature design that has a proven track record in large scale Microsoft production environment, and is tailored primarily for academic and research purpose. 

OPENI supports AI jobs (e.g., deep learning jobs) running in a GPU cluster. The platform provides a set of interfaces to support major deep learning frameworks: CNTK, TensorFlow, etc. The interface provides great extensibility: new deep learning framework (or other type of workload) can be supported by the interface with a few extra lines of script and/or Python code.

OPENI supports GPU scheduling, a key requirement of deep learning job. 
For better performance, OPENI supports fine-grained topology-aware job placement that can request for the GPU with a specific location (e.g., under the same PCI-E switch).

OPENI embraces a [microservices](https://en.wikipedia.org/wiki/Microservices) architecture: every component runs in a container.
The system leverages [Kubernetes](https://kubernetes.io/) to deploy and manage static components in the system.
The more dynamic deep learning jobs are scheduled and managed by [Hadoop](http://hadoop.apache.org/) YARN with our [GPU enhancement](https://issues.apache.org/jira/browse/YARN-7481). 
The training data and training results are stored in Hadoop HDFS.

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
Each machine in the cluster runs Ubuntu 16.04 LTS and has a statically assigned IP address.
To deploy services, the system further relies on a Docker registry service (e.g., [Docker hub](https://docs.docker.com/docker-hub/)) 
to store the Docker images for the services to be deployed.
The system also requires a dev machine that runs in the same environment that has full access to the cluster.
And the system need [NTP](http://www.ntp.org/) service for clock synchronization.

### Deployment process
To deploy and use the system, the process consists of the following steps.

1. Build the binary for [Hadoop AI](./hadoop-ai/README.md) and place it in the specified path*
2. [Deploy kubernetes and system services](./openi-management/README.md)
3. Access [web portal](./webportal/README.md) for job submission and cluster management

\* If step 1 is skipped, a standard Hadoop 2.9.0 will be installed instead.

#### Kubernetes deployment

The platform leverages Kubernetes (k8s) to deploy and manage system services.
To deploy k8s in the cluster, please refer to k8s deployment [readme](./openi-management/README.md) for details.

#### Service deployment

After Kubernetes is deployed, the system will leverage built-in k8s features (e.g., configmap) to deploy system services.
Please refer to service deployment [readme](./openi-management/README.md) for details.

#### Job management

After system services have been deployed, user can access the web portal, a Web UI, for cluster management and job management.
Please refer to this [tutorial](job-tutorial/README.md) for details about job submission.

#### Cluster management

The web portal also provides Web UI for cluster management.

## System Architecture

<p style="text-align: left;">
  <img src="./sysarch.png" title="System Architecture" alt="System Architecture" />
</p>

The system architecture is illustrated above. 
User submits jobs or monitors cluster status through the [Web Portal](./webportal/README.md), 
which calls APIs provided by the [REST server](./rest-server/README.md).
Third party tools can also call REST server directly for job management.
Upon receiving API calls, the REST server coordinates with [FrameworkLauncher](./frameworklauncher/README.md) (short for Launcher)
to perform job management.
The Launcher Server handles requests from the REST Server and submits jobs to Hadoop YARN. 
The job, scheduled by YARN with [GPU enhancement](https://issues.apache.org/jira/browse/YARN-7481), 
can leverage GPUs in the cluster for deep learning computation. Other type of CPU based AI workloads or traditional big data job
can also run in the platform, coexisted with those GPU-based jobs. 
The platform leverages HDFS to store data. All jobs are assumed to support HDFS.
All the static services (blue-lined box) are managed by Kubernetes, while jobs (purple-lined box) are managed by Hadoop YARN. 

