# jupyterlab-proxy

jupyter lab uniform proxy

# Prerequisite

we assume the follow points:
 
1. jupyter lab service is running in "http://ip:80"

2. jupyter lab service have setted --LabApp.base_url="/jpylab"

3. jupyter lab service can login with url "http://ip:80/jpylab/lab?token=xxxxxxx"

4. we have known the token

# How jupyterlab-proxy work

1. jupyterlab-proxy is a http server use node.js express framework.

2. when it receive a http req with url("http://$APISERVER_IP/jpylab/lab?token=$token&target=$ip"), jupyterlab-proxy will send this http req to the target ip

3. The taget jupyter lab service will response

4. jupyterlab-proxy will set a cookie("jpyip=$ip") in the jupyterlab service response

5. Then user will get a html page, in this page many jupyter lab request haved base url (/jpylab) with cookies("jpyip=$ip") will send to jupyterlab-proxy

6. jupyterlab-proxy will parse the cookie ("jpyip=$ip"), get the target ip, continus send these requests to the target jupyter lab service

# jupyterlab-proxy ENV

* DefaultTarget : what default target(ip:port) will http reqest should be forward to

* SERVER_PORT : jupyterlab-proxy server port

# deploy

1. docker build -t zhangshuiyong/jpylabproxy:latest .

2. docker push zhangshuiyong/jpylabproxy:latest

3. login k8s master server

4. kubectl apply -f ./k8s-deploy
