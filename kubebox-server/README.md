# Kubebox-server
 此项目是基于 [astefanutti/kubebox](https://github.com/astefanutti/kubebox)项目的[server分支](https://github.com/astefanutti/kubebox/tree/server)的二次开发版本
 
## Features

* [x] 针对k8s集群pod方式部署,增加以ServiceAccount方式通讯ApiService
* [x] 资源组件的权限空
* [x] 基于k8s Ingress的服务访问动态配置

## Development

基于$HOME/.kube的配置，无需做其他配置。
```bash
~/kubebox-server$ node ./server.js
```
切换集群,直接通过kubectl切换即可：
```bash
~/kubebox-server$ kubectl config use-context ${context}
```
## Deployment
### Build and Push image
```bash
~/kubebox-server$ Docker build -t ${kubebox-server-name} -f ./build/Dockerfile .
~/kubebox-server$ Docker push ${kubebox-server-name}
```
### Preinstall
集群需要安装 [nginx-ingress-controller](https://kubernetes.github.io/ingress-nginx/deploy/#prerequisite-generic-deployment-command),通过项目安装可以运行：
```bash
~/kubebox-server$ kubectl apply -f ./build/ingress-nginx.yaml
```
ingress-nginx对外开放参考：
默认以DaemonSet启动
```bash
  ports:
    - name: http
      containerPort: 80
      hostPort: 80
    - name: https
      containerPort: 443
      hostPort: 443
```

### Deploy in k8s
```bash
~/kubebox-server$ kubectl apply -f ./build/kubebox-server.yaml
```
发布成功后可以通过 http://${nodeip}/terminal/ 访问。