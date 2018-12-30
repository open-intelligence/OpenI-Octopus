# **Webportal**

webportal网络门户是任务和集群管理的入口。用户可以通过网络用户界面提交、监视或终止任务。集群操作员可以通过webportal查看和管理集群状态。

## 部署

服务部署中的 [readme](https://github.com/open-intelligence/OpenI/blob/master/service-deployment/README.md)文件介绍了包含Web Portal的整个安装过程。[clusterconfig.yaml](https://github.com/open-intelligence/OpenI/blob/master/service-deployment/clusterconfig-example.yaml)中下列参数是webportal所涉及的：

- `REST_SERVER_URI`: String, rest-server服务的url，例如：<http://10.0.3.9:9186>
- `GRAFANA_URI`: String, grafana 服务的url，例如： [http://10.0.3.9:9090](http://10.0.3.9:9090/)
- `K8S_DASHBOARD_URI`: String, kubernetes dashboard的url，例如：<http://10.0.3.9:9090>
- `SERVER_PORT`: Int, 启动WebPortal使用的端口, 例如：默认9286 

##  用法

###  提交任务

单击"Submit Job" （“提交任务”），显示一个按钮，要求您提交一个json文件。作业配置文件必须遵循 [job tutorial](https://github.com/open-intelligence/OpenI/blob/master/job-tutorial/README.md)中格式。

### 查看任务状态

单击"Job View" （“任务列表”），查看所有任务列表。单击每个任务可查看其详细的实时状态。

### 查看群集状态--仅admin用户

单击"Cluster View" （“群集视图”），查看整个群集的状态。注：

- Services服务：每台机器所有服务的状态。

- Hardware硬件：每台机器的硬件指标。

- K8s  Dashboard：Kubernetes仪表板。
- Cluster Dashboard：集群仪表板，可查看集群的资源使用情况。

