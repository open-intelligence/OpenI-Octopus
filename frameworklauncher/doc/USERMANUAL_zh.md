<!--
  Copyright (c) Microsoft Corporation
  All rights reserved.

  MIT License

  Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated
  documentation files (the "Software"), to deal in the Software without restriction, including without limitation
  the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and
  to permit persons to whom the Software is furnished to do so, subject to the following conditions:
  The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

  THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING
  BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
  NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
  DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.


  Copyright (c) Peking University 2018

  The software is released under the Open-Intelligence Open Source License V1.0.
  The copyright owner promises to follow "Open-Intelligence Open Source Platform
  Management Regulation V1.0", which is provided by The New Generation of 
  Artificial Intelligence Technology Innovation Strategic Alliance (the AITISA).
-->

# Microsoft FrameworkLauncher用户手册

## <a name="Concepts">概念</a>

* 不同的 **任务角色（TaskRoles）** 组成了一个 **框架（Framework）**
* 相同的 **任务（Tasks）** 组成一个 **任务角色（TaskRoles）**
* 一个 **用户服务（User Service)** 被所有**任务角色（TaskRoles）**中的**任务（Tasks）**执行

## <a name="QuickStart">快速开始</a>
1. **准备框架（Framework）**
    1. **将可执行文件上传到HDFS**

       将[Framework可执行文件示例](./example/ExampleFramework.sh)上传到HDFS:

            hadoop fs -mkdir -p /ExampleFramework/
            hadoop fs -put -f ExampleFramework.sh /ExampleFramework/
    2. **写Framework描述文件**

        使用[Framework描述文件示例](./example/ExampleFramework.json)。

            Framework描述文件示例说明:
            • 版本1的示例Framework包括一个叫LRSMaster的TaskRole。
            • LRSMaster包含两个Task，它们将在LRSMaster的TaskService中执行。
            • 版本1的LRSMaster的TaskService由其EntryPoint，SourceLocations和Resource定义。
            • 由EntryPoint和SourceLocations定义服务的相应可执行文件，文件需要在容器内运行。
            • Resource定义容器的资源保证/限制。

