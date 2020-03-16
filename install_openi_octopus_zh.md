# OpenI-octopus系统服务安装文档

## 准备事项

在正式安装服务前，会有一些准备工作要做，比如给相应节点打标签，安装第三方依赖。请参考如下说明。
在完成安装前的一些事宜后，会有两种安装Octopus服务的方式（快速安装，自定义安装）。

### 标签

命名空间加上label

```
kubectl label ns default ns=default
kubectl label ns kube-system ns=kube-system

// 安装pylon服务后,需要执行
kubectl label ns ingress-nginx ns=ingress-nginx
```

给可以运行OpenI-octopus系统相应功能服务的k8s服务器节点加上node label

```
# 用于标记rest-server的数据存储节点
kubectl label node $node octopus.openi.pcl.cn/rest-server-storage="yes"

# 用于标记log-service的数据存储节点
kubectl label node $node octopus.openi.pcl.cn/log-service-es="yes"
```

另外，有2种内置的训练任务类型(DEBUG/RUN)，不同类型的任务要有相应的(GPU/其他)硬件安装到特定的服务器节点支持。系统会将相应类型的任务调度相应的配置好的服务器节点，所以需要提前给K8s服务器节点加上相应的node label

```
kubectl label node $node resourceType=debug
kubectl label node $node resourceType=run
```

DEBUG类型：可以使用jupyterlab网页编辑器进行线上调试代码，限时2小时。配置固定的训练任务资源申请，可通过rest-server-storage的数据库修改。
RUN类型：可以配置训练任务的资源，直接运行训练任务，不能调试，不能使用任务终端

### 镜像仓库

OpenI-octopus系统需要一个私有镜像仓库支持，请[安装harbor服务](https://github.com/goharbor/harbor)

### 服务入口

安装自带的反向代理服务，请参考： [安装pylon服务](./pylon/README.md)

## 快速安装

这里通过Helm 3.0.0+的方式，快速部署一套Octopus服务。
所以需要有Helm的支持，请参考这里[安装Helm](https://github.com/helm/helm#install)。
然后通过添加Chart仓库，就可以部署服务了。

```console
# Helm 3.0.0+
# add repository into helm repos
$ helm repo add ocharts https://open-intelligence.github.io/charts/

# install octopus
$ helm install octopus ocharts/octopus
```

## 自定义安装

自定义安装过程中，需要编译打包相应的项目代码为镜像，之后可以通过[charts](./charts/README.md)中相应服务的chart包安装

1. [安装tasksetcontroller服务](./taskset/docs/HOW_TO.md)

2. [安装rest-server-storage服务](./rest-server-storage/README.md)

3. [安装rest-server服务](./rest-server/README.zh-CN.md)

4. [安装web-portal服务](./web-portal/README.zh-CN.md)

5. [安装kube-batch服务](https://github.com/kubernetes-sigs/kube-batch/blob/master/doc/usage/tutorial.md#install-kube-batch-for-kubernetes), 或者通过项目中的chart安装

```
helm install octopus ./charts/kube-batch
```

### 选择安装步骤

1. 在web-portal的网页界面中，如果想让用户使用任务终端远程操作运行状态的debug_cpu类型任务，可以选择 [安装kubebox-server服务](./kubebox-server/README.md)

2. 在web-portal的网页界面中，如果想让用户重新提交debug类型任务的镜像到镜像仓库，可以选择[安装image-factory-shield服务](./image-factory-shield/README.md) 与 [安装image-factory-agent服务](./image-factory-agent/README.md)

3. 在web-portal的网页界面中，如果想让用户可以看到运行状态的任务日志，可以选择[安装efk服务](./efk/README.md)

4. 现阶段jupyter-lab服务会依赖与efk服务，用户会使用jupyter-lab网页编辑器远程操作运行状态的debug类型任务，这功能需要[安装jupyterlab-proxy服务](./jupyterlab-proxy/README.md)

5. 在web-portal的网页界面中，如果需要让管理员监控和展示集群各节点性能与GPU性能指标，可以选择[安装prometheus服务](./prometheus/README.md) 与 [安装grafana服务](./grafana/README.md)
