# How to install OpenI-octopus services

## Preparation

Before the formal installation of services, there will be some preparatory work to be done, such as labeling the corresponding nodes and installing third-party dependencies. Please refer to the following instructions.

There are two ways to install Octopus service (quick installation and custom installation) after completing some matters before installation.

### Labels

Add label to the k8s namespace

```
kubectl label ns default ns=default

kubectl label ns kube-system ns=kube-system

// After installing the Pylon service, you need to execute
kubectl label ns ingress-nginx ns=ingress-nginx
```

Add node label to the k8s server node that can run the service of openi-octopus system

```
# Data storage node used to mark rest-server
kubectl label node $node octopus.openi.pcl.cn/rest-server-storage="yes"

# Data storage node used to mark log service
kubectl label node $node octopus.openi.pcl.cn/log-service-es="yes"
```

In addition， there are two built-in training task types (DEBUG/RUN), and different types of tasks should be supported by corresponding (GPU/ other) hardware installed to specific server nodes. The system will schedule the corresponding configured server node with the corresponding type of task, so it is necessary to add the corresponding node label to the K8s server node in advance

```
kubectl label node $node resourceType=debug
kubectl label node $node resourceType=run
```

DEBUG Job：It allows to use jupyterlab web editor to debug code online, limited time of 2 hours. Configure fixed training task resource request, which can be modified by rest-server-storage database.
RUN Job：It allows to configure the resources of the training job and run the training job directly without jupyterlab or web-terminal

### Image Depository

OpenI-octopus needs a private images registry service，please [install harbor service](https://github.com/goharbor/harbor)

### Service Entry

Install the built-in reverse agent service，Please refer to [install pylon service](./pylon/README.md)

## Quick Installation

Here is a set of Octopus service is deployed quickly through Helm 3.0.0+.
So you need to have the support of helm, please refer to [install Helm](https://github.com/helm/helm#install)
Then you can deploy the service by adding the chart repository.

```console
# Helm 3.0.0+
# add repository into helm repos
$ helm repo add ocharts https://open-intelligence.github.io/charts/

# install octopus
$ helm install octopus ocharts/octopus
```

## Custom Installation

### Necessary installation steps

1. [install tasksetcontroller service](./taskset/docs/HOW_TO.md)

2. [install rest-server-storage service](./rest-server-storage/README.md)

3. [install rest-server service](./rest-server/README.md)

4. [install web-portal service](./web-portal/README.md)

5. [install kube-batch service](https://github.com/kubernetes-sigs/kube-batch/blob/master/doc/usage/tutorial.md#install-kube-batch-for-kubernetes), Or install through chart in the project

```
helm install octopus ./charts/kube-batch
```

### Optional installation steps

1. In the web interface of web-portal, if you want users to use the task terminal to remotely operate debug_cpus type tasks in the running state, you can choose to [install kubebox-server service](./kubebox-server/README.md).

2. In the web interface of web-portal, if you want the user to resubmit the image of debug type task to the image repository, you can choose to [install image-factory-shield service](./image-factory-shield/README.md) and [install image-factory-agent service](./image-factory-agent/README.md).

3. In the web interface of web-portal, if you want the user to see the running task log, you can choose to [install efk service](./efk/README.md).

4. At present, jupyter lab service will rely on efk service. In the web-portal interface, users will use jupyter-lab web editor to remotely operate debug type tasks of running state, need to [install jupyterlab-proxy service](./jupyterlab-proxy/README.md)

5. In the web interface of web-portal, if the administrator needs to monitor and display the performance of each node of the cluster and GPU performance indicators, you can choose to [install prometheus service](./prometheus/README.md) and [install grafana service](./grafana/README.md).