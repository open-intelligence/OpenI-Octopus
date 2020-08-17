# 快速安装

这里通过Helm 3.0.0+的方式，快速部署一套Octopus服务,

所以需要有Helm的支持，请参考这里[安装Helm](https://github.com/helm/helm#install)。

然后添加Chart仓库，下载仓库中的Octopus安装包。

```console
# Helm 3.0.0+
# 添加chart仓库
$ helm repo add ocharts https://open-intelligence.github.io/charts/

# 下载Octopus安装包
$ helm fetch ocharts/octopus
```
下载完毕后,在当前目录下会有`octopus-x.x.x.tgz`压缩文件, 解压文件后得到`./octopus`目录.

接下来,需要修改`./octopus`目录中的`values.yaml`配置文件. 在配置文件中包含各子组件的配置信息,这里只列出结合当前安装环境必须要配置的项, 其他配置项可根据实际需求调整.

```yaml
# values.yaml

# 接口服务配置项
rest-server:
  # 数据库配置
  storage:
    # 默认root账号密码
    rootPassword: "root"
    dataVolume:
      # 数据在物理机上的存储路径
      hostPath: ""
    # 数据库运行节点的labels
    nodeSelector:
      octopus.openi.pcl.cn/rest-server-storage: "yes"
  docker:
    # 镜像仓库地址
    registry: ""
    # 镜像仓库用户名
    username: ""
    # 镜像仓库密码
    password: ""
  volumes:
    - name: ghome
      # 无需更改
      mountPath: /ghome
      # 数据集目录,每个用户在此目的下都会自动生成独有子目录,任务启动时将挂载入任务容器
      hostPath: /ghome
    - name: gmodel
      # 无需更改
      mountPath: /gmodel
      # 模型目录,每个用户在此目的下都会自动生成独有子目录,任务启动时将挂载入任务容器
      hostPath: /gmodel

# 功能插件配置项
rest-server-plugin:
  # 数据库配置
  storage:
    # 默认root账号密码
    rootPassword: "root"
    dataVolume:
      # 数据在物理机上的存储路径
      hostPath: ""
    # 数据库运行节点的labels
    nodeSelector:
      octopus.openi.pcl.cn/rest-server-plugin-storage: "yes"
  service:
    # debug类型任务的最大运行时间/秒
    debugJobMaxRunTime: 7200
  sharehosts:
    # 同rest-server.volumes.[0].hostPath
    shareDirectory: "/ghome"
  common:
    # 关闭jupyterLab请求body大小限制,开启限制单个请求限制在1M内
    disableJpyLabRequestBodyLimit: "true"

# 任务管理服务配置项
taskset-core:
  # 数据库配置
  storage:
    # 默认root账号密码
    rootPassword: "root"
    dataVolume:
      # 数据在物理机上的存储路径
      hostPath: ""
    # 数据库运行节点的labels
    nodeSelector:
      octopus.openi.pcl.cn/taskset-core-storage: "yes"

# 日志服务配置项
log-factory:
  es:
    replicaCount: 1
    # Elasticsearch索引分片配置
    index:
      number_of_shards: 5
      number_of_replicas: 2
    volumes:
      # Elasticsearch数据持久化路径
      esDataPath: ""
      # Elasticsearch备份持久化路径
      esBackupPath: ""
    ES_JAVA_OPTS: ""
    resources: {
    }
    # 数据库运行节点的labels
    nodeSelector:
      octopus.openi.pcl.cn/log-service-es: "yes"
  filebeat:
    # 资源限制
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

# 监控服务
prometheus:
  prometheus:
    nodeSelector:
      octopus.openi.pcl.cn/prometheus: "yes"
    retentionDuration: 365d
    volumes:
      # 数据持久化路径
      dataPath: ""
```

配置完后,执行安装:

```console
# 安装服务
$ helm install octopus ./octopus --values ./octopus/values.yaml
```