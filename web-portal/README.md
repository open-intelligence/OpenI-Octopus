# Webportal

The web font end of OpenI-Octopus Platform

## Font-End Architecture

Please learn [Antd-Design](https://ant.design)

## Development

```bash
$ npm install
$ npm run dev
$ open the web browser and access http://localhost:9286/
```

## Quick Deploy

### 1.Build webportal image

```
# cd webportal
# docker build -t $dockerRegistry/openi/webportal:latest .
# docker push $dockerRegistry/openi/webportal:latest
```

### 2. Deploy in K8s

Modify the configuration in the `/charts/web-portal/value.yaml` file as required

```
// install
helm install octopus ./charts/web-portal
```

After publishing successfully, you can access through http://${ip}/