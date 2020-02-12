# Webportal

The web font end of OpenI-Octopus Platform

## Font-End Architecture

Please learn [Antd-Design](https://ant.design) and [Antd-Design Course](https://www.yuque.com/ant-design/course) for more detail.

## Development

```bash
$ npm install
$ npm run dev
$ open the web browser and access http://localhost:9286/
```

## Quick Deploy

```
kubectl label node $node openinode=worker
kubectl apply -f ./k8s
```

## Deploy form building source code


##### 1.Build webportal image

```
# cd webportal
# npm install
# npm run build:prod
# docker build -t $dockerRegistry/openi/webportal:latest .
# docker push $dockerRegistry/openi/webportal:latest
```

##### 2. modified yaml file before deploy

```
# cd k8s
# vim webportal.deploy.yaml
# configure image address
```

##### 3. deploy
```
# kubectl label node $node openinode=worker
# kubectl apply -f ./k8s
```
