<!--
  Copyright (c) Microsoft Corporation
  All rights reserved.

  MIT License

  Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated
  documentation files (the "Software"), to deal in the Software without restriction, including without limitation
  the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and
  to permit persons to whom the Software is furnished to do so, subject to the following conditions:
  The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

  THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING
  BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
  NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
  DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.


  Copyright (c) Peking University 2018

  The software is released under the Open-Intelligence Open Source License V1.0.
  The copyright owner promises to follow "Open-Intelligence Open Source Platform
  Management Regulation V1.0", which is provided by The New Generation of 
  Artificial Intelligence Technology Innovation Strategic Alliance (the AITISA).
-->

# Kubernetes 在集群中的部署

我们假设在集群中的每个节点都有一个静态分配的ip并且在 Ubuntu 16.04 LTS下运行。以下k8s组件将被部署在指定节点上并在主机网络下运行。
- kubelet
- apiserver
- controller-manager
- etcd
- scheduler
- dashboard
- kube-proxy

Each k8s component runs in a Docker container. If Docker is missing in the OS, the script will install the latest Docker version.

## 准备配置集群

按照 [cluster configuration](../cluster-configuration/)进行配置. 这个链接中的配置文件解释了一个例子，其中包括许多细节的解释。将服务部署到集群时，请使用自己的配置信息替换指定的字段。
注意：不要更改文件名！

## Kubernetes 高可用性

#### 方法一

因为云服务，例如azure总是有负载平衡服务。所以当部署OpenI到云平台时，你可以选择负载平衡服务去实现高可用性。在搭建你的kubernetes集群时，你应该配置你的负载平衡。请使用你的权限设置后端。并且使用在 [kubernetes-configuration.yaml](../cluster-configuration/kubernetes-configuration.yaml)中负载平衡的ip去配置下面的属性。

```yaml

load-balance-ip: load-balance IP

```

#### 方法二
如果你的环境没有负载平衡服务。你可以添加代理节点到kuebrnetes集群中。所以你必须添加一个满足k8s的节点作为代理。目前我们只支持单节点代理。如果你想用ha部署代理，你可以自己实现它。

[The proxy component definition](k8sPaiLibrary/maintainconf/deploy.yaml)

[The conponent templatefile path](k8sPaiLibrary/template)

你应该按照下面的方式配置你的节点。(非ha代理)

```yaml
   - hostname: hostname (echo `hostname`)
      hostip: IP
      machine-type: D8SV3
      etcdid: etcdid1
      k8s-role: master
      dashboard: "true"


    - hostname: hostname
      hostip: IP
      machine-type: D8SV3
      etcdid: etcdid2
      k8s-role: master


    - hostname: hostname
      hostip: IP
      machine-type: D8SV3
      etcdid: etcdid3
      k8s-role: master


    - hostname: hostname
      hostip: IP
      machine-type: NC24R
      k8s-role: proxy

```


使用在[kubernetes-configuration.yaml](../cluster-configuration/kubernetes-configuration.yaml)中负载平衡的ip去配置下面的属性。

```yaml

load-balance-ip: load-balance vip

```

#### 方法三

不使用 kubernete-ha。并且只设立一个 k8s节点作为主权限。

例如：
```
    - hostname: hostname (echo `hostname`)
      hostip: IP
      machine-type: D8SV3
      etcdid: etcdid1
      k8s-role: master
      dashboard: "true"


    - hostname: hostname
      hostip: IP
      machine-type: D8SV3
      k8s-role: worker


    - hostname: hostname
      hostip: IP
      machine-type: D8SV3
      k8s-role: worker

```

使用在[kubernetes-configuration.yaml](../cluster-configuration/kubernetes-configuration.yaml)中负载平衡的ip去配置下面的属性。

```yaml

load-balance-ip: master ip

```




## 准备开发环境


#### 主机环境
确保你的主机环境拥有对集群的网络访问权限

Python(2.x)和 库 的安装:
```yaml
sudo apt-get install python python-paramiko python-yaml python-jinja2
sudo pip install python-etcd kubernetes
```

注意：kubectl 将被安装到这个开发箱中。所以你有权访问你的kubernetes 集群

#### 在一个docker容器中
- 确保你的docker环境拥有对集群的网络访问权限。
- 确保你的开发环境已经被安装到了docker中。
```bash
sudo docker build -t kubernetes-deployment .
sudo docker run -itd \
        -e COLUMNS=$COLUMNS -e LINES=$LINES -e TERM=$TERM \
        -v /path/to/configuration/directory:/cluster-configuration  \
        -v /var/lib/docker:/varl/lib/docker \
        -v /var/run/docker.sock:/var/run/docker.sock \
        -v /hadoop/binary/path:/hadoop/binary/path \
        --pid=host \
        --privileged=true \
        --net=host \
        --name=deployment \
        kubernetes-deployment
sudo docker exec -it deployment /bin/bash
cd /openi/openi-management

```



## 载入

