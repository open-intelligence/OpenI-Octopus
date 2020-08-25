#　部署文档

# 一. 如何构建?

编译为docker镜像：`sudo docker build -t rest-server-plugin:version .`

# 二. 如何运行?

## 支持环境变量

环境变量列表:

* `MYSQL_HOST` : 数据库地址
* `MYSQL_PORT` : 数据库端口
* `MYSQL_USER` : 数据库用户
* `MYSQL_PWD`  : 数据库密码
* `DEBUG_JOB_MAX_RUN_TIME` : Debug任务最大运行时间/秒
* `WORK_IN_K8S_CLUSTER`    : `YES` or `NO`
* `TASKSET_CORE_HOST`      : Pipeline组件服务地址
* `TASKSET_CORE_ACCESS_TOKEN` : Pipeline组件服务访问令牌
* `IMAGE_POD_DISCOVERY`       : poddiscovery镜像地址
* `SHARE_DIRECTORY`           : 共享目录路径


## 使用helm启动

通过按需求修改 `./charts/rest-server-plugin/value.yaml` 文件中的配置

```
// 安装
helm install octopus ./charts/rest-server-plugin
```