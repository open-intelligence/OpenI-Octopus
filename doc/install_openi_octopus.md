# How to install OpenI-octopus services

## Preparation

Before the formal installation of services, there will be some preparatory work to be done, such as labeling the corresponding nodes and installing third-party dependencies. Please refer to the following instructions.

There are two ways to install Octopus service (quick installation and custom installation) after completing some matters before installation.

### Labels

Add label to the k8s namespace:

```
kubectl label ns default ns=default

kubectl label ns kube-system ns=kube-system

// After installing the Pylon service, you need to execute
kubectl label ns ingress-nginx ns=ingress-nginx
```

Add node label to the k8s server node that can run the service of openi-octopus system.

Note that the installation of log service needs to be set first, [reference](efk/README.md)

```
# Data storage node used to mark rest-server
kubectl label node $node octopus.openi.pcl.cn/rest-server-storage="yes"

# Data storage node used to mark log service
kubectl label node $node octopus.openi.pcl.cn/log-service-es="yes"

# Data storage node used to mark prometheus data
kubectl label node $node octopus.openi.pcl.cn/prometheus="yes"

# Data storage node used to mark plugin data
kubectl label node $node octopus.openi.pcl.cn/rest-server-plugin-storage="yes"

# Data storage node used to mark taskset(job) data
kubectl label node $node octopus.openi.pcl.cn/taskset-core-storage="yes"
```

In addition， there are two built-in training task types (DEBUG/RUN), and different types of tasks should be supported by corresponding (GPU/ other) hardware installed to specific server nodes. The system will schedule the corresponding configured server node with the corresponding type of task, so it is necessary to add the corresponding node label to the K8s server node in advance.

```
kubectl label node $node resourceType=debug
kubectl label node $node resourceType=run
```

DEBUG Job：It allows to use jupyterlab web editor to debug code online, limited time of 2 hours default.

RUN Job：It allows to configure the resources of the training job and run the training job directly without jupyterlab or web-terminal

### Image Depository

OpenI-octopus needs a private images registry service，please [install harbor service](https://github.com/goharbor/harbor)

### Service Entry

Install the built-in reverse agent service，Please refer to [install pylon service](../pylon/README.md)

## Quick Installation

Here is a set of Octopus service is deployed quickly through Helm 3.0.0+, Please refer to [here](./quick_install.md).

## Custom Installation

### Necessary installation steps

1. [install kube-batch service](https://github.com/kubernetes-sigs/kube-batch/blob/master/doc/usage/tutorial.md#install-kube-batch-for-kubernetes), Or install through chart in the project

    ```
    helm install octopus ./charts/kube-batch
    ```

2. [install tasksetcontroller service](../taskset/pkg/tasksetcontroller/docs/HOW_TO.md)

3. [install taskset-pipeline service](../taskset/pkg/pipeline/docs/deployment.md)(Learn more about pipeline component [here](../taskset/pkg/pipeline/docs/document.md)) and [install pipeline-plugins service](../rest-server-plugin/README.md)

4. [install rest-server service](../rest-server/README.md) and [install rest-server-storage service](../rest-server-storage/README.md)

5. [install web-portal service](../web-portal/README.md)

### Optional installation steps

1. In the web interface of web-portal, if you want users to use the task terminal to remotely operate debug_cpus type tasks in the running state, you can choose to [install kubebox-server service](../kubebox-server/README.md).

2. In the web interface of web-portal, if you want the user to resubmit the image of debug type task to the image repository, you can choose to [install image-factory-shield service](../image-factory/image-factory-shield/README.md) and [install image-factory-agent service](../image-factory/image-factory-agent/README.md).

3. In the web interface of web-portal, if you want the user to see the running task log, you can choose to [install efk service](efk/README.md).

4. In the web interface of web-portal, if the administrator needs to monitor and display the performance of each node of the cluster and GPU performance indicators, you can choose to [install prometheus service](prometheus/README.md) and [install grafana service](grafana/README.md).

5. In the web-portal - edit subtask view, there is an option of `InfiniBand device`. After checking this option, the ib device file will be mounted in the start task container. Please confirm the cluster node before doing so Whether there is an InfiniBand network device, if there is a need to further set the cluster, please refer to [here](./ib_install.md).