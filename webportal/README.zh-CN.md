# Webportal

启智(OPENI)开源平台的网页前端

## 前端架构

请查看 [Antd-Design](https://ant.design) 和 [Antd-Design Course](https://www.yuque.com/ant-design/course)

## 如何开发

```bash
$ yarn install
$ npm run dev
$ 打开浏览器访问 http://localhost:9286/
```

## 部署

##### 1.配置docker私有仓库

```
# vim /etc/docker/daemon.json

{
"insecure-registries":["192.168.202.74:5000"],
"live-restore":true
}
```

##### 2.重启docker服务

``systemctl restart docker``


##### 3.编译

```
# cd webportal
# npm install
# npm run build:prod
# docker build -t 192.168.202.74:5000/openi/webportal .
# docker push 192.168.202.74:5000/openi/webportal
```

##### 4.k8s部署

```
kubectl apply -f ./k8s
```

