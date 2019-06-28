# Pylon: OPENI 入口

Pylon 是一项使用户能够通过一个集成的入口点访问 OPENI 功能的服务。
对于 OPENI 平台来说这项服务是必需的：因为一般情况下集群都会被屏蔽在网关后面，其中只有少数跳转机器被暴露给外部。
在这种情况下，没有一个系统服务可以直接访问，因为只有跳转机器具有公共IP。 使用该系统的唯一方法是在这些跳转机器上设置 Pylon 作为内部服务和外部世界之间的代理。

##  内建重定向API
各种系统的的 APIs 能够通过 Pylon 进行访问，使用方式如下：

    http://<pylon_server>/<service>/api/<version>/...

#### 可用服务
- Webportal 服务： `http://<pylon_server>/openi/...`
- Restserver API服务： `http://<pylon_server>/rest-server/api/v1/...`
- Elasticsearch API服务：`http://<pylon_server>/es/...`
- grafana API服务：`http://<pylon_server>/grafana/...`

#### 举例说明
- Webportal 服务： http://10.0.3.9/openi/
- Restserver API服务： http://10.0.3.9/rest-server/api/v1/jobs
- Elasticsearch API服务：http://10.0.3.9/es/_search
- grafana API服务：http://10.0.3.9/grafana/d/ft1oaQnWk/clustermetrics?orgId=1&from=now-5m&to=now&var-Node=All

## 部署

cd openi

kubectl apply -f ./pylon
