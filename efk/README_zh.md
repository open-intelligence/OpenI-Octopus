# 简介

openi章鱼filebeat + elasticsearch方案收集子任务对应的容器的日志

# 方案

1. 在每个节点上部署elasticsearch分布式文本存储服务，组成es集群

2. 配置es服务的ingress，通过网关服务访问es集群服务

3. 部署filebeat收集每个节点的容器日志，配置filebeat的日志接收后端为es集群

3. webportal访问es集群，给定容器ID参数，可以搜索出特定的容器日志

请求例子：

POST http://$GatewayIP/es/_search
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

# 镜像

1. es-$nodename-statefulset.yml => elastic/elasticsearch:7.1.0

2. filebeat-kubernetes.yaml => docker.elastic.co/beats/filebeat:7.1.0


# 前提

1.Kubernetes version >= 1.13

2.设置节点的主机名，本文档假设集群有两个节点

* 设置master节点的主机名 

[root@host1 ~]# hostname xp001

* 设置第二个加入节点的主机名

[root@host1 ~]# hostname v001

* 重启kubelet

[root@host1 ~]# systemctl restart kubelet


# [部署](https://www.elastic.co/guide/en/elasticsearch/reference/current/docker.html)

1. 节点准备用户组:用户和处理对外映射的es数据文件夹

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

2. cd openi

3. kubectl apply -f ./efk