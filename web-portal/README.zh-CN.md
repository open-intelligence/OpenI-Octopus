# Webportal

启智(OpenI-Octopus)章鱼开源平台的网页前端

## 前端架构

请查看 [Antd-Design](https://ant.design)

## 如何开发

```bash
$ npm install
$ npm run dev
$ 打开浏览器访问 http://localhost:9286/
```

## 快速部署

### 1.编译镜像

```
# cd webportal
# docker build -t $dockerRegistry/openi/webportal:latest .
# docker push $dockerRegistry/openi/webportal:latest
```

### 2.k8s部署

通过按需求修改 `./charts/web-portal/value.yaml` 文件中的配置

```
// 安装
helm install octopus ./charts/web-portal
```

发布成功后可以通过 http://${ip}/ 访问


