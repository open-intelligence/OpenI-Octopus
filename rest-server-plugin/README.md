# rest-server-plugin

此服务主要包含基于Octopus TasksetPipeline组件的插件原理实现的若干Feature插件服务,现阶段包括功能插件有:

- Debug类型的任务定时停止
- 多子任务之间相互感知
- 任务信息翻译为Taskset模板
- 多子任务批调度启动PodGroup

## 开发

更详细内容请参考 [egg docs][egg]

```bash
$ npm i
$ npm run dev
$ open http://localhost:8083/
```

## 部署

1. 打包镜像

    ```
    $ docker build -t openi/rest-server-plugin:version .
    ```

2. 部署到k8s集群

   通过按需求修改 `./charts/rest-server-plugin/value.yaml` 文件中配置
  
    ```
    // 安装
    helm install octopus ./charts/rest-server-plugin
    ```

[egg]: https://eggjs.org