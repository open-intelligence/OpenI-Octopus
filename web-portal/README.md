# Webportal

The web font end of OPENI Platform

## Font-End Architecture

Please learn [Antd-Design](https://ant.design) and [Antd-Design Course](https://www.yuque.com/ant-design/course) for more detail.

## Development

```bash
$ yarn install
$ npm run dev
$ open the web browser and access http://localhost:9286/
```

## Deploy

##### 1.Configure docker insecure-registries

```
# vim /etc/docker/daemon.json

{
"insecure-registries":["192.168.202.74:5000"],
"live-restore":true
}
``` 


##### 2.restart docker

``systemctl restart docker``

##### 3.Build webportal

```
# cd webportal
# npm install
# npm run build:prod
# docker build -t 192.168.202.74:5000/openi/webportal .
# docker push 192.168.202.74:5000/openi/webportal
```

### 4. deploy
```
# kubectl label node $node openinode=worker
# kubectl apply -f ./k8s
```
