# Pylon: OPENI Universal Entry Point

Pylon is a service that enables users to access OPENI-octopus functionalities through a single integrated entry point. This service is necessary particularly in a common situation: the cluster is shielded behind a gateway in which only a few jump machines are exposed. In this situation, none of the system services can be accessed directly because only the jump machines have public IPs. The only way to use the system is to setup Pylon on these jump machines as a proxy between the internal services and the outside world.

## Built-In Redirected APIs

APIs of various system components can also be accessed via Pylon. Usage:

```
http://$nodeip/<service>/api/...
```

Available services:
- Webportal service： `http://$nodeip/openi/...`
- Restserver API service: `http://$nodeip/rest-server/api/v1/...`
- Elasticsearch API service：`http://$nodeip/es/...`
- grafana API service：`http://$nodeip/grafana/...`

For example: nodeip = 10.0.3.9

- Webportal service： http://10.0.3.9/openi/
- Restserver API service： http://10.0.3.9/rest-server/api/v1/jobs
- Elasticsearch API service：http://10.0.3.9/es/_search
- grafana API service：http://10.0.3.9/grafana/d/ft1oaQnWk/clustermetrics?orgId=1&from=now-5m&to=now&var-Node=All


### Deploy
```
cd pylon

kubectl apply -f .
```
