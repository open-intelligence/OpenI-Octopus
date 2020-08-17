# 用户文档

__内容索引__:

* 一个例子
* 任务参数解释
* 内置环境变量
* 指定调度器
* TaskSet的Status
* API接口

## 一. 一个例子

以Tensorflow的Ps-Worker场景为例

>用`sleep`操作代替实际的业务逻辑

```yaml
apiVersion: octopus.openi.pcl.cn/v1alpha1
kind: TaskSet
metadata:
  name: tensorflowdemo
spec:
  retryPolicy:
    retry: false
    maxRetryCount: 1
  roles:
    - name: ps
      replicas: 1
      completionPolicy:
        maxFailed: 1
        minSucceeded: 1
      retryPolicy:
        retry: false
        delay: 60
        maxRetryCount: 1
      template:
        spec:
          restartPolicy: Never
          containers:
            - name: worker
              image: busybox
              command: ["sh","-c","sleep 100;exit 0"]
    - name: worker
      replicas: 3
      eventPolicy: 
        - event: RoleSucceeded
          action: TaskSetSucceeded
      completionPolicy:
        maxFailed: 2
        minSucceeded: 2
      retryPolicy:
        retry: true
        delay: 10
        maxRetryCount: 2
      template:
        spec:
          restartPolicy: Never
          containers:
            - name: worker
              image: busybox
              command: ["sh","-c","sleep 30;exit 0"]
              resources:
                limits:
                    nvidia.com/gpu: 1
```

执行 `kubectl create -f myjob.yaml`命令提交任务。

### 注解:

在这个任务中，我们定义了`ps`和`worker`两种任务角色，副本数分别为1和3。


通过`completionPolicy`,我们定义了ps只要有一个副本成功退出（minSucceeded），那么`ps`认为成功;只要有一个副本失败(maxFailed),　则`ps`失败。同样的，我们也定义了`worker`的结束策略，并且在`worker`上我们开启了重试策略（`retryPolicy`），指定每个副本的最大重试次数为２。

通过`eventPolicy` 定义了`Role`的事件以及对应的动作，`RoleFailed`--> `TaskSetFailed`表示该Role如果失败，将直接导致整个TaskSet失败。

## 二. 任务参数

### 2.1 roles

一个任务中可能有多种不同角色的子任务，使用roles来声明这些不同角色的子任务。

每个Role下可以用replicas声明副本的数量。

>子任务不能重名
　
### 2.２ retryPolicy

定义重试策略。

`retry`字段为布尔值，为`true`时表示开启重试策略；`maxRetryCount`表示最多的能重试的次数;`delay`表示推迟多少秒再重试。

您可以在TaskSet和Role两个层级设置重试策略，如果没有声明重试策略，则表示不需要重试。

如果在TaskSet层级开启了重试，那么只要任务没有成功，TaskSet将清理现场，清除所有的子任务，准备进行下一次重试; 如果TaskSet成功完成，则不需要进入重试逻辑，清理现场（删除所有Pod），整个任务成功退出。

如果在Role层级开启了重试，那么这一级的重试策略不会作用到Role这个层级，而是直接作用到Role的副本(Pod)上。也就是说不会等到一个Role整体失败再重试；只要某一个副本失败退出，且未达到重试上限，则重启这个副本，不会影响其他副本。
　

### 2.３ eventPolicy

事件策略。

`event`声明具体的事件，`action`则用来声明事件对应的动作。


支持的事件列表:

* `RoleFailed` 该角色子任务失败
* `RoleSucceeded` 该角色子任务成功
* `RoleCompleted` 该角色子任务退出（包含成功和失败）

支持的动作列表:

* `TaskSetFailed` 将整个TaskSet状态标记为失败，退出任务
* `TaskSetSucceeded` 将整个TaskSet状态标记为成功，退出任务
* `TaskSetCompleted` 将整个TaskSet标记为结束，退出任务
* `NoAction` 不做任何动作

> 如果一个Role根据`completionPolicy`已经结束，但是该Role的设置了`RoleCompleted`的动作是`NoAction`,那么TaskSetController将清理该Role的所有副本（Pod）,释放资源

__默认策略__

```yaml
    eventPolicy:
        - event: RoleFailed
          action: TaskSetFailed
        - event: RoleSucceeded
          action: NoAction
```
如果未声明实际策略，将使用默认策略，默认策略会等所有Role都成功结束后，才结束整个任务。


