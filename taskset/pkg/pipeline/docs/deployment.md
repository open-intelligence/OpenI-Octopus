#　部署文档

# 一. 如何构建?

`go version >=1.13`

本地构建为可执行文件: `go build ./main/pipeline`

编译为docker镜像：`sudo docker build -t taskset:pipeline-version -f ./build/pipeline/dockerfile .`

# 二. 如何运行?

## 通过配置文件启动

配置文件:
```yaml

# 默认amdin用户的token
adminToken: your-token

# 任务流水线的配置
pipeline:
  # 设置流水线上有多少个工作线程
  workerAmount: 10　

# mysql配置项
mysql:
  # 最大空闲链接数
  maxIdleConns: 10
  # 最大打开链接数
  maxOpenConns: 5
  # mysql权限校验
  authStr: "user:password@/core?charset=utf8&parseTime=True&loc=Local"
  # 是否打印sql日志
  debugSql: false

# kubernetes配置
kubernetes:
  # api-server地址
  apiServer: "https://xxx.xxx.xxx.xxx:8443"
  # kubernetes登录文件地址
  kubeFilePath: "/home/userA/.kube/config"

# lifehook相关配置
lifehook:
  # 推送超时时间
  requestTimeOutSec: 30
  # 最大并行处理数
  maxParallelProcessRequest: 5
  # 最大重试次数
  maxRetryOnFail: 3

# http服务器端口
server:
  # 是否打印debug日志
  debugMode: false
  port: 8080
```

启动命令:`pipeline --config ./config.yaml`

## 从环境变量启动


环境变量列表:

* `AdminToken`  
* `MysqlMaxIdleConns`
* `MysqlMaxOpenConns`
* `MysqlAuthStr`
* `MysqlDebugSql`
* `LifeHookRequestTimeoutSec`
* `LifeHookMaxParallelProcessRequest`
* `LifeHookMaxRetryOnFail`
* `KubeApiServer`
* `KubeFilePath`
* `PipelineWorkerAmount`
* `DebugMode`
* `ServerPort`

启动命令: `pipeline`

## 使用helm启动

通过按需求修改 `./charts/taskset-core/value.yaml` 文件中的配置

```
// 安装
helm install octopus ./charts/taskset-core
```