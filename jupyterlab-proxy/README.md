# jupyterlab-proxy

jupyter lab 统一代理

# 作用

JupyterLab是一种软件服务，可以以网页形式向用户提供软件源代码编辑/文件上传/命令远程执行等服务。

基于K8s的系统，可以同时运行多个JupyterLab服务，通过JupyterLab统一代理可以同时向不同的用户提供JupyterLab服务。

JupyterLab服务的代理方法，使得基于K8s的后端系统只需配置打开一个外部端口，就可以同时向不同的在线用户提供JupyterLab软件服务。

所有在线用户共用这个外部端口，便可访问到系统中服务于不同在线用户的JupyterLab服务。

系统同时打开的服务器外部端口数量就不需要随着在线用户的增加而增加。系统的安全性增加，复杂度降低，可管理性增加。

# 如何工作

#### 方案需要后端 + 浏览器协同工作 

#### 一、后端

##### 1、部署一个K8s集群

集群可以是单mater节点集群、单master多node集群、多master多node集群

##### 2、在K8s集群中部署网络插件

集群的网络插件负责完成Pod与Pod的通信。K8s网络插件种类不限（可以是calico、flannel等K8s网络插件）。这样JupyterLab统一代理服务就能访问到服务于用户的JupyterLab服务（详情可以看6步骤）

##### 3、在K8s集群中部署API网关服务

K8s API网关服务的种类不限，（不限制使用哪种API网关服务nginx-ingress,traffik）。API网关服务通过K8s Daemonset部署方式，配置一个对外服务端口（端口自定义，例如80)。成功运行在K8s集群后，访问http://$nodeIP:$Port (如果端口配置为80，直接访问http://$nodeIP)，用户就可以向API网关服务发请求。API网关服务配合指定的网关入口配置资源Ingress（详细看5步骤），就可以知道将请求转发到哪个内部域名服务（K8s service）（详细看7步骤）。

##### 4、为每一个用户在K8s集群中启动一个JupyterLab服务

K8s集群中启动服务的最小单位是Pod，JupyterLab服务启动成功后一定是一个Pod，会被分配到一个$PodIP。Pod中通过Docker容器+容器启动命令来启动JupyterLab服务。Docker容器启动命令的格式如下：

pip install jupyterlab;jupyter lab --no-browser --ip=0.0.0.0 --allow-root --notebook-dir="$JupyterLabDir" --port=$JupyterLabPort --LabApp.base_url="$JupyterLabBaseUrl" --LabApp.allow_origin="self $JupyterLabDomain"


如上命令有4个变量，这4个变量的配置会对以下步骤有影响。以下是这4个变量的解释：

1. $JupyterLabDir : 是JupyterLab服务向用户开放的文件目录，可配置。用户创建的代码文件可以保存到该目录，也可以从该目录中打开和上传文件。
2. $JupyterLabBaseUrl : 是JupyterLab服务的根访问路径，可配置。自定义一个特殊的根访问路径，可以区分集群其他服务的访问请求。例如：/jpylab
3. $JupyterLabPort : 是JupyterLab服务的服务端口，可配置。例如：配置成80，JupyterLab服务正常启动后，配合2中配置的根访问路径，就K8s集群内部可以通过http://$PodIP/$JupyterLabBaseUrl/ 访问到JupyterLab服务
4. $JupyterLabDomain : 是JupyterLab服务的访问域名，可配置。jupyterLab服务的界面可能需要内嵌到HTML的<iframe>标签中，做成内嵌页面，这种场景下需要配置父页面的域名。


JupyterLab服务是基于用户的，JupyterLab服务的容器启动成功后会在容器日志中打印出登录JupyterLab的一个令牌$Token，用户在浏览器中以这个登录令牌$Token和$PodIP作为参数，就可以直接登录JupyterLab服务，JupyterLab的代码编辑器网页会显示在用户浏览器中，用户就能正常使用JupyterLab服务进行代码编辑，文件上传，远程命令执行

##### 5、基于3步骤的K8s API网关服务，需要配置K8s集群中的网关入口配置资源Ingress。

我们在本步骤需要定义一个Ingress告诉K8s集群API网关服务什么路径的请求应该转发到JupyterLab统一代理服务（详情看6步骤）的。在Ingress中，需要为JupyterLab统一代理服务定义一个唯一的请求路径$Path（例如/jpylab）和 JupyterLab统一代理服务的内部域名服务（K8s service）的名字（详情看7步骤），目的是为了告诉K8s集群API网关服务，凡是接收到请求路径是$Path（例如/jpylab）的请求，都会将该请求转发到JupyterLab统一代理服务的内部域名服务，内部域名服务再将该请求转发到JupyterLab统一代理服务中，JupyterLab统一代理服务给所有用户代理，解析请求中$PodIP和$Token，为用户把请求发送到真正的目的地——服务于特定用户的JupyterLab服务（详情看4步骤）。配置网关入口配置资源Ingress，定义JupyterLab统一代理服务的唯一的请求路径$Path，需要做一个关键操作，要令$Path等于启动JupyterLab服务时配置的根访问路径$JupyterLabBaseUrl。这步操作对6的步骤的第二个阶段起关键作用



##### 6、在K8s集群中部署JupyterLab的统一代理服务

该JupyterLab统一代理服务可以反向代理每一个用户对K8s集群中的JupyterLab服务的访问请求。根据JupyterLab统一代理服务的设计，需要处理两个阶段的请求:




##### 6.1、JupyterLab的登录阶段请求：

由于4步骤配置了JupyterLab统一代理服务的请求路径$Path（例如: /jpylab )，JupyterLab统一代理服务接收到传入的2个参数，JupyterLab服务的$PodIP和登录令牌$Token。由于JupyterLab统一代理服务是K8s集群的一个Pod，JupyterLab统一代理服务可以通过登录地址(http://$nodeIP/$Path/lab/?token=$Token&target=$PodIP) JupyterLab统一代理服务接收到返回响应，响应中有JupyterLab编辑器的网页，返回到用户浏览器，用户会可以看到JupyterLab的网页编辑器。JupyterLab统一代理服务接收到返回响应还额外做一个关键操作，把JupyterLab服务的$PodIP设置到返回响应的cookies中，当用户浏览器接收到返回响应数据包，会自动将cookies保存到浏览器中，会在第二个阶段起作用。

##### 6.2、JupyterLab的登录后使用阶段请求：

在第一阶段登录成功后，JupyterLab的网页编辑器显示在浏览器，并且JupyterLab服务的$PodIP通过cookies设置到用户浏览器中。由于配置网关入口配置资源Ingress（详情看5步骤）时，定义了JupyterLab统一代理服务的唯一的请求路径$Path等于启动JupyterLab服务时配置的根访问路径$JupyterLabBaseUrl，当JupyterLab的网页编辑器登录后，会自发地向集群API网关服务发送各种请求，请求以/$Path为根路径发送请求。因为第一阶段登录成功了并且会自动带上JupyterLab服务的$PodIP的cookies信息。这样，API网关服务就可以根据$Path根路径准确地把请求转发到JupyterLab统一代理服务的内部域名服务(详情看7步骤）中, 然后到内部域名服务再负载均衡到JupyterLab统一代理服务，JupyterLab统一代理服务解析请求中携带的cookies，找到JupyterLab服务的$PodIP。JupyterLab统一代理服务就能通过请求地址（http://$PodIP/$Path/$SubPath）请求到JupyterLab服务，返回对应的响应。其中$SubPath代表就是JupyterLab的网页编辑器在浏览器中产生的各种请求的子路径。


##### 7. 在K8s集群中部署JupyterLab的统一代理服务对应的唯一内部域名服务（K8s service）。

K8s 集群中启动内部域名服务实例，需要自定义一个service资源，设定一个唯一的名字，并且可以利用标签（K8s label）绑定1个或者多个JupyterLab的统一代理服务的副本。由于JupyterLab统一代理服务是无状态的，可以有1个或者多个JupyterLab的统一代理服务副本（以Pod形式运行）同时运行，内部域名服务可以提供负载均衡和内部域名。所谓内部域名即在K8s集群中的，内部具体服务的Pod都可以使用该K8s service实例的名字当作内部域名，向JupyterLab的统一代理服务发送请求。该K8s service实例可以对发向JupyterLab统一代理服务的请求提供负载均衡功能，就可以把请求转发到不同的JupyterLab统一代理服务的副本中处理。



#### 二、浏览器

##### 1、根据5和6步骤，该方法需要浏览器cookies功能配合。

浏览器cookies功能是默认启用的，如果被禁用了需要启用


# jupyterlab-proxy ENV

* DefaultTarget : 默认的统一代理前向请求转发的目的地(ip:port)

* SERVER_PORT : jupyterlab-proxy 的服务端口

# 快速部署


1.给服务目标部署节点node加上label

```
# kubectl label nodes <node-name> openinode=worker
```

2. k8s集群中执行yaml部署

```
# kubectl apply -f ./k8s
```

### 源码编译部署


### 1.编译镜像

```
# docker build -t $dockerRegistry/openi/jpylabproxy:latest .

# docker push $dockerRegistry/openi/jpylabproxy:latest
```

### 2. 配置yaml

```
# cd k8s
# vim jpylab-proxy.yaml
# 配置image地址
```

### 3.k8s部署

1.给服务目标部署节点node加上label

```
# kubectl label nodes <node-name> openinode=worker
```

2. k8s集群中执行yaml部署

```
# kubectl apply -f ./k8s
```
