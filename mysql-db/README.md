# mysql单实例

mysql镜像使用官方版本5.7

#部署

1. 把mysql部署到有mysql-db=true标签的节点上

```# kubectl label nodes $node_name mysql-db=true```

2. 运行k8s中的mysql部署脚本

```# kubectl apply -f ./k8s```