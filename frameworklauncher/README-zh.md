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

# 微软FrameworkLauncher

搭建FrameworkLauncher（简称Launcher）是为了支持在 [YARN](http://hadoop.apache.org/) 容器内可以长期运行大规模服务，而无需更改该服务自身。 它还支持批量作业，如TensorFlow，CNTK等。

## 特性

* **高可用性**
  * 所有Launcher和Hadoop组件都是可恢复的，有工作保留。 因此，用户服务被设计为无停机时间，即，当我们的组件遭遇长时间关闭、崩溃、升级或任何类型事件所造成的中断时，用户服务都是不会中断的。
  * Launcher可以容忍许多意外错误并具有良好的故障模型，如依赖组件关闭、机器错误、网络错误、配置错误、环境错误、内部数据损坏等错误。
  * 用户服务在暂时性故障时可以重试，或可按照用户请求迁移到另一台机器等。

* **高实用性**
  * 在容器中运行现有可执行文件无需修改用户代码。用户只需要以Json格式设置FrameworkDescription。
  * 支持RestAPI。
  * 工作保留FrameworkDescription的更新，例如更改TaskNumber或者即时添加TaskRole。
  * 在用户需要时迁移正在运行的任务。
  * 根据用户的请求覆盖默认的ApplicationProgress

* **服务需求**
  * 版本化服务部署
  * 服务发现(ServiceDiscovery)
  * 反亲和性调度(AntiaffinityAllocation): 在不同机器上运行服务

* **批量作业需求**
  * GPU资源
  * 端口资源
  * 集体分配(GangAllocation): 一起启动服务
  * 支持任意task完成后全部终止(KillAllOnAnyCompleted)和任意task完成后服务终止(KillAllOnAnyServiceCompleted)
  * 框架树管理: DeleteOnParentDeleted, StopOnParentStopped
  * 数据拆分(DataPartition)

## 搭建和启动

### 依赖项

编译时的依赖项：

* [Apache Maven](http://maven.apache.org/)
* JDK 1.8+

运行时的依赖项：

* 需要Hadoop 2.9.0和YARN-7481来支持GPU资源和端口资源。 如果你不需要这些，任意Hadoop 2.7+就可以。
* Apache Zookeeper

### 生成 Launcher 分布
*Launcher分布将会被生成(build)到文件夹 .\dist.*

Windows命令行：

    .\build.bat
GNU/Linux命令行:

    ./build.sh

### 开始Launcher服务
*在启动Launcher服务前，需要生成Launcher分布。*

Windows命令行：

    .\dist\start.bat
GNU/Linux命令行：

    ./dist/start.sh

## 用户手册
查看[用户手册](doc/USERMANUAL.md) 来学习如何使用Launcher服务来运载框架。