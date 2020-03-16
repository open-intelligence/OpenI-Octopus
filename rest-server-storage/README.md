# rest-server-storage

用来初始化restserver数据库，构建具有初始化数据的mysql镜像。mysql镜像使用官方版本5.7

## Dockerfile构建初始化数据库镜像

请参考[dockerhub mysql](https://hub.docker.com/_/mysql)中[Initializing a fresh instance]段落。

sql脚本存在一些执行规则：

- 多脚本会按照拼音顺序执行
- 当有挂载宿主机中的数据持久化目录，只有当该目录为空，初始化脚本才会执行。

## 源码编译部署


### 1.编译镜像

```
# cd rest-server-storage
# docker build -t $dockerRegistry/openi/restserver-mysql:latest .
# docker push $dockerRegistry/openi/restserver-mysql:latest
```
