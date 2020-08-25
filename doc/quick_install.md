# Quick Installation

Here is a set of Octopus service is deployed quickly through Helm 3.0.0+.

So you need to have the support of helm, please refer to [install Helm](https://github.com/helm/helm#install)

Then you can deploy the service by adding the chart repository.

```console
# Helm 3.0.0+
# add repository into helm repos
$ helm repo add ocharts https://open-intelligence.github.io/charts/

# fetch octopus chart
$ helm fetch ocharts/octopus
```

After the download is complete, there will be `octopus-x.x.x.tgz` compressed files in the current directory, and the `./octopus` directory will be obtained after decompressing the files.

Next, you need to modify the `values.yaml` configuration file in the `./octopus` directory. The configuration file contains the configuration information of each subcomponent. Only the items that must be configured in combination with the current installation environment are listed here. Other configuration items can be based on actual needs Adjustment.

```yaml
# values.yaml

# Interface service configuration items
rest-server:
  # Database configuration
  storage:
    # Default root account password
    rootPassword: "root"
    dataVolume:
      # Data persistence path
      hostPath: ""
    # Labels of the database running node
    nodeSelector:
      octopus.openi.pcl.cn/rest-server-storage: "yes"
  docker:
    # Mirror warehouse address
    registry: ""
    # Mirror warehouse username
    username: ""
    # Mirror warehouse password
    password: ""
  volumes:
    - name: ghome
      # No need to change
      mountPath: /ghome
      # Data set directory
      # Each user will automatically generate a unique subdirectory for this purpose, and load the task container when the task starts
      hostPath: /ghome
    - name: gmodel
      # No need to change
      mountPath: /gmodel
      # Model directory
      # Each user will automatically generate a unique subdirectory for this purpose, and load the task container when the task starts
      hostPath: /gmodel

# Function plug-in configuration items
rest-server-plugin:
  # Database configuration
  storage:
    # Default root account password
    rootPassword: "root"
    dataVolume:
      # Data persistence path
      hostPath: ""
    # Labels of the database running node
    nodeSelector:
      octopus.openi.pcl.cn/rest-server-plugin-storage: "yes"
  service:
    # Maximum running time of debug type tasks(sec)
    debugJobMaxRunTime: 7200
  sharehosts:
    # rest-server.volumes.[0].hostPath
    shareDirectory: "/ghome"
  common:
    # Turn off jupyterLab request body size limit, turn on the limit for individual requests to be limited to 1M
    disableJpyLabRequestBodyLimit: "true"

# Task management service configuration items
taskset-core:
  # Database configuration
  storage:
    # Default root account password
    rootPassword: "root"
    dataVolume:
      # Data persistence path
      hostPath: ""
    # Labels of the database running node
    nodeSelector:
      octopus.openi.pcl.cn/taskset-core-storage: "yes"

# Log service configuration items
log-factory:
  es:
    replicaCount: 1
    # ElasticSearch Index sharding configuration
    index:
      number_of_shards: 5
      number_of_replicas: 2
    volumes:
      # Data persistence path
      esDataPath: ""
      # Backup persistent path
      esBackupPath: ""
    ES_JAVA_OPTS: ""
    resources: {
    }
    # Labels of the database running node
    nodeSelector:
      octopus.openi.pcl.cn/log-service-es: "yes"
  filebeat:
    # Resource limit
    resources: {
      limits: {
        cpu: "1000m",
        memory: "2Gi"
      },
      requests: {
        cpu: "1000m",
        memory: "2Gi"
      }         
    }

# Monitoring service configuration items
prometheus:
  prometheus:
    nodeSelector:
      octopus.openi.pcl.cn/prometheus: "yes"
    retentionDuration: 365d
    volumes:
      # Data persistence path
      dataPath: ""
```

After configuration, perform the installation:

```console
# install service
$ helm install octopus ./octopus --values ./octopus/values.yaml
```