```bash
sudo ./k8sClusterManagement.py -p /path/to/configuration/directory -a deploy
```

## 删除你的集群
```bash
sudo ./k8sClusterManagement.py -p /path/to/configuration/directory -a clean
```

## 只安装kubectl到你的开发环境中
```bash
sudo ./k8sClusterManagement.py -p /path/to/configuration/directory -a install_kubectl
```

## 添加新的节点到你的集群中
```bash
sudo ./k8sClusterManagement.py -p /path/to/configuration/directory -f yournodelist.yaml -a add
```

## 从你的集群中删除节点
```bash
sudo ./k8sClusterManagement.py -p /path/to/configuration/directory -f yournodelist.yaml -a remove
```


## 修复异常状态的工作节点
```bash
sudo ./k8sClusterManagement.py -p /path/to/configuration/directory -f yournodelist.yaml -a repair
```


## 修复崩溃等待的节点（kubernetes无法重启它）
```bash
sudo ./k8sClusterManagement.py -p /path/to/configuration/directory -f yournodelist.yaml -a etcdfix
```






# 利用Kubernetes部署服务

本章节解释如何使用Kubernetes 部署系统服务，包括框架搭建，hadoop，rest server以及门户网站。

## 条件

python和docker是必备的。

python（2.x）和 特定的库 要安装：
```
sudo apt-get install python python-pip python-yaml python-jinja2 
sudo pip install kubernetes
```

[Docker install](https://docs.docker.com/engine/installation/linux/docker-ce/ubuntu/)

为了存储docker镜像去部署服务，整个部署的过程要进一步依赖docker注册服务 (例如, [Docker hub](https://docs.docker.com/docker-hub/)) 

## 准备hadoop配置（补丁）

```
sudo ./prepare_hadoop_config.sh
```

根据你的环境，你可以在这步自定义hadoop配置。

## 集群配置和脚本生成

配置 [cluster configuration](../cluster-configuration/)。链接中的配置文件解释了一个例子，这个例子包含了一些细节。当部署你的服务到集群时，请用你自己的配置替换指定字段。

注意：不要改变文件名！


## 建立docker镜像
```
sudo ./docker_build.py -p /path/to/configuration/directory
```

## 在k8s上部署服务

运行下列命令：
```
sudo ./deploy.py -d -p /path/to/configuration/directory
```

## 清空你先前的部署
```
sudo ./deploy.py -p /path/to/configuration/directory
sudo ./cleanup-service.py
```

## 对于高级用户：自定义或重新配置hadoop服务

在重定义之前，请使用k8s停止hadoop服务并且移除hadoop配置表。用户可以定义hadoop配置在
./bootstrap/hadoop-service/hadoop-configuration/ 中（配置文件由./prepare_hadoop_config.sh生成）。在确定修改完毕后，请运行

```
./bootstrap/hadoop-service/start.sh
```

## 如何在集群中添加（移除）服务 ？

创建一个带有新服务名字的文件夹，把你docker镜像中的全部文件放到这个文件夹中，然后把文件夹放到路径/src/,并且更新 [service.yaml](service.yaml)中服务列表的详细信息。

#### 文件夹结构：
```
服务——部署
|
+-----载入
|       |
|       +------带有服务名字的文件    (这个名字在service.yaml中)
|
+-----源
|       |
|       +------带有定制镜像名字的文件夹    (这个名字在service.yaml中)
|
+------deploy.py   (在集群中载入服务的脚本)
|
+------docker_build.py (用来建立自定义docker镜像并且把他们进行docker注册的脚本）
|
+------clusterconfig-example.yaml  (集群中的配置)
|
+------service.yaml （集群中服务的列表和信息。自定义docker镜像的列表。）
+------readmd.md
```

#### Service.yaml

在你完成添加服务信息到 [service.yaml](service.yaml) 并且把你的文件放到了相应的路径中，运行deploy.py脚本，你的服务将会开始。

如果你想要移除一些错误的服务，只要在运行脚本之前在 [service.yaml](service.yaml) 中更改即可。

#### 模板

全部的模板将被 [jinja2](http://jinja.pocoo.org/)实例化。
并且全部信息会从集群配置中检索（就像 [clusterconfig-example.yaml](clusterconfig-example.yaml))。
如果你的服务需要更多信息，请添加你的需求到集群配置中。你的需求应该被放到clusterinfo, machineinfo 或者 machinelist中.

#### 配置/测试一个单独的服务

- ```sudo ./prepare_hadoop_config.sh```

准备hadoop配置。如果你不确定是否你的服务依赖于它。请不要跳过这一步。

- ```sudo ./docker_build -p /path/to/configuration/directory -n your_image_name```

为了确保你的docker镜像正确建立


- ```sudo ./deploy -p /path/to/configuration/directory -d -s your_service_name```

为了你的服务正确生效。

- ```sudo ./bootstrap/service/clean.sh```

为了你的服务能被停止脚本成功停止。这个停止脚本要在service.yaml 中被配置。

