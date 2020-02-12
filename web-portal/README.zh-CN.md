# Webportal

启智(OpenI-Octopus)章鱼开源平台的网页前端

## 前端架构

请查看 [Antd-Design](https://ant.design) 和 [Antd-Design Course](https://www.yuque.com/ant-design/course)

## 如何开发

```bash
$ npm install
$ npm run dev
$ 打开浏览器访问 http://localhost:9286/
```

### 快速部署


1.给服务目标部署节点node加上label

```
# kubectl label nodes <node-name> openinode=worker
```

2. k8s集群中执行yaml部署

```
# kubectl apply -f ./k8s
```

### 源码编译部署

##### 1.编译镜像

```
# cd webportal
# npm install
# npm run build:prod
# docker build -t $dockerRegistry/openi/webportal:latest .
# docker push $dockerRegistry/openi/webportal:latest
```

##### 2.修改yaml文件
```
# cd k8s
# vim webportal.deploy.yaml
# 配置image的地址
```

##### 3.k8s部署


1.给服务目标部署节点node加上label

```
# kubectl label nodes <node-name> openinode=worker
```

2. k8s集群中执行yaml部署

```
# kubectl apply -f ./k8s
```