如果Role未声明`RoleFailed`事件对应的动作，但设置了`RoleCompleted`对应的动作，TaskSetController将执行`RoleCompleted`对应的动作；如果`RoleCompleted`也未设置，则
将默认设置`RoleFailed`的动作为`TaskSetFailed`。

### 2.４ completionPolicy

completionPolicy定义一个Role的成功或者失败条件。

`maxFailed`值表示最多能容忍多少个副本失败，一但失败的副本数量等于或者超过这个值，那么整个Role被认为是失败。

`minSucceeded` 表示Role成功需要的最小的成功副本数量,一旦成功的副本的数量大于或者等于这个值，则整个Role被认为成功。

TaskSetController会优先判断成功条件。

## 三.　内置环境变量

内置环境变量是TaskSetController默认会注入到容器内的环境变量.

变量列表如下:

* `TASKSET_NAME`  值为对应任务(TaskSet)的名字
* `TASKROLE_NAME` 值为对应Role的名字
* `TASKROLE_REPLICA_INDEX` 值为对应副本的编号(0 <= index < replica)


## 四. 指定调度器

TaskSet允许用户自主选择调度器，如果不声明，则会使用kubenetes的默认调度器。

我们修改前面的例子，指定[kube-batch](https://github.com/kubernetes-sigs/kube-batch)作为调度器。

```yaml
apiVersion: scheduling.incubator.k8s.io/v1alpha1
kind: PodGroup
metadata:
  name: pg-1
spec:
  minMember: 4
---
apiVersion: octopus.openi.pcl.cn/v1alpha1
kind: TaskSet
metadata:
  name: tensorflowdemo
spec:
  retryPolicy:
    retry: false
    maxRetryCount: 1
  roles:
    - name: ps
      replicas: 1
      completionPolicy:
        maxFailed: 1
        minSucceeded: 1
      retryPolicy:
        retry: false
        delay: 0
        maxRetryCount: 1
      template:
        metadata:
          annotations:
            scheduling.k8s.io/group-name: pg-1 #声明pod对应的PodGroup
        spec:
          schedulerName: kube-batch #指定pod调度器
          restartPolicy: Never
          containers:
            - name: worker
              image: busybox
              command: ["sh","-c","sleep 100;exit 0"]
    - name: worker
      replicas: 3
      eventPolicy: 
        - event: RoleSucceeded
          action: TaskSetSucceeded
      completionPolicy:
        maxFailed: 3
        minSucceeded: 2
      retryPolicy:
        retry: true
        delay: 0
        maxRetryCount: 2
      template:
        metadata:
          annotations:
            scheduling.k8s.io/group-name: pg-1 #声明pod对应的PodGroup
        spec:
          schedulerName: kube-batch #指定pod调度器
          restartPolicy: Never
          containers:
            - name: worker
              image: busybox
              command: ["sh","-c","sleep 30;exit 0"]
              resources:
                limits:
                    nvidia.com/gpu: 1
```
[PodGroup](https://github.com/kubernetes-sigs/kube-batch/blob/master/doc/usage/tutorial.md#gang-scheduling)是kube-batch声明的
一个CRD,通过PodGroup表明哪些Pod属于一个组，在调度时应整体考虑。在TaskSet中，通过schedulerName指定Pod使用的调度器为kube-batch,通过Pod的metadata指明Pod和PodGroup的对应关系。

在上面PodGroup中，我们设置了minMember为４，表示只有当４个Pod需要的资源都能同时满足时，才实际调度Pod到计算节点。

更多kube-batch的用法请参考它的[文档](https://github.com/kubernetes-sigs/kube-batch)。



## 五. TaskSet的Status

TaskSet的Status的原始定义见[这里](../..//crd/apis/taskset/v1alpha1/types.go)。


TaskSet的Status:

```go
type TaskSetStatus struct {
	Phase             string           `json:"phase"`　　
	PhaseMessage      string           `json:"phaseMessage"`
	TransitionTime    metav1.Time      `json:"transitionTime"`
	State             string           `json:"state"`        　
	StateMessage      string           `json:"stateMessage"` 　
	ControlUnitUID    *types.UID       `json:"controlUnitUID"`
	CreatedAt         metav1.Time      `json:"createdAt"`       　
	StartAt           *metav1.Time     `json:"startAt"`           　
	FinishAt          *metav1.Time     `json:"finishAt"`          　
	TotalRetriedCount uint             `json:"totalRetriedCount"` 　
	PreemptCount      uint             `json:"preemptCount"`      　
	TaskRoleStatus    []TaskRoleStatus `json:"roleStatus"`
}
```

* `Phase` 　当前TaskSet处于的运行阶段
* `PhaseMessage`　当前运行阶段的注解说明
* `TransitionTime` 当前运行阶段的过渡时间
* `State`　TaskSet处于的状态(Waiting,Running,Failed,Succeeded)
* `StateMessage` 该状态的解释
* `ControlUnitUID` 中间控制单元的UID,controller运行时需要，实际是一个ConfigMap的UID
* `CreatedAt` TaskSet的创建时间，准确讲是被TaskSetController接收的时间
* `StartAt`　State最开始过渡到Running时的时间
* `FinishAt`　TaskSet结束的时间
* `TotalRetriedCount` TaskSet被重试的次数
* `PreemptCount` TaskSet被抢占的次数，保留字段
* `TaskRoleStatus` Role的状态列表

Role的Status:

```go
type TaskRoleStatus struct {
	Name            string          `json:"name"`
	Phase           string          `json:"phase"`
	PhaseMessage    string          `json:"phaseMessage"`
	TransitionTime  metav1.Time     `json:"transitionTime"`
	State           string          `json:"state"`
	StateMessage    string          `json:"stateMessage"`
	ReplicaStatuses []ReplicaStatus `json:"replicaStatus"`
}
```

* `Name` Role的名称
* `Phase` Role所处的运行阶段
* `PhaseMessage` 　当前运行阶段的注解说明
* `TransitionTime` 当前运行阶段的过渡时间
* `State` Role处于的状态(Waiting,Running,Failed,Succeeded)
* `StateMessage` 该状态的解释
* `ReplicaStatuses` Role的副本的状态列表

Replica的Status:

```go
type ReplicaStatus struct {
	Index             uint                     `json:"index"`
	Name              string                   `json:"name"`
	Phase             string                   `json:"phase"`
	PhaseMessage      string                   `json:"phaseMessage"`
	Stopped           bool                     `json:"stopped"`
	TransitionTime    metav1.Time              `json:"transitionTime"`
	StartAt           *metav1.Time             `json:"startAt"`
	FinishAt          *metav1.Time             `json:"finishAt"`
	TotalRetriedCount uint                     `json:"totalRetriedCount"`
	PodName           string                   `json:"podName"`
	PodUID            *types.UID               `json:"podUID"`
	PodIP             string                   `json:"podIP"`
	PodHostIP         string                   `json:"podHostIP"`
	ContainerName     string                   `json:"containerName"`
	ContainerID       string                   `json:"containerID"`
	TerminatedInfo    *ContainerTerminatedInfo `json:"terminatedInfo"`
}
```

* `Index` 副本编号(0　<= Index <　replicas)
* `Name` 副本所属Role的名称
* `Phase` 副本所处的运行阶段
* `PhaseMessage` 　当前运行阶段的注解说明
* `TransitionTime` 当前运行阶段的过渡时间
* `Stopped` 是否已经被TaskSetController主动终止
* `StartAt` 副本启动的时间
* `FinishAt`　副本结束的时间
* `TotalRetriedCount` 副本重试的次数
* `PodName` 副本对应的Pod的名称
* `PodUID` 副本对应的Pod的UID
* `PodIP` 副本对应的Pod的IP
* `PodHostIP` 副本对应的Pod所在计算节点的IP
* `ContainerName`　副本的主工作负载容器的名称
* `ContainerID` 副本的主工作负载容器的容器ID
* `TerminatedInfo` 副本主工作负载退出时的信息，可能为空

```go
type ContainerTerminatedInfo struct {
	ExitCode    int32  `json:"exitCode"`
	ExitMessage string `json:"exitMessage"`
	Signal      int32  `json:"signal"`
	Reason      string `json:"reason"`
}
```

* `ExitCode` 容器退出的code
* `ExitMessage` 容器退出的提示信息
* `Signal` 容器退出时收到的信号
* `Reason` 容器退出的原因

> 上面出现的Phase为任务运行时的阶段，TaskSetController根据Phase驱动整个任务朝期望的状态运行，其定义分别见状态机[TaskSet](../../tasksetcontroller/controller/taskset_states.go)、[Role](../../tasksetcontroller/controller/taskrole_states.go)和[Replica](../../tasksetcontroller/controller/taskrolereplica_states.go)。


## 六. API接口

### 6.1  创建 TaskSet

**请求**

    POST /apis/tasksets.octopus.openi.pcl.cn/v1alpha1/namespaces/{TaskSetNamespace}/tasksets

Body: [TaskSet](../../crd/apis/taskset/v1alpha1/types.go)

Type: application/json or application/yaml

**描述**

创建一个`TaskSet`

**API返回**

| Code | Body | Description |
|:---- |:---- |:---- |
| OK(200) | [TaskSet](../../crd/apis/taskset/v1alpha1/types.go) | Return current TaskSet. |
| Created(201) | [TaskSet](../../crd/apis/taskset/v1alpha1/types.go) | Return current TaskSet. |
| Accepted(202) | [TaskSet](../../crd/apis/taskset/v1alpha1/types.go) | Return current TaskSet. |
| Conflict(409) | [Status](https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.14/#status-v1-meta) | The specified TaskSet already exists. |


### 6.2 删除 TaskSet

**请求**

    DELETE /apis/tasksets.octopus.openi.pcl.cn/v1alpha1/namespaces/{TaskSetNamespace}/tasksets/{TaskSetName}

Body:

application/json
```json
{
  "propagationPolicy": "Foreground"
}
```
application/yaml
```yaml
propagationPolicy: Foreground
```

Type: application/json or application/yaml

**描述**

删除指定的`TaskSet`

**API返回**

| Code | Body | Description |
|:---- |:---- |:---- |
| OK(200) | [TaskSet](../../crd/apis/taskset/v1alpha1/types.go) | The specified TaskSet is deleting.<br>Return current TaskSet. |
| OK(200) | [Status](https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.14/#status-v1-meta) | The specified TaskSet is deleted. |
| NotFound(404) | [Status](https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.14/#status-v1-meta) | The specified TaskSet is not found. |

### 6.3 查询指定TaskSet

**请求**

    GET /apis/tasksets.octopus.openi.pcl.cn/v1alpha1/namespaces/{TaskSetNamespace}/tasksets/{TaskSetName}

**描述**

获取指定`TaskSet`

**Response**

| Code | Body | Description |
|:---- |:---- |:---- |
| OK(200) | [TaskSet](../../crd/apis/taskset/v1alpha1/types.go) | Return current TaskSet. |
| NotFound(404) | [Status](https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.14/#status-v1-meta) | The specified TaskSet is not found. |

### 6.4 获取TaskSet列表

**请求**

    GET /apis/tasksets.octopus.openi.pcl.cn/v1alpha1/namespaces/{TaskSetNamespace}/tasksets
    GET /apis/tasksets.octopus.openi.pcl.cn/v1alpha1/tasksets
     
 

**描述**

从kubernetes查询所有的TaskSet (可指定namespace).

**API返回**

| Code | Body | Description |
|:---- |:---- |:---- |
| OK(200) | [TaskSetList](../../crd/apis/taskset/v1alpha1/types.go) | Return all TaskSets (in the specified Namespace). |

###  6.5 监听指定TaskSet

**请求**

    GET /apis/tasksets.octopus.openi.pcl.cn/v1alpha1/namespaces/{TaskSetNamespace}/tasksets/{TaskSetName}

**描述**

监听指定TaskSet的变更事件

**返回**

| Code | Body | Description |
|:---- |:---- |:---- |
| OK(200) | [WatchEvent](https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.14/#watchevent-v1-meta) | Streaming the change events of the specified TaskSet. |
| NotFound(404) | [Status](https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.14/#status-v1-meta) | The specified TaskSet is not found. |

### 6.6  监听所有TaskSet

**请求**

    GET /apis/tasksets.octopus.openi.pcl.cn/v1alpha1/namespaces/{TaskSetNamespace}/tasksets
    GET /apis/tasksets.octopus.openi.pcl.cn/v1alpha1/tasksets

**描述**
监听所有TaskSet的变更事件 (可指定namespace)

**API返回**

| Code | Body | Description |
|:---- |:---- |:---- |
| OK(200) | [WatchEvent](https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.14/#watchevent-v1-meta) | Streaming the change events of all TaskSets (in the specified Namespace). |
