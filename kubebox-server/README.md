# Kubebox-server
 此项目是基于 [astefanutti/kubebox](https://github.com/astefanutti/kubebox)项目的[server分支](https://github.com/astefanutti/kubebox/tree/server)的二次开发版本。
 实现了k8s环境下的访问pod容器的web虚拟终端。
 
## 特性

* [x] 针对k8s集群pod方式部署,增加以ServiceAccount方式通讯ApiService
* [x] 资源组件的权限控制
* [x] 基于k8s Ingress的服务访问动态配置

## 开发模式

本地环境安装了`kubectl`，并且可以与k8s集群通讯，基于`$HOME/.kube`的配置，无需做其他配置。
```bash
~/kubebox-server$ node ./server.js
```
切换集群,直接通过kubectl切换即可：
```bash
~/kubebox-server$ kubectl config use-context ${context}
```
## 部署模型
### Docker镜像
```bash
~/kubebox-server$ Docker build -t ${kubebox-server-name} -f ./Dockerfile .
~/kubebox-server$ Docker push ${kubebox-server-name}
```

### 部署
```bash
# Modify the placeholder `${xxx}` configuration item in the file
~/kubebox-server$ kubectl apply -f ./build/kubebox-server.yaml
```
发布成功后可以通过 http://${nodeip}/terminal/ 访问。