# Pylon: OPENI 入口

Pylon 是一项使用户能够通过一个集成的入口点访问 OPENI 功能的服务。对于 OPENI 平台来说这项服务是必需的：因为一般情况下集群都会被屏蔽在网关后面，其中只有少数跳转机器被暴露给外部。 在这种情况下，没有一个系统服务可以直接访问，因为只有跳转机器具有公共IP。 使用该系统的唯一方法是在这些跳转机器上设置 Pylon 作为内部服务和外部世界之间的代理。

##  内建重定向API
各种系统的的 APIs 能够通过 Pylon 进行访问，使用方式如下：

    http://<pylon_server>/<service>/api/<version>/...

#### 可用服务

- OPENI的 REST 服务器： `http://<pylon_server>/rest-server/api/v1/...`
- Kubernetes API 服务器：`http://<pylon_server>/kubernetes/api/v1/...`
- WebHDFS API 服务器：`http://<pylon_server>/webhdfs/api/v1/...`
- Prometheus API 服务器：  `http://<pylon_server>/prometheus/api/v1/...`

#### 举例说明

- REST 服务器 API： http://10.0.3.9/rest-server/api/v1/jobs
- Kubernetes API：http://10.0.3.9/kubernetes/api/v1/nodes
- WebHDFS API：http://10.0.3.9/webhdfs/api/v1/?op=LISTSTATUS
- Prometheus API：http://10.0.3.9/prometheus/api/v1/query?query=up

## 网络门户

以下网络门户能够通过 Pylon 进行访问：
- K8s dashboard:  `http://<pylon_server>/kubernetes-dashboard/`
- Yarn web portal: `http://<pylon_server>/yarn/`
- WebHDFS dashboard: `http://<pylon_server>/webhdfs/`
- Grafana: `http://<pylon_server>/grafana/`
- OPENI web portal: ` http://<pylon_server>/1

## 开发者教程

- Step 1：（在Windows命令行），执行以下批处理文件：
```
set REST_SERVER_URI=...
set K8S_API_SERVER_URI=...
set WEBHDFS_URI=...
set PROMETHEUS_URI=...
set K8S_DASHBOARD_URI=...
set YARN_WEB_PORTAL_URI=...
set GRAFANA_URI=...
set OPENI_WEB_PORTAL_URI=...
```
- Step 2： 执行 `python render.py`
- Step 3：将生成的`nginx.conf` 拷贝至配置文件夹内

## 部署到OPENI群集

在 service 配置目录下的 [readme](https://github.com/open-intelligence/openi/tree/master/pylon) 详细介绍了全部的安装过程。
此外，在[clusterconfig.yaml](https://github.com/open-intelligence/openi/tree/master/pylon) 配置文件中的如下参数应该确保被正确配置：
- rest_server_uri: 字符串， REST server 的根目录
- k8s_api_server_uri: 字符串， Kubernetes's API server 的根目录
- webhdfs_uri: 字符串，WebHDFS's API server 的根目录
- prometheus_uri: 字符串，Prometheus's API server 的根目录
- k8s_dashboard_uri: 字符串， Kubernetes dashboard 的根目录
- yarn_web_portal_uri: 字符串， Yarn web portal 的根目录
- grafana_uri: 字符串， Grafana 的根目录
- openi_web_portal_uri: 字符串， OPENI web portal 的根目录
- port: 正整数，Pylon service的端口号
