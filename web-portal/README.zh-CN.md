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

## 源码编译部署

### 1.编译镜像

```
# cd webportal
# npm install
# npm run build:prod
# docker build -t $dockerRegistry/openi/webportal:latest .
# docker push $dockerRegistry/openi/webportal:latest
```

### 2 使用helm启动

通过按需求修改 `./charts/web-portal/value.yaml` 文件中的配置

```
// 安装
helm install octopus ./charts/web-portal
```


