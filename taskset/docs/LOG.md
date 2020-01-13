# 日志

TaskSet　会以JSON的格式输出运行时的日志，用户可以用自己的日志系统收集这些日志做分析,目前包含４种日志：

* 运行时错误日志
* 任务状态变更日志
* Pod日志
* 一般的提示性日志

下面主要说明任务状态变更日志及Pod日志

## 一.　状态变更日志

### 1.1 TaskSet状态变更日志

样例:

```json
{
    "logger":"TaskSetController",
    "level":"info",
    "ts":1573456166.467227,
    "caller":"controller/taskset_states.go:171",
    "msg":"TaskSet Phase Transition",
    "QueryKey":"TaskSetPhaseTransition",
    "TaskSet":"retrytest",
    "Namespace":"default",
    "PrePhase":"TaskSetAttemptCompleted",
    "NextPhase":"TaskSetCompleted",
    "Reason":"Can't retry anymore"
}
```

字段解释:

* `logger` 值固定是TaskSetController，表示日志来自该controller
* `level` 日志等级
* `ts` 时间戳
* `msg`　备注信息
* `QueryKey` 查询的key ,该值固定，用来作为查询该类型日志的条件
* `TaskSet`　任务的名字
* `Namespace` 任务所属的k8s的namespace
* `PrePhase` 该任务的上一个状态
* `NextPhase`　该任务的下一个状态
* `Reason`　本次状态变更的原因


### 1.2 Role状态变更日志

样例:

```json
{
    "logger":"TaskSetController",
    "level":"info",
    "ts":1573456166.407853,
    "caller":"controller/taskrole_states.go:100",
    "msg":"",
    "QueryKey":"TaskRoleTransition",
    "TaskSet":"retrytest",
    "Namespace":"default",
    "Role":"role1",
    "PrePhase":"TaskRoleCleaningPending",
    "NextPhase":"TaskRoleCompleted",
    "Reason":"TaskRole is completed ,because all replica are completed"
}
```

字段解释:

> 忽略和上面的重复字段

* `Role` 表示是哪一个Role

### 1.3 Replica状态变更日志

样例:

```json
{
    "logger":"TaskSetController",
    "level":"info",
    "ts":1573456166.3944664,
    "caller":"controller/taskrolereplica_states.go:139",
    "msg":"",
    "QueryKey":"ReplicaTransition",
    "TaskSet":"retrytest",
    "Namespace":"default",
    "Role":"role1",
    "PodName":"retrytest-role1-1-1-0",
    "PrePhase":"TaskRoleReplicaAttemptCompleted",
    "NextPhase":"TaskRoleReplicaCompleted",
    "Reason":"Can't retry anymore"
}
```
字段解释:

> 忽略和上面的重复字段

* `Role` 该Replica所属的Role
* `PodName` 该Replica对应的Pod的名字

## 二. Pod日志

样例:

```json
{
    "logger":"TaskSetController",
    "level":"info",
    "ts":1573456166.394516,
    "caller":"controller/history_log.go:67",
    "msg":"TaskRole replica attempt completed",
    "QueryKey":"PodHistory",
    "TaskSet":"retrytest",
    "Namespace":"default",
    "Role":"role1",
    "AttemptID":1,
    "ReplicaIndex":0,
    "PodName":"retrytest-role1-1-1-0",
    "PodReason":"",
    "PodIP":"172.17.0.6",
    "PodHostIP":"10.0.2.15",
    "ContainerName":"worker",
    "ContainerID":"docker://3393ec9af174ffd119a12a8ff1eee14ced37902055b094a9a96a2c73ee244475","Phase":"TaskRoleReplicaCompleted",
    "PhaseMessage":"Can't retry anymore",
    "TransitionTime":"2019-11-11 15:09:26.394465305 +0800 CST m=+1731.351193931",
    "Stopped":false,
    "StartAt":1573456140.5911682,
    "FinishAt":1573456166.358888,
    "ContainerExitCode":1,
    "ContainerExitMessage":"",
    "ContainerExitSignal":"",
    "ContainerExitReason":""
}

```

* `QueryKey` 指明查询该类日志的key
* `TaskSet` 该Pod所属的TaskSet
* `Namespace` 该Pod所处的namespace
* `Role` 该pod所属的Role
* `AttemptID` 该TaskSet此次尝试运行的编号（０<= AttemptID < maxRetryCount）
* `ReplicaIndex` 该Pod对应的Replica的编号
* `PodName` pod的名字
* `PodReason` pod处于该阶段的理由,比如:Evicted
* `PodIP` pod的IP
* `PodHostIP` pod所在节点的主机IP
* `ContainerName` 该Pod对应的主工作负载容器的名字
* `ContainerID` 该Pod对应的主工作负载容器的容器ID
* `Phase` 该Pod对应的Replica的当前阶段
* `PhaseMessage` 该Pod对应的Replica的当前阶段注解
* `TransitionTime` 该Pod对应的Replica状态变更的时间
* `Stopped` true表示该Pod对应的Replica是被TaskSetController主动停止
* `StartAt` 开始时间
* `FinishAt` 结束时间
* `ContainerExitCode` 主工作负载容器退出的code
* `ContainerExitMessage` 主工作负载容器退出时的提示信息
* `ContainerExitSignal` 主工作负载容器退出时的信号
* `ContainerExitReason` 主工作负载容器退出时的原因