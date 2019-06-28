# 简介

openi章鱼使用grafana展示子任务的性能指标

# 方案

1. 部署grafana的pod，设置grafana的root_url为/grafana

2. 部署grafana的k8s的服务映射到grafana的pod

3. 由于grafan服务需要被Webportal调用，需要还要部署grafana的ingress映射到grafana的服务
通过nginx-ingress-controller网关来统一代理webprotal调用grafana展示子任务性能指标的请求

4. 导入TaskMetrics.json作为子任务的dashboard

5. 请求子任务的性能指标：http://$APISERVERIP/grafana/d/Ncm6Cf7Zz/taskmetrics?refresh=10s&orgId=1&var-pod=$task_pod_name

# 镜像

1. grafana-deploy.yml => grafana/grafana:5.1.0

# 前提

1.Kubernetes version >= 1.13

2.给k8s节点node打label

kubectl label nodes <gpu-node-name> hardware-type=NVIDIAGPU


# 部署

1. cd openi

2. kubectl apply -f ./grafana