2. **启动Framework**

    *Launcher服务需要在Framework启动前启动。*

    *参阅[README](../README.md)来启动Oauncher服务*

    *参阅[Root URI](#RootURI)来获得 {LauncherAddress}*

    HTTP将Framework描述文件以json PUT至:

        http://{LauncherAddress}/v1/Frameworks/ExampleFramework

    例如，使用[curl](https://curl.haxx.se/)，您可以执行下面的命令行:

        curl -X PUT http://{LauncherAddress}/v1/Frameworks/ExampleFramework -d @ExampleFramework.json --header "Content-Type: application/json"

3. **监控Framework**

    通过以下方式检查所有已请求的Framework：

        http://{LauncherAddress}/v1/Frameworks

    查看示例Framework:

        http://{LauncherAddress}/v1/Frameworks/ExampleFramework

## <a name="Architecture">架构</a>
<p style="text-align: left;">
  <img src="img/Architecture.png" title="Architecture" alt="Architecture" />
</p>

**Launcher接口**:
* RestAPI
* 提交Framework说明

**Launcher服务**:
* 一个中央服务
* 管理整个集群的所有Framework

**LauncherAM**:
* 对每个Framework服务
* 通过自定义功能需求管理单个Framework的Task

## <a name="Pipeline">流水线</a>
<p style="text-align: left;">
  <img src="img/Pipeline.png" title="Pipeline" alt="Pipeline" />
</p>

## <a name="Configuration">配置</a>
Launcher服务可以通过[LauncherConfiguration](../src/main/java/com/microsoft/frameworklauncher/common/model/LauncherConfiguration.java)进行配置。 您可以检查其中的Type，Specification和FeatureUsage。

我们还提供了一个默认配置供您参考：[Default LauncherConfiguration File](../conf/frameworklauncher.yml).

## <a name="RestAPI">RestAPI</a>
### <a name="Guarantees">保证</a>
* 所有API都是IDEMPOTENT和STATELESS的，以允许琐碎的保留工作的客户端重启。
换句话说，用户不必担心使用不同客户端实例多次调用一个API（例如客户端重启等）。
* 所有API都是线程分布安全的（DISTRIBUTED THREAD SAFE），以允许多个分布式客户端访问。
换句话说，用户不必担心在多线程/进程/节点中同时调用他们。


### <a name="BestPractices">最佳范例</a>
* Launcher服务只能处理有限的请求量。 用户应尽量减少其整体请求频率和负载，以便Launcher服务不会过载。 为此，用户可以集中请求，空出请求，过滤响应等。
* 已完成的Framework将**仅**保留在最近的FrameworkCompletedRetainSec中，以防客户端在FrameworkCompleted之后没有删除Framework。 由DataDeployment启动的Framework是一个例外，它将一直被保留，直到在DataDeployment中删除相应的FrameworkDescriptionFile。 为避免错过CompletedFrameworkStatus，客户端的轮询间隔秒应小于FrameworkCompletedRetainSec。 通过[获得Laucher状态(GET LauncherStatus)](＃GET_LauncherStatus)检查FrameworkCompletedRetainSec。

### <a name="RootURI">Root URI(LauncherAddress)</a>

将其配置为[LauncherConfiguration文件](../conf/frameworklauncher.yml)中的webServerAddress。

### <a name="Types">类型</a>
* 请参阅[数据模型](#DataModel)以获取HTTP请求和响应的类型。

### <a name="Common_Request_Headers">常见请求标头</a>

| 标头   | 说明  |
|:----  |:---- |
| 用户名 | 指定由哪个用户发送请求。 当webServerAclEnable为true时有效，请参见[Framework ACL](#Framework_ACL)。|

### <a name="APIDetails">API 详情</a>
#### <a name="PUT_Framework">发送Framework（PUT Framework）</a>

**请求**

    PUT /v1/Frameworks/{FrameworkName}

类型(TYPE): application/json

请求体(Body): [FrameworkDescriptor](../src/main/java/com/microsoft/frameworklauncher/common/model/FrameworkDescriptor.java)

**说明**

添加没有请求过的FrameworkFramework或更新已被请求的Framework。

1. 添加一个没有请求过的Framework：Framework将被添加并启动（现在它是被请求的了）。
2. 更新一个已被请求的Framework：
    1. 如果FrameworkVersion不变：
        1. Framework将即时更新到FrameworkDescription（即工作保留）。
        2. 要动态更新Framework，最好使用相应的PartialUpdate（例如[PUT TaskNumber](＃PUT_TaskNumber)）而不是PUT整个FrameworkDescription。因为，部分更新FrameworkDescription可以避免两个PUT请求之间的竞态条件（或事务冲突）。此外，该种行为是未定义行为：在FrameworkDescription中更改PartialUpdate不支持的参数。
    2. 否则：
        1. Framework将非滚动升级到新的FrameworkVersion（即不做工作保留）。
        2. 非滚动升级可用于更改PartialUpdate不支持的FrameworkDescription中的参数（例如Framework Queue）。
        3. 非滚动升级应该由更改FrameworkVersion触发，而不是由DELETE然后PUT相同的FrameworkVersion。
3. 用户可以自由指定Framework的FrameworkName，但是，FrameworkName应该遵循[Framework ACL](＃Framework_ACL)。
4. 在接受响应之后，它的相应状态（例如FrameworkStatus和AggregatedFrameworkStatus）也会立即存在。 但是，状态可能不会立即根据请求（FrameworkDescriptor）被更新。因此，要检查它是否已更新，客户端仍需要轮询GET状态(GET Status)的API。


**响应**

| Http状态码 | 响应体 | 说明 |
|:---- |:---- |:---- |
| 接收（202）| 空(NULL) | 已记录请求以在后端进行处理，而不是已经处理完请求。 |
| 错误请求（400）| 异常报文(ExceptionMessage) | 请求验证失败。因此，客户端不要重试此非暂时性故障，需要更正请求。 |
|禁止（403）| 异常报文(ExceptionMessage) | 请求授权失败。因此，客户端不应重试此非暂时性故障，应更正请求或要求管理员授予请求权限。仅当webServerAclEnable为true时才会发生此响应，请参阅[Framework ACL](＃Framework_ACL)。 |
| 请求数太多（429）| 异常报文(ExceptionMessage) |请求被拒绝，因为如果后端接受请求，新的Total TaskNumber将超过Max Total TaskNumber。该故障是临时的，因此，客户端需要重试，或者将整个框架迁移到另一个集群。 |
| 不可用服务（503）| 异常报文(ExceptionMessage) |无法记录请求以在后端处理。在我们的系统中，这将只发生在目标集群的Zookeeper长时间停机时。该故障是临时的，因此，客户端需要重试，或者将整个Framework迁移到另一个集群。 |


#### <a name="DELETE_Framework">删除Framework(DELETE Framework)</a>

**请求**

    DELETE /v1/Frameworks/{FrameworkName}

**描述**

删除一个Framework，无论它是否被请求。

注意：

1. Framework将被停止和删除（现在它没有被请求了）。
2. 接受响应后，其对应的状态也不会立即存在。
3. 如果客户在FrameworkCompleted之后未能删除Framework，则仅保留最近完成的Framework。一个例外是由DataDeployment启动的Framework，它将一直保留到DataDeployment中删除相应的FrameworkDescriptionFile。


**响应**

| HTTP状态码 | 响应体 | 说明 |
|:---- |:---- |:---- |
| 接收（202）| 空(NULL) | 与[PUT Framework](#PUT_Framework)相同 |
| 错误请求（400）| 异常报文(ExceptionMessage) | 与[PUT Framework](#PUT_Framework)相同 |
|禁止（403）| 异常报文(ExceptionMessage) | 与[PUT Framework](#PUT_Framework)相同 |
| 不可用服务（503）| 异常报文(ExceptionMessage) | 与[PUT Framework](#PUT_Framework)相同 |


#### <a name="GET_FrameworkStatus">获得Framework状态(GET FrameworkStatus)</a>

**请求**

    GET /v1/Frameworks/{FrameworkName}/FrameworkStatus

**描述**

获得已请求的Framework的FrameworkStatus

recipes:

1. 用户级别的重试策略 (基于FrameworkState，ApplicationExitCode，ApplicationDiagnostic，ApplicationExitType)
2. 通过YARN CLI或RestAPI直接监视底层YARN应用程序（基于ApplicationId或ApplicationTrackingUrl）

**响应**

| HTTP状态码 | 响应体 | 说明 |
|:---- |:---- |:---- |
| 成功(200) | [FrameworkStatus](../src/main/java/com/microsoft/frameworklauncher/common/model/FrameworkStatus.java) | |
| 未找到(404) | 异常报文(ExceptionMessage) | 该Framework尚未被请求。 因此，客户端不需要重试此非暂时性故障，应首先PUT相应的Framework。 |
| 不可用服务（503）| 异常报文(ExceptionMessage) | 和[PUT Framework](#PUT_Framework)相同 |


#### <a name="PUT_TaskNumber">设置任务号（PUT TaskNumber）</a>

**请求**

    PUT /v1/Frameworks/{FrameworkName}/TaskRoles/{TaskRoleName}/TaskNumber

类型: application/json

请求体（Body）: [UpdateTaskNumberRequest](../src/main/java/com/microsoft/frameworklauncher/common/model/UpdateTaskNumberRequest.java)

**描述**

更新一个已请求Framework的任务号

**响应**

| HTTP状态码 | 响应体 | 说明 |
|:---- |:---- |:---- |
| 接收（202）| 空(NULL) | 与[PUT Framework](#PUT_Framework)相同 |
| 错误请求（400）| 异常报文(ExceptionMessage) | 与[PUT Framework](#PUT_Framework)相同 |
|禁止（403）| 异常报文(ExceptionMessage) | 与[PUT Framework](#PUT_Framework)相同 |
| 未找到(404) | 异常报文(ExceptionMessage) | 与[GET FrameworkStatus](#GET_FrameworkStatus)相同 |
| 请求数太多（429）| 异常报文(ExceptionMessage) | 与[PUT Framework](#PUT_Framework)相同 |
| 不可用服务（503）| 异常报文(ExceptionMessage) | 与[PUT Framework](#PUT_Framework)相同 |


#### <a name="PUT_ExecutionType">设置执行类型（PUT ExecutionType）</a>
**请求**

    PUT /v1/Frameworks/{FrameworkName}/ExecutionType

类型: application/json

请求体（Body）: [UpdateExecutionTypeRequest](../src/main/java/com/microsoft/frameworklauncher/common/model/UpdateExecutionTypeRequest.java)

**描述**

更新已请求Framework的执行类型（ExecutionType）

注意：

1. 如果先前的STOP已经导致当前FrameworkVersion的Framework进入FINAL_STATES，即FRAMEWORK_COMPLETED，则将Framework的ExecutionType从STOP变为START的修改会被忽略。因此，要确保在STOP之后再次启动Framework，只需更改FrameworkVersion即可。

**响应**

| HTTP状态码 | 响应体 | 说明 |
|:---- |:---- |:---- |
| 接收（202）| 空(NULL) | 与[PUT Framework](#PUT_Framework)相同 |
| 错误请求（400）| 异常报文(ExceptionMessage) | 与[PUT Framework](#PUT_Framework)相同 |
|禁止（403）| 异常报文(ExceptionMessage) | 与[PUT Framework](#PUT_Framework)相同 |
| 未找到(404) | 异常报文(ExceptionMessage) | 与[GET FrameworkStatus](#GET_FrameworkStatus)相同 |
| 不可用服务（503）| 异常报文(ExceptionMessage) | 与[PUT Framework](#PUT_Framework)相同 |


#### <a name="PUT_MigrateTask">迁移任务（PUT MigrateTask）</a>

**请求**

    PUT /v1/Frameworks/{FrameworkName}/MigrateTasks/{ContainerId}

类型: application/json

请求体（Body）: [MigrateTaskRequest](../src/main/java/com/microsoft/frameworklauncher/common/model/MigrateTaskRequest.java)

**描述**

将Task从当前容器迁移到另一个容器。新容器和旧容器将满足AntiAffinityLevel约束。

注意：

1. 用户应负责通过监视任务状态(TaskStatuses)或自包含通信来评估服务的健康/性能。如果发现一些健康/性能的下降，用户可以调用这个API将其迁移，使用相应的ContainerId作为参数。
2. 目前，仅支持Any AntiAffinityLevel。

**响应**

| HTTP状态码 | 响应体 | 说明 |
|:---- |:---- |:---- |
| 接收（202）| 空(NULL) | 与[PUT Framework](#PUT_Framework)相同 |
| 错误请求（400）| 异常报文(ExceptionMessage) | 与[PUT Framework](#PUT_Framework)相同 |
|禁止（403）| 异常报文(ExceptionMessage) | 与[PUT Framework](#PUT_Framework)相同 |
| 未找到(404) | 异常报文(ExceptionMessage) | 与[GET FrameworkStatus](#GET_FrameworkStatus)相同 |
| 不可用服务（503）| 异常报文(ExceptionMessage) | 与[PUT Framework](#PUT_Framework)相同 |


#### <a name="PUT_ApplicationProgress">设置应用进展（PUT ApplicationProgress）</a>

**请求**

    PUT /v1/Frameworks/{FrameworkName}/ApplicationProgress

类型: application/json

请求体（Body）: [OverrideApplicationProgressRequest](../src/main/java/com/microsoft/frameworklauncher/common/model/OverrideApplicationProgressRequest.java)

**描述**

更新一个已请求Framework的应用进展（ApplicationProgress）

注意:

1. 如果用户没有调用此API，将使用默认ApplicationProgress，并将其计为完成任务数（CompletedTaskCount） / 任务总数（TotalTaskCount）。
2. 用户应负责通过监视任务状态(TaskStatuses)或自包含通信。来评估服务的健康/性能，然后通过调用此API来覆盖默认的ApplicationProgress来反馈Progress。

**响应**

| HTTP状态码 | 响应体 | 说明 |
|:---- |:---- |:---- |
| 接收（202）| 空(NULL) | 与[PUT Framework](#PUT_Framework)相同 |
| 错误请求（400）| 异常报文(ExceptionMessage) | 与[PUT Framework](#PUT_Framework)相同 |
|禁止（403）| 异常报文(ExceptionMessage) | 与[PUT Framework](#PUT_Framework)相同 |
| 未找到(404) | 异常报文(ExceptionMessage) | 与[GET FrameworkStatus](#GET_FrameworkStatus)相同 |
| 不可用服务（503）| 异常报文(ExceptionMessage) | 与[PUT Framework](#PUT_Framework)相同 |


#### <a name="GET_Framework">获取Framework（GET Framework）</a>

**请求**

    GET /v1/Frameworks/{FrameworkName}

**描述**

获取一个已请求Framework的信息（FrameworkInfo）

Framework信息（FrameworkInfo） = Framework信息合集（SummarizedFrameworkInfo） + 聚合Framework请求（AggregatedFrameworkRequest） + 聚合Framework状态（AggregatedFrameworkStatus）

**响应**

| HTTP状态码 | 响应体 | 说明 |
|:---- |:---- |:---- |
| 成功(200) | [FrameworkInfo](../src/main/java/com/microsoft/frameworklauncher/common/model/FrameworkInfo.java) | |
| 未找到(404) | 异常报文(ExceptionMessage) | 与[GET FrameworkStatus](#GET_FrameworkStatus)相同 |
| 不可用服务（503）| 异常报文(ExceptionMessage) | 与[PUT Framework](#PUT_Framework)相同 |


#### <a name="GET_Frameworks">获取一些Framework（GET Frameworks）</a>
**请求**

    GET /v1/Frameworks

| 查询参数（QueryParameter） | 描述 |
|:---- |:---- |
| 用户名（UserName） | 对结果进行过滤：只返回那些用户名与给定值相同的Framework。 |

**描述**

获取所有已请求Framework的 Framework信息合集（SummarizedFrameworkInfos）

一个Framework的Framework信息合集（SummarizedFrameworkInfo）包含其状态和请求中的选定字段

**响应**

| HTTP状态码 | 响应体 | 说明 |
|:---- |:---- |:---- |
| 成功(200) | [SummarizedFrameworkInfos](../src/main/java/com/microsoft/frameworklauncher/common/model/SummarizedFrameworkInfos.java) | |
| 错误请求（400）| 异常报文(ExceptionMessage) | 与[PUT Framework](#PUT_Framework)相同 |
|禁止（403）| 异常报文(ExceptionMessage) | 与[PUT Framework](#PUT_Framework)相同 |
| 不可用服务（503）| 异常报文(ExceptionMessage) | 与[PUT Framework](#PUT_Framework)相同 |


#### <a name="GET_AggregatedFrameworkStatus">获取聚合Framework状态（GET AggregatedFrameworkStatus）</a>
**请求**

    GET /v1/Frameworks/{FrameworkName}/AggregatedFrameworkStatus

**描述**

获得一个已请求的Framework的AggregatedFrameworkStatus

聚合Framework状态（AggregatedFrameworkStatus） = Framework状态（FrameworkStatus） + 所有任务角色的（任务角色状态（TaskRoleStatus） + 任务状态（TaskStatuses））

TaskStatus Recipes：

1. 服务恢复（ServiceDecovery） (基于TaskRoleName, ContainerHostName, ContainerIPAddress, ServiceId)
2. 任务日志转发（TaskLogForwarding） (基于ContainerLogHttpAddress)
3. MasterSlave和迁移任务（MigrateTask） (基于ContainerId)
4. 数据分区  (基于TaskIndex) (注意，Task重启、迁移和更新不会改变TaskIndex)

**响应**

| HTTP状态码 | 响应体 | 说明 |
|:---- |:---- |:---- |
| 成功(200) | [AggregatedFrameworkStatus](../src/main/java/com/microsoft/frameworklauncher/common/model/AggregatedFrameworkStatus.java) | |
| 未找到(404) | 异常报文(ExceptionMessage) | 与[GET FrameworkStatus](#GET_FrameworkStatus)相同 |
| 不可用服务（503）| 异常报文(ExceptionMessage) | 与[PUT Framework](#PUT_Framework)相同 |


#### <a name="GET_FrameworkRequest">获得Framework请求（GET FrameworkRequest）</a>

**请求**

    GET /v1/Frameworks/{FrameworkName}/FrameworkRequest

**描述**

获得一个已请求Framework的FrameworkRequest

Framework当前的[Framework描述（FrameworkDescriptor）](../src/main/java/com/microsoft/frameworklauncher/common/model/FrameworkDescriptor.java)已被包含在FrameworkRequest中，它可以反映最新的更新。

**响应**

| HTTP状态码 | 响应体 | 说明 |
|:---- |:---- |:---- |
| 成功(200) |  [FrameworkRequest](../src/main/java/com/microsoft/frameworklauncher/common/model/FrameworkRequest.java) | |
| 未找到(404) | 异常报文(ExceptionMessage) | 与[GET FrameworkStatus](#GET_FrameworkStatus)相同 |
| 不可用服务（503）| 异常报文(ExceptionMessage) | 与[PUT Framework](#PUT_Framework)相同 |


#### <a name="GET_AggregatedFrameworkRequest">获取聚合的Framework请求（GET AggregatedFrameworkRequest）</a>
**请求**

    GET /v1/Frameworks/{FrameworkName}/AggregatedFrameworkRequest

**描述**

获得一个已请求Framework的AggregatedFrameworkRequest


聚合Framework请求（AggregatedFrameworkRequest）= Framework请求（FrameworkRequest） + 所有其他请求反馈

**响应**

| HTTP状态码 | 响应体 | 说明 |
|:---- |:---- |:---- |
| 成功(200) |  [AggregatedFrameworkRequest](../src/main/java/com/microsoft/frameworklauncher/common/model/AggregatedFrameworkRequest.java) | |
| 未找到(404) | 异常报文(ExceptionMessage) | 与[GET FrameworkStatus](#GET_FrameworkStatus)相同 |
| 不可用服务（503）| 异常报文(ExceptionMessage) | 与[PUT Framework](#PUT_Framework)相同 |

#### <a name="GET_LauncherRequest">获得Launcher请求（GET LauncherRequest）</a>

**请求**

    GET /v1/LauncherRequest

**描述**

获得LauncherRequest

**响应**

| HTTP状态码 | 响应体 | 说明 |
|:---- |:---- |:---- |
| 成功(200) |  [LauncherRequest](../src/main/java/com/microsoft/frameworklauncher/common/model/LauncherRequest.java) | |
| 不可用服务（503）| 异常报文(ExceptionMessage) | 与[PUT Framework](#PUT_Framework)相同 |


#### <a name="GET_LauncherStatus">获得Launcher状态（GET LauncherStatus）</a>

**请求**

    GET /v1/LauncherStatus

**描述**

获得LauncherStatus

当前 [Launcher配置（LauncherConfiguration）](../src/main/java/com/microsoft/frameworklauncher/common/model/LauncherConfiguration.java)包含在LauncherStatus中，它可以反映最新的更新。

**响应**

| HTTP状态码 | 响应体 | 说明 |
|:---- |:---- |:---- |
| 成功(200) | [LauncherStatus](../src/main/java/com/microsoft/frameworklauncher/common/model/LauncherStatus.java) | |
| 不可用服务（503）| 异常报文(ExceptionMessage) | 与[PUT Framework](#PUT_Framework)相同 |


#### <a name="PUT_ClusterConfiguration">设置集群配置（PUT ClusterConfiguration）</a>
**请求**

    PUT /v1/LauncherRequest/ClusterConfiguration

类型: application/json

请求体（Body）: [ClusterConfiguration](../src/main/java/com/microsoft/frameworklauncher/common/model/ClusterConfiguration.java)

**描述**

动态更新所有框架的集群配置

除了YARN提供的集群信息之外，管理员还可以使用此API来提供有关当前集群配置的外部信息，这有助于Launcher根据该信息安排任务（Task）。以下功能取决于它：

1. taskGpuType

**响应**

| HTTP状态码 | 响应体 | 说明 |
|:---- |:---- |:---- |
| 接受（202）| 空(NULL) | 与[PUT Framework](#PUT_Framework)相同 |
| 错误请求（400）| 异常报文(ExceptionMessage) | 与[PUT Framework](#PUT_Framework)相同 |
|禁止（403）| 异常报文(ExceptionMessage) | 与[PUT Framework](#PUT_Framework)相同 |
| 不可用服务（503）| 异常报文(ExceptionMessage) | 与[PUT Framework](#PUT_Framework)相同 |

#### <a name="GET_ClusterConfiguration">获取集群配置（GET ClusterConfiguration）</a>
**请求**

    GET /v1/LauncherRequest/ClusterConfiguration

**描述**

获得ClusterConfiguration

**响应**

| HTTP状态码 | 响应体 | 说明 |
|:---- |:---- |:---- |
| 成功(200) | [ClusterConfiguration](../src/main/java/com/microsoft/frameworklauncher/common/model/ClusterConfiguration.java) | |
| 不可用服务（503）| 异常报文(ExceptionMessage) | 与[PUT Framework](#PUT_Framework)相同 |


#### <a name="PUT_AclConfiguration">设置ACL配置（PUT AclConfiguration）</a>
**请求**

    PUT /v1/LauncherRequest/AclConfiguration

类型: application/json

请求体: [AclConfiguration](../src/main/java/com/microsoft/frameworklauncher/common/model/AclConfiguration.java)

**描述**

更新AclConfiguration

当获得webServerAclEnable为真的响应时，它立即生效，详情见 [Framework ACL](#Framework_ACL).

**响应**

| HTTP状态码 | 响应体 | 说明 |
|:---- |:---- |:---- |
| 成功(200) | NULL | |
| 错误请求（400）| 异常报文(ExceptionMessage) | 与[PUT Framework](#PUT_Framework)相同 |
|禁止（403）| 异常报文(ExceptionMessage) | 与[PUT Framework](#PUT_Framework)相同 |
| 不可用服务（503）| 异常报文(ExceptionMessage) | 与[PUT Framework](#PUT_Framework)相同 |


#### <a name="GET_AclConfiguration">获得ACL配置（GET AclConfiguration）</a>
**请求**

    GET /v1/LauncherRequest/AclConfiguration

**描述**

获得AclConfiguration

**响应**

| HttpStatusCode | Body | Description |
|:---- |:---- |:---- |
| 成功(200) | [AclConfiguration](../src/main/java/com/microsoft/frameworklauncher/common/model/AclConfiguration.java) | |
| 不可用服务（503）| 异常报文(ExceptionMessage) | 与[PUT Framework](#PUT_Framework)相同 |


## <a name="DataModel">数据模型（DataModel）</a>
你可以查看Launcher中数据模型的类型、规格和功能用途：

    ../src/main/java/com/microsoft/frameworklauncher/common/model/*

例如：

一个Framework是由FrameworkDescriptor数据结构来定义和请求的。要查找FrameworkDescriptor中的功能用法，您可以参阅[FrameworkDescriptor](../src/main/java/com/microsoft/frameworklauncher/common/model/FrameworkDescriptor.java)中的注释。


## <a name="EnvironmentVariables">环境变量</a>
Launcher为每个要使用的用户服务设置以下环境变量：

1. 用于在整个Framework生命周期中定位自己。 因此，迁移或重启后它不会被更改。

| 环境变量 | 说明 |
|:---- |:---- |
| LAUNCHER_ADDRESS | |
| FRAMEWORK_NAME | |
| FRAMEWORK_VERSION | |
| TASKROLE_NAME | |
| TASK_INDEX | |
| SERVICE_NAME | |
| SERVICE_VERSION | |

2. 用于在特定的执行期间定位自己。因此，在迁移或重启后，它们的值会变为另一个。

| 环境变量 | 说明 |
|:---- |:---- |
| APP_ID | Framework的当前关联应用程序ID。 |
| CONTAINER_ID | Task的当前关联容器ID。 |

3. 用于获取分配的资源，仅在相应功能启用时设置。

| 环境变量 | 说明 |
|:---- |:---- |
| CONTAINER_IP | 仅在启用generateInstanceHostList时设置。 |
| CONTAINER_GPUS | 仅在gpuNumber大于0时设置。它是一个数字，该数字的每位代表一个Gpu。 例如，3表示Gpu0和Gpu1。 |
| CONTAINER_PORTS | 仅在portDefinitions设置后设置，格式是：portLabel1:port1,port2,port3;portLabel2:port4,port5,port6|


## <a name="ExitStatus_Convention">退出状态（ExitStatus） 约定（Convention）</a>
你可以在[ExitType](../src/main/java/com/microsoft/frameworklauncher/common/model/ExitType.java)，[RetryPolicyDescriptor](../src/main/java/com/microsoft/frameworklauncher/common/model/RetryPolicyDescriptor.java)，[RetryPolicyState](../src/main/java/com/microsoft/frameworklauncher/common/model/RetryPolicyState.java)，[ExitDiagnostics](../src/main/java/com/microsoft/frameworklauncher/common/exit/ExitDiagnostics.java)中查看所有定义的退出状态。

Recipes:
1. 您的LauncherClient会依赖于退出状态约定（ExitStatus Convention）。
2. 如果您的服务失败，服务可以选择返回USER_APP_TRANSIENT_ERROR和USER_APP_NON_TRANSIENT_ERROR的ExitCode，以帮助FancyRetryPolicy识别服务的TRANSIENT_NORMAL和NON_TRANSIENT ExitType。 如果没有返回任何ExitCode，则服务可能是由于未知ExitType而退出。


## <a name="Framework_ACL">Framework ACL</a>
### <a name="Framework_ACL_Overview">概览</a>
Framework ACL指定哪些用户/组能够访问特定的FrameworkName，无论该FrameworkName是否存在。  因此，实际上，它是FrameworkName的命名空间与用户/组的ACL。

Framework ACL有助于:
1. 1.避免一个用户/组占用（通过添加Framework）为其他用户/组保留的FrameworkName。
2. 避免一个用户/组修改（通过更新Framework）其他用户/组启动的Framework。

### <a name="Framework_ACL_Assumption">假设</a>
1. UserNames和GroupNames之间没有命名冲突。
2. UserNames和GroupNames满足regex ^[A-Za-z0-9\\-._]{1,254}$。

### <a name="Framework_ACL_Usage">用法</a>
如果webServerAclEnable为true，则Framework ACL可用，通过[GET LauncherStatus](#GET_LauncherStatus)来查看。

1. 如果禁用它，则任何用户/组都可以读取和写入整个命名空间。 为了简化，以下我们都假设开启它。
2. 管理员总是可以读取和写入整个命名空间，为简化，下面将省略这一事实。

**命名空间权限**:

命名空间写入权限： 在命名空间中添加或更新Framework

命名空间读取权限：在命名空间中获取Framework

**命名空间机制**:

    {Namespace}~(AnyName)

1. 它是预先创建好的，因此无需提前创建命名空间。
2. 所有用户/组都可以读取命名空间。
3. 最初，只有名为{Namespace}的用户才能写入命名空间。 要将写入权限授权给更多用户，请参阅[PUT AclConfiguration](＃PUT_AclConfiguration)。
4. 基于上文的假设和命名空间机制，对于用户/组，如下是用法模式（Pattern）的建议。

### <a name="Framework_ACL_Best_Practices_Usage">最佳范例：用法模式</a>
**用户(User)用法模式**:

名叫{UserName}的用户的私有命名空间是:

    {UserName}~(AnyName)

1. 它是预创建好的，因此无需提前创建命名空间。
2. 只有此用户才能写入该命名空间。 但是，所有其他用户/组都可以读取该命名空间。

例如，用户UA可以完全控制命名空间：

    UA~(AnyName)

**组(Group)用法模式**:

名叫{GroupName}的组的私有命名空间是：

属于{GroupName}的用户的共享命名空间是：

    {GroupName}~(AnyName)

1. 它是预先创建好的，因此无需提前为它创建命名空间。
2. 最初，没有用户可以写入这个命名空间。管理员需要将属于{GroupName}的UserNames添加到命名空间{GroupName}，请参阅[PUT AclConfiguration](＃PUT_AclConfiguration)。 只有这样，这些用户才能编写这个命名空间。 但是，所有其他用户/组都可以读取这个命名空间。

例如，管理员将同属于组GA的用户UA和UB添加到命名空间GA，然后UA和UB就可以一起工作，完全控制命名空间：

    GA~(AnyName)

### <a name="Framework_ACL_Best_Practices_Naming">最佳范例：在命名空间中的命名</a>
用户/组如何进一步分区其私有命名空间或如何避免在其私有命名空间中命名冲突，Launcher是不强制的。不同的用户/组可能会选择以不同的方式使用其私有命名空间，具体取决于他们具体的要求、方案和假设。

因此在这里，我们只提供两种方案的最佳范例：

**批量（Batch）Framework**:

批量Framework用户倾向于每次添加一个新Framework，而不是更新现有Framework。

因此，用户应确保每次调用[PUT Framework](＃PUT_Framework)时，不会在其私有命名空间中重复使用该名称。

**服务Framework**:

服务Framework用户倾向于频繁更新现有Framework而不是添加新Framework。 他倾向于指定一个知名的名称，并希望向该服务本身的所有用户公开。

所以，他应该确保每次调用[PUT Framework](＃PUT_Framework)时，在他的知名服务子集中重复使用该名称。

无论如何，如果他已经确定真的想添加一个新的Framework，他需要检查他的知名服务子集，然后选择一个新的名字。


## <a name="Best_Practices">最佳范例</a>

1. 您EntryPoint的初始工作路径是EntryPoint的根目录。 您的服务可以读取在任何地方的数据，但是它**只**能在初始工作目录下写入数据，而不包括服务目录。 如果服务是一个**ZIP文件**，它将在启动您的服务之前解压。
例如:

        EntryPoint=HbaseRS.zip/start.bat
        SourceLocations=hdfs:///HbaseRS.zip, hdfs:///HbaseCom <- HbaseRS.zip is a ZIP file

    源HbaseRS.zip和源HbaseCom将被以如下结构下载并解压到本地机器上：

        ./   <- The Initial Working Directory
        ├─HbaseRS.zip <- Service Directory <- HbaseRS.zip is a directory uncompressed from original ZIP file
        └─HbaseCom <- Service Directory

2. Launcher不会在任何RetryPolicy中重启已经成功的Task（即由EntryPoint启动，以退出代码0结束的进程）。 因此，如果您希望不论退出代码如何都始终在同一台计算机上重启服务，你需要通过另一个脚本**变换原始EntryPoint**，例如：

        while true; do
            # call the original EntryPoint
        done

3. 增加目标HDFS上的数据和二进制文件的复件数（更高的ReplicationNumber意味着下载速度更快，可用性更高和持久性更好）。

        hadoop fs -setrep -w <ReplicationNumber> <HDFS Path>

4. 不要在目标HDFS上修改数据和二进制文件。 要使用新数据和二进制文件，请将它们上传到不同的HDFS路径，然后更改FrameworkVersion和SourceLocations。