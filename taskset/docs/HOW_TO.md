
# 一. 如何构建？

`go version >=1.13`


编译为docker镜像：`sudo ./build/tasksetcontroller/docker_build.sh -t tasksetcontroller:tag`

本地构建为可执行文件: `go build ./main/tasksetcontroller`


# 二. 如何运行？

### 2.1 从配置文件启动

命令 : `./tasksetcontroller --config ./config.yaml`

`config.yaml`中的参数解释:

```yaml
workerAmount: 10 #设置TaskSetController开启的线程数量 
k8sApiServer: https://xxx.xxx.xxx.xxx:8443 #你的kubernetes的API-Server的地址
k8sConfigFile: /path/to/your/kubernetes/config/file  #你的kubernetes的配置文件路径
cacheCreationTimeoutSec: 300 #等待一个新创建资源出现在本地的最大等待时间，单位秒，默认300秒
```

### 2.2 从环境变量启动


命令 `./tasksetcontroller`

环境变量:

* `WorkerAmount`
* `K8sAPIServer`
* `K8sConfigFile`
* `CacheCreationTimeoutSec`

### 2.3 在kubernetes集群里面启动

修改 `./deploy/tasksetcontroller/deployment.yaml`文件，填写期望的tasksetcontroller的镜像地址

然后执行 `kubectl create -f deployment.yaml`

您也可以通过环境变量设置`WorkerAmount` 和　`CacheCreationTimeoutSec`，WorkerAmount默认是10,CacheCreationTimeoutSec默认
是300秒。在kubernetes里面启动不需要设置`K8sAPIServer`和`K8sConfigFile`两个环境变量。
