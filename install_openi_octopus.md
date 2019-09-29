# How to install OpenI-octopus services

### Necessary installation steps

1. Add node label to the k8s server node that can run the service of openi-octopus system

```
kubectl label node $node openinode=worker
```

2. OpenI-octopus needs a private images registry service，please [install harbor service](https://github.com/goharbor/harbor)

3. [install pylon service](https://github.com/open-intelligence/OpenI-Octopus/tree/k8s/pylon)

4. [install frameworkcontroller service](https://github.com/open-intelligence/OpenI-Octopus/tree/k8s/frameworkcontroller)

5. [install rest-server-storage service](https://github.com/open-intelligence/OpenI-Octopus/tree/k8s/rest-server-storage)

6. [install rest-server service](https://github.com/open-intelligence/OpenI-Octopus/tree/k8s/rest-server)

7. [install web-portal service](https://github.com/open-intelligence/OpenI-Octopus/tree/k8s/web-portal)

8. In the web-portal interface, users will use jupyter-lab web editor to remotely operate debug type tasks of running state, need to [install jupyterlab-proxy service](https://github.com/open-intelligence/OpenI-Octopus/tree/k8s/jupyterlab-proxy)

9. In the web-portal interface, there are three built-in training task types (DEBUG/DEBUG_CPU/RUN), and different types of tasks should be supported by corresponding (GPU/ other) hardware installed to specific server nodes. The system will schedule the corresponding configured server node with the corresponding type of task, so it is necessary to add the corresponding node label to the K8s server node in advance

```
kubectl label node $node resourceType=debug
kubectl label node $node resourceType=debug_cpu
kubectl label node $node resourceType=run
```


DEBUG Job：It allows to use jupyterlab web editor to debug code online, limited time of 2 hours. Configure fixed training task resource request, which can be modified by rest-server-storage database.
DEBUG_CPU Job：It allows to use the job web-terminal to execute code and see the training task output. Configure fixed training task resource request, which can be modified by rest-server-storage database.
RUN Job：It allows to configure the resources of the training job and run the training job directly without jupyterlab or web-terminal

### Optional installation steps

1. In the web interface of web-portal, if you want users to use the task terminal to remotely operate debug_cpus type tasks in the running state, you can choose to [install kubebox-server service](https://github.com/open-intelligence/OpenI-Octopus/tree/k8s/kubebox-server).

2. In the web interface of web-portal, if you want the user to resubmit the image of debug type task to the image repository, you can choose to [install image-factory-shield service](https://github.com/open-intelligence/OpenI-Octopus/tree/k8s/image-factory-shield) and [install image-factory-agent service](https://github.com/open-intelligence/OpenI-Octopus/tree/k8s/image-factory-agent).

3. In the web interface of web-portal, if you want the user to see the running task log, you can choose to [install efk service](https://github.com/open-intelligence/OpenI-Octopus/tree/k8s/efk).

4. In the web interface of web-portal, if the administrator needs to monitor and display the performance of each node of the cluster and GPU performance indicators, you can choose to [install prometheus service](https://github.com/open-intelligence/OpenI-Octopus/tree/k8s/prometheus) and [install grafana service](https://github.com/open-intelligence/OpenI-Octopus/tree/k8s/grafana).
