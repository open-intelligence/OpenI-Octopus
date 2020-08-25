# IMAGE FACTORY

> Agents of S.H.I.E.L.D

`go >= 1.12`


镜像工厂，该服务可以帮助平台用户直接将容器打包成docker镜像。

分为 两个部分：

* agent （image-factory-agent）在目标物理节点上运行的代理，负责执行 docker commit  和 docker push 

* shield (image-factory-shield) 接收镜像打包请求，并将任务分发给对应物理节点上的 agent

> commit请求只需要同 shield 交互即可

该项目是 image-factory-shield

## 快速部署

1. 打包镜像

    ```
    $ docker build -t openi/image-factory-shield:version .
    ```

2. 部署到k8s集群

   通过按需求修改 `./charts/image-factory/value.yaml` 文件中`shield`部分配置
  
    ```
    // 安装
    helm install octopus ./charts/image-factory
    ```

## 一. Shield 的 API 说明

#### 1.1  查询镜像大小

>查询一个容器打成 docker 镜像后的大小

GET `/v1/commit/size?container=xxx&ip=xxx`

参数(query):

* container  容器的id 或者容器的名字

* ip 目标容器所在的物理机地址

返回（json格式）

```js
{
    "success":bool,// 操作成功或者失败
    "size":number ,// 镜像的大小，单位 kb
    "msg":"",// 附加消息，如果success 为 false,则是对应的失败信息
}
```

#### 1.2 同步commit 

> 直到镜像打包成功 或者 失败，该API 才返回， 如果镜像打包时间过长，请使用另一个异步打包的接口 

POST `/v1/commit/sync`

参数(JSON)：

```js
{
    "ip":"",// 目标容器所在物理节点的ip
    "author":"",// 作者，镜像作者
    "container":"",// 目标容器的id 或 目标容器的名字
    "image":"",// 新镜像的名字
    "note":"",// 备注,docker commit 的 --message 选项
    "hub_user":"",// 镜像仓库用户名，可选参数
    "hub_pwd":"",//镜像仓库密码,可选参数
    "hub_addr":"",// 镜像仓库登录地址，比如 registry.cn-hangzhou.aliyuncs.com ， 可选参数
}
```

返回(json 格式): 


```js
{
    "success": true/false ,
    "msg":"",// 
    "transaction_id":""//success 为true 时才会有这个值，可用来查询commit 任务状态
}
```


#### 1.3 异步commit 

> 接收到提交请求，立即返回，镜像工场会根据打包进度更新该次任务的状态

POST `/v1/commit/async`

参数(JSON)：

```js
{
    "ip":"",// 目标容器所在物理节点的ip
    "author":"",// 作者，镜像作者
    "container":"",// 目标容器的容器id  或 目标容器的名字
    "image":"",// 新镜像的名字
    "note":"",// 备注,docker commit 的 --message 选项
    "hub_user":"",// 镜像仓库用户名，可选参数
    "hub_pwd":"",//镜像仓库密码,可选参数
    "hub_addr":"",// 镜像仓库登录地址，比如 registry.cn-hangzhou.aliyuncs.com ， 可选参数
}
```
返回(json 格式): 


```js
{
    "success": true/false ,
    "msg":"",// 
    "transaction_id":""//success 为true 时才会有这个值，可用来查询commit 任务状态
}
```

#### 1.4 查询commit 任务 

>  commit 任务记录只在后端留存3小时，3小时内状态未更新则会被删除

GET `/v1/commit/query?transaction_id=`

参数格式 `query`

参数列表：

* transaction_id  commit 事务id
 

返回(json 格式): 


```js
{
    "success": true/false ,
    "msg":"",// 
    "commit":{// success 为true 时 才有该字段
        "id":"",// 即 transaction id
        "ip":"",// 容器所在节点ip
        "time":"",// 上一次状态更新的时间
        "image":"",// 新镜像的名字
        "container":"", // 容器id  或 容器的名字
        "author":"", // 作者
        "status":"", // commit 任务状态
        "status_msg":"" // commit 任务状态说明
    }
}
```
> 当一个commit 任务到达终止状态（成功， 或者 失败）, shield 将保留这个记3个小时，3个小时后将被删除，可以设置 环境变量 `MAX_COMMIT_EXIST_TIME` 
配置存活时间 比如 设置 `MAX_COMMIT_EXIST_TIME` 的值为 `3600` （单位秒）

## 二. commit 任务状态说明

* NOT_FOUND  该任务没有找到
* SUCCEEDED 镜像commit 成功
* FAILED  commit 失败
* INITIALIZED commit 任务已经初始化
* PROCESSING  commit 任务正在处理中
* COMMITTING  正在执行 docker commit 操作
* PUSHING 正在上传镜像


## 三. 部署说明

#### 3.1 注意事项

第一个： agent 在每个物理节点都运行一份实例，agent 负责 执行 `docker commit`，`docker push` 命令。

因此首先agent应该以守护进程的方式部署在物理机上，且需要有执行 `docker` 命令的权限！


第二个： docker 的客户端采用的是https，在与docker 镜像仓库交互时，如果镜像仓库不是采用的https 的方式，那么会报`http: server gave HTTP response to HTTPS client`错误 ， 解决方法是在 docker 的 `daemon.json` 配置文件中加上 `{ "insecure-registries":["192.168.1.100:5000"] }`(假设`192.168.1.100:5000`就是你的镜像仓库地址), 然后重启docker

请在部署 agent 时 确认一下 这个点。


第三个: 在 `commit` 的 `api` 中支持用户指定镜像仓库(即`hub_addr`参数) ，这是可选的, 如果对应的物理机上 docker 有与目标仓库交互的权限，那么`hub_user`,`hub_pwd`,`hub_addr` 可以不填。所以在部署的时候直接 运行  `docker login` 命令 登录目标仓库， 那么之后就不用在 调用 `commit`的api时 填 仓库的用户名密码了


#### 3.2  agent 

agent 运行在集群的物理机上(各个物理机上都需要运行)，需要有执行物理机上 `docker` 命令的权限

配置：

配置文件的形式(json):

```jsxinx
{
    "shield_address":"",// shield 服务的地址 ，如 http://192.168.202.20:9001
    "agent_address":"",// 该agent的访问地址，可以不配置，不配置将使用物理机ip拼接地址 http://ip:port
    "port":"",// 服务 监听的端口，默认是 9002
}
```

以配置文件的形式启动： `agent --config config_file_path`

或者设置环境变量：

* SHIELD_ADDRESS
* AGENT_ADDRESS
* PORT

#### 3.3 shield

shield 只需运行一个实例即可，理论上运行在哪里都可以

配置：

配置文件的形式(json):

```js
{
    "max_commit_exist_time":number,// commit 任务终止后，commit 记录在shield 里面的最大存活时间，默认3小时
    "port":"",// 服务 监听的端口，默认是 9001
}
```
以配置文件的形式启动： `shield --config config_file_path`

或者设置环境变量：

* MAX_COMMIT_EXIST_TIME
* POR


