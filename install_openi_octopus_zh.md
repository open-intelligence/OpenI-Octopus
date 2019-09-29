# OpenI-octopus系统服务安装文档

### 必要安装步骤

1. 运维时设定，给可以运行OpenI-octopus系统服务的k8s服务器节点加上node label

```
kubectl label node $node openinode=worker
```

2. OpenI-octopus系统需要一个私有镜像仓库支持，请[安装harbor服务](https://github.com/goharbor/harbor)

3. [安装pylon服务](https://github.com/open-intelligence/OpenI-Octopus/tree/k8s/pylon)

4. [安装frameworkcontroller服务](https://github.com/open-intelligence/OpenI-Octopus/tree/k8s/frameworkcontroller)

5. [安装rest-server-storage服务](https://github.com/open-intelligence/OpenI-Octopus/tree/k8s/rest-server-storage)

6. [安装rest-server服务](https://github.com/open-intelligence/OpenI-Octopus/tree/k8s/rest-server)

7. [安装web-portal服务](https://github.com/open-intelligence/OpenI-Octopus/tree/k8s/web-portal)

8. 在web-portal的网页界面中，用户会使用jupyter-lab网页编辑器远程操作运行状态的debug类型任务，这功能需要[安装jupyterlab-proxy服务](https://github.com/open-intelligence/OpenI-Octopus/tree/k8s/jupyterlab-proxy)

9. 在web-portal的界面中，有3种内置的训练任务类型(DEBUG/DEBUG_CPU/RUN)，不同类型的任务要有相应的(GPU/其他)硬件安装到特定的服务器节点支持。系统会将相应类型的任务调度相应的配置好的服务器节点，所以需要提前给K8s服务器节点加上相应的node label

```
kubectl label node $node resourceType=debug
kubectl label node $node resourceType=debug_cpu
kubectl label node $node resourceType=run
```

DEBUG类型：可以使用jupyterlab网页编辑器进行线上调试代码，限时2小时。配置固定的训练任务资源申请，可通过rest-server-storage的数据库修改。
DEBUG_CPU类型：可以使用任务终端执行代码，查看训练任务输出结果。配置固定的训练任务资源申请，可通过rest-server-storage的数据库修改。
RUN类型：可以配置训练任务的资源，直接运行训练任务，不能调试，不能使用任务终端

### 选择安装步骤

1. 在web-portal的网页界面中，如果想让用户使用任务终端远程操作运行状态的debug_cpu类型任务，可以选择 [安装kubebox-server服务](https://github.com/open-intelligence/OpenI-Octopus/tree/k8s/kubebox-server)

2. 在web-portal的网页界面中，如果想让用户重新提交debug类型任务的镜像到镜像仓库，可以选择[安装image-factory-shield服务](https://github.com/open-intelligence/OpenI-Octopus/tree/k8s/image-factory-shield) 与 [安装image-factory-agent服务](https://github.com/open-intelligence/OpenI-Octopus/tree/k8s/image-factory-agent)

3. 在web-portal的网页界面中，如果想让用户可以看到运行状态的任务日志，可以选择[安装efk服务](https://github.com/open-intelligence/OpenI-Octopus/tree/k8s/efk)

4. 在web-portal的网页界面中，如果需要让管理员监控和展示集群各节点性能与GPU性能指标，可以选择[安装prometheus服务](https://github.com/open-intelligence/OpenI-Octopus/tree/k8s/prometheus) 与 [安装grafana服务](https://github.com/open-intelligence/OpenI-Octopus/tree/k8s/grafana)

