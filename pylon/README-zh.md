# Pylon: OPENI 入口

Pylon 是一项使用户能够通过一个集成的入口点访问 OPENI 章鱼系统的各个服务。
对于 OPENI 章鱼平台来说这项服务是必需的：因为一般情况下集群都会被屏蔽在网关后面，其中只有少数跳转机器被暴露给外部。
在这种情况下，没有一个系统服务可以直接访问，因为只有跳转机器具有公共IP。 使用该系统的唯一方法是在这些跳转机器上设置 Pylon 作为内部服务和外部世界之间的代理。

##  内建重定向API
OpenI系统的的 APIs 能够通过 Pylon 进行访问，使用方式如下：

    http://$nodeip/<service>/api/...

#### 可用服务
- Webportal 服务： `http://$nodeip/openi/...`
- Restserver API服务： `http://$nodeip/rest-server/api/v1/...`
- Elasticsearch API服务：`http://$nodeip/es/...`
- grafana API服务：`http://$nodeip/grafana/...`

#### 举例说明，nodeip = 10.0.3.9
- Webportal 服务： http://10.0.3.9/openi/
- Restserver API服务： http://10.0.3.9/rest-server/api/v1/jobs
- Elasticsearch API服务：http://10.0.3.9/es/_search
- grafana API服务：http://10.0.3.9/grafana/d/ft1oaQnWk/clustermetrics?orgId=1&from=now-5m&to=now&var-Node=All

## 部署
```
# cd pylon

# kubectl apply -f .
```
