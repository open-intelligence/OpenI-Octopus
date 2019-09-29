# REST Server

## REST Server 是什么?

rest服务器公开了一组允许您管理作业的接口。
它是一个基于egg.js的node.js API服务，用于将客户端请求传递到不同的上游服务，
您可以查看[egg docs][egg]了解更多详细信息。

## 运行时要求

要在系统上运行rest服务器，需要安装[node.js](https://nodejs.org) 10.15+运行时，并安装[npm](https://www.npmjs.com/)。

## 结构
```
|-- rest-server
    |-- app
        |-- controller                  -- 控制层
        |-- controllerSchema            -- 控制规格
        |-- error                       -- 异常错误定义
        |-- extend                      -- 扩展
        |-- middleware                  -- 中间件层
        |-- model                       -- 数据访问层
        |-- routes                      -- 路由绑定
        |-- schedule                    -- 定时任务
        |-- service                     -- 服务层
        |-- tpl                         -- 模板
        |-- route.js                    -- 路由规则
    |-- config
        |-- config.default.js           -- 默认配置
        |-- config.local.js             -- 本地开发配置
        |-- config.prod.js              -- 正式环境配置
        |-- config.unitest.js           -- 单元测试配置
        |-- plugin.js                   -- 插件配置
    |-- run                             -- 运行时上下文
    |-- test                            -- 单元测试
    |-- util                            -- 工具代码
    |-- agent.js                        -- agent启动入口
    |-- app.js                          -- app启动入口
    |-- package.json
```

## 依赖项

要启动rest-server服务器服务，应准备好并正确配置启动以下服务。

* obtopus/rest-server-storage
* obtopus/framework-controller
* docker

## 快速开发

### 开发模式

如果rest-server服务需要作为独立服务部署在本地计算机中，则需要修改config/config.local.js中的配置信息，然后：
```bash
$ npm i
$ npm run dev
$ open http://localhost:9185/

# API 文档
$ open http://localhost:9185/public/apidoc
```

[egg]: https://eggjs.org

## 部署模式

### 配置
如果rest-server服务需要作为独立服务部署到生产环境中，则需要从config/config.prod.js中的系统环境变量中检索一些配置项，您需要在系统环境中进行设置：

* `EGG_SERVER_ENV`: 设置为 `prod`
* `NODE_ENV`: 设置为 `production`
* `K8S_API_SERVER`: k8s集群的apiservice地址
* `K8S_CONFIG`: kubeconfig路径, 例如: `/home/XXX/.kube`
* `IMAGE_FACTORY_URI`: obtopus/image-factory-shield地址+端口.
* `IMAGE_FRAMEWORKBARRIER`: 设置为 `frameworkcontroller/frameworkbarrier`
* `MYSQL_HOST` : obtopus/rest-server-storage的mysql地址.
* `MYSQL_PORT`: obtopus/rest-server-storage的mysql端口.
* `MYSQL_USER`: obtopus/rest-server-storage的mysql用户名.
* `MYSQL_PWD`: obtopus/rest-server-storage的mysql密码.
* `DOCKER_REGISTRY_ADDR`: Docker仓库地址,例如 harbor server..
* `DOCKER_USER`: Docker仓库用户名。
* `DOCKER_PASSWORD`: Docker仓库密码.
* `ENABLED_API_DOC`: `YES` 或者 `NO`.

### Docker镜像

通过以下构建镜像:

```bash
$ docker build -f Dockerfile -t ${image name} .
```

设置镜像运行的系统环境变量:

```bash
$ docker run -p 8195:8195 -e EGG_SERVER_ENV=prod ... -d ${image name}
```

如果需要在k8s中运行，请在k8s清单配置文件中配置它。

### k8s

当您需要在k8s中运行服务时，可以根据清单文件`build/k8s/rest server.yaml`来执行它。

```bash
# Modify the placeholder `${xxx}` configuration item in the file
$ kuberctl apply -f build/k8s/rest-server.yaml
```

发布成功后可以通过 http://${ip}/rest-server/ 访问

## 高可用

rest-server是一个无状态服务，因此可以扩展它以获得高可用性，而无需任何额外操作。