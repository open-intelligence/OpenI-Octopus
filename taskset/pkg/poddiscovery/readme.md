# Pod Discovery

该项目解决同一个TaskSet下不同pod之间的相互发现问题。

>基于该方案，用户在提任务之前就可以确切知道各个Pod的访问地址

## 功能特性

* 任务启动前既可预知各个Pod的访问地址
* 因副本重试造成的Pod地址变更　能做到用户业务层代码无感知


## 一. 方案描述

该方案将同一个hosts文件挂载到所有pod的`/etc/hosts`路径，在初始化容器里
将各个Pod的IP与名称之间的映射写入到这个hosts文件，以此来提供不同pod间的相互感知能力。

> 该方案暗示用户集群的所有计算节点都有一个公共的共享文件目录（基于NFS或者其他）。

## 二. 例子

```yaml
apiVersion: octopus.openi.pcl.cn/v1alpha1
kind: TaskSet
metadata:
  name: poddiscoverydemo
spec:
  retryPolicy:
    retry: false
    maxRetryCount: 1
  roles:
    - name: role1
      replicas: 1
      completionPolicy:
        maxFailed: 1
        minSucceeded: 1
      template:
        spec:
          restartPolicy: Never
          containers:
            - name: worker
              image: busybox
              command: ["sh","-c","sleep 1d;exit 0"]
              volumeMounts:
                - name: sharehosts
                  mountPath: /etc/hosts #共享的hosts
                  readOnly: true
          serviceAccountName: poddiscovery
          initContainers:
            - name: poddiscovery
              image: yyrdl/poddiscovery:v0.0.3
              command: ["sh","-c","/app/poddiscovery"]
              volumeMounts:
                - name: sharehosts
                  mountPath: /etc/hosts #共享的hosts
                  readOnly: false
                - name: sharetemphosts
                  mountPath: /etc/hosts_json.json #poddiscovery直接共享的临时hosts文件
                  readOnly: false
          volumes:
            - name: sharehosts
              hostPath:
                path: /open/share/hosts #共享的hosts文件在计算节点上共享目录的位置
                type: FileOrCreate
            - name: sharetemphosts
              hostPath:
                path: /open/share/hosts_json.json
                type: FileOrCreate
    - name: role2
      replicas: 2
      completionPolicy:
        maxFailed: 1
        minSucceeded: 1
      template:
        spec:
          restartPolicy: Never
          containers:
            - name: worker
              image: busybox
              command: ["sh","-c","sleep 1d;exit 0"]
              volumeMounts:
                - name: sharehosts
                  mountPath: /etc/hosts
                  readOnly: true
          serviceAccountName: poddiscovery
          initContainers:
            - name: poddiscovery
              image: yyrdl/poddiscovery:v0.0.3
              command: ["sh","-c","/app/poddiscovery"]
              volumeMounts:
                - name: sharehosts
                  mountPath: /etc/hosts
                  readOnly: false
                - name: sharetemphosts
                  mountPath: /etc/hosts_json.json
                  readOnly: false
          volumes:
            - name: sharehosts
              hostPath:
                path: /open/share/hosts
                type: FileOrCreate
            - name: sharetemphosts
              hostPath:
                path: /open/share/hosts_json.json
                type: FileOrCreate

```

初始化容器poddiscovery负责将ip地址映射写入到hosts文件.

该例子下,hosts文件最终内容:

```
127.0.0.1 localhost
::1     localhost ip6-localhost ip6-loopback
fe00::0 ip6-localnet
fe00::0 ip6-mcastprefix
fe00::1 ip6-allnodes
fe00::2 ip6-allrouters
172.17.0.6   role1-0
172.17.0.8   role2-0
172.17.0.7   role2-1
```

`172.17.0.6   role1-0` 、`172.17.0.8   role2-0`、`172.17.0.7   role2-1`即该任务的三个pod的地址映射。

## 三. 地址映射规则

`PodIp  ${RoleName}-${ReplicaIndex}`

映射的IP地址为Pod的clusterIP,对应的名字为Role的名字加上该Pod的副本编号，如果某个Role有３个副本，则副本编号是从0到2。

>因此在提交任务之前，用户就可以确定各个副本的访问地址.


## 四. 依赖


1.  计算节点需要有共享的公共目录（挂载的公共目录）,用来放置公共的hosts文件，确保同一个任务下的各个Worker访问到的都是同一个hosts文件.


2. poddiscovery有从k8s获取taskset的权限，有创建,更新，监听,删除[lease](https://github.com/kubernetes/kubernetes/blob/master/pkg/apis/coordination/types.go#L26)的权限

>　在上面的例子中是通过serviceAccountName实现的，poddiscovery是从集群启动；poddiscovery也可以从配置文件启动，这种方式不用设置serviceAccountName。


## 五. 编译

１）　编译docker镜像

命令: `sudo ./build/poddiscovery/docker_build.sh -t your/tag`


2 )　编译可以执行文件

`go version >= 1.13`

命令: `go build ./main/poddiscovery`


## 六.　运行

1 ) 　从集群内启动

首先创建serviceAccount:

命令 :`kubectl create serviceaccount poddiscovery --namespace default`

命令: `kubectl create clusterrolebinding poddiscovery --clusterrole=cluster-admin --user=system:serviceaccount:default:poddiscovery`

>serviceAccount会绑定到一个namespace,如果想在其他namespace也能成功运行，则在对应的namespace下也需要创建对应的serviceAccount

serviceAccount创建之后直接像上面例子那样用即可。

2 ) 从配置文件启动

命令: `./poddiscovery --config /path/to/config/file`

配置文件样例:

```
k8sApiServer: https://192.168.99.103:8443
k8sConfigFile: "./kube/config"
```

`k8sApiServer` kubernetes的API-Server访问地址

`k8sConfigFile` kubernetes的访问权限文件
