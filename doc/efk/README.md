# 简介

openi章鱼filebeat + elasticsearch方案收集子任务对应的容器的日志

# 方案

#### 1. Docker的容器日志

容器中的应用产生的日志默认都输出到stdout和stderr中, 可以通过docker logs来访问

Docker为容器日志提供了多种实现机制称为logging driver, 通过docker info可以查看本机使用的logging driver，默认为json-file

logging driver = json-file形式下，每个容器的日志默认以json格式存储在/var/lib/docker/containers/<$containerID>/<$containerID>-json.log

下面两种情况使用docker logs看不到容器应用的日志

- 容器内的应用实现了自己的日志输出, 记录到不同的文件，而不是打到标准输出和错误输出

- 使用不同的logging driver将日志送到了文件、外部服务器、数据库等集中的日志后台

#### 2. Kubernetes的日志处理

Kubernetes的日志管理方式与Docker有所不同，因为容器封装在Pod中，当遇到Pod被删除或者Node节点故障的情况下，日志会被删除。单纯依靠Docker本身的日志机制将无法在Pod删除后/故障后查询日志，因此在管理集群时需要认真考虑日志的管理问题

#### 3.K8s官方推荐的集群级别日志管理架构

![image](https://note.youdao.com/yws/api/personal/file/WEB24d8786572115d6da56e32ae39f68106?method=download&shareKey=c851fb6fbd9e27c475e3aba00961320d)

#### filebeat + elasticsearch方案

- 日志记录代理（logging-agent）：filebeat，logstash

- 日志记录后台（logging-backend）: elasticsearch集群多节点版

- 在每个节点上部署elasticsearch分布式文本存储服务，组成es集群

- 配置es服务的ingress，通过网关服务访问es集群服务

- 部署filebeat收集每个节点的容器日志，配置filebeat的日志接收后端为es集群

- webportal访问es集群，给定容器ID参数，可以搜索出特定的容器日志

请求例子：

POST http://$nodeIP/es/_search
```
{

    method:'POST',
    
    body:{
    
        query: {
        
            match:{
            
                "log.file.path": "/var/lib/docker/containers/$containerId/$containerId-json.log"
            
            }
        
        },
        size:pageSize,
        
        from:logIndex,
        
        sort: "log.offset"
        
}
```

### 日志记录代理filebeat

1. **filebeat**:   EFK/EFLK stack, 日志收集推荐选择使用Filebeat替代Logstash（启动大概要消耗500M内存），经测试单独启动Filebeat容器大约会消耗12M内存，比起logstash相当轻量级

2. **容器就绪和云端就绪**:   在 Kubernetes、Docker 或云端部署中部署 Filebeat，即可获得所有的日志流：信息十分完整，包括日志流的 pod、容器、节点、VM、主机以及自动关联时用到的其他元数据

3. **背压敏感协议**—不会导致您的管道过载：当将数据发送到 Logstash 或 Elasticsearch 时，Filebeat 使用背压敏感协议，以应对更多的数据量。如果 Logstash 正在忙于处理数据，则会告诉 Filebeat 减慢读取速度。一旦拥堵得到解决，Filebeat 就会恢复到原来的步伐并继续传输数据。

### 日志记录后台Elasticsearch

可以查看[Elasticsearch官网](https://www.elastic.co/cn/products/elasticsearch)了解其特性

# 镜像

1. es-statefulset.yml 采用镜像版本为 elastic/elasticsearch:7.1.0+

2. filebeat-kubernetes.yaml 采用镜像版本为 docker.elastic.co/beats/filebeat:7.1.0+

# 前提

1.Kubernetes version >= 1.13

# 部署

1. 给es数据存储节点打上label

    ```
    kubectl label nodes <node-name> octopus.openi.pcl.cn/log-service-es="yes"
    ```

2. 存储节点准备用户组:用户和处理对外映射的es数据文件夹

    ```
    # sudo su 
    # mkdir /usr/share/elasticsearch
    # chmod 0775 /usr/share/elasticsearch
    # chown -R 1000:0 /usr/share/elasticsearch
    ```

    如果没有这个1000用户id，需要创建一个用户

    ```
    # adduser -u 1000 -G 0 -d /usr/share/elasticsearch elasticsearch
    # chown -R 1000:0 /usr/share/elasticsearch
    ```

3. 通过按需求修改 `./charts/log-factory/value.yaml` 文件中的配置
   
   ```
   // 安装
   helm install octopus ./charts/log-factory
   ```
   
   发布成功后可以通过 http://${ip}/es/ 访问