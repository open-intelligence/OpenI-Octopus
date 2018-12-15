# Hadoop AI 增强
## 概述 ##

我们添加GPU增强Hadoop为了更好的AI工作规划。目前， YARN-3926也支持GPU调度，它使用GPU作为一个可数资源。

然而，GPU的替代对于深度学习的工作效率非常关键。

例如，如果GPU 0和1是处在相同的 PCI-E下而0和7不是，那么 2-GPU工作在gpu{0,1}上运行会比在gpu{0,7}上运行更快。

我们添加GPU服务Hadoop 2.9.0 为了启用GPU分配调度，它支持细粒度的GPU放置。一个64位的位图被添加到yarn资源中，那表明GPU用法和分配信息都在一个节点中（每个节点最多64个GPU）。
在相应的位中“1”意味着可调节而“0”表示不可调节。
这个AI增强补丁会被上传到:
https://issues.apache.org/jira/browse/YARN-7481
 

## 怎样在Linux下搭建环境

有两种方式去搭建：
  **快速搭建**: 请参考 [readme](./hadoop-build/README.md)去了解快速搭建的方法。
  

   **一步一步搭建**

  以下是高级用户的搭建方式：

 1. 准备linux环境
 
    Ubuntu 16.04 是默认系统。一些依赖应该被安装：

  	    sudo apt-get install -y git openjdk-8-jre openjdk-8-jdk maven \
	    	cmake libtool automake autoconf findbugs libssl-dev pkg-config build-essential zlib1g-dev

	    wget https://github.com/google/protobuf/releases/download/v2.5.0/protobuf-2.5.0.tar.gz
	    tar xzvf protobuf-2.5.0.tar.gz
	    cd protobuf-2.5.0
	    ./configure
	    make -j $(nproc)
	    make check -j $(nproc)
	    sudo make install
	    sudo ldconfig
 

 2. 下载hadoop 智能增强软件

    请下载 "hadoop-2.9.0-gpu-port.patch" 从网址 https://issues.apache.org/jira/browse/YARN-7481 到本地.
   
 3. 获取hadoop 2.9.0源代码
    
	       git clone https://github.com/apache/hadoop.git
	       cd hadoop
	       git checkout branch-2.9.0
	
 4. 在linux开发环境下安装官方hadoop

   	运行命令“mvn package -Pdist,native -DskipTests -Dtar”
   
   请确保你能通过结果在到下一步之前，你可以上网找到怎样去搭建环境与安装官方hadoop.
   
5. 应用AI增强补丁软件
   
   复制你下载的文件到linux下 hadoop的源文件中并且运行：

git apply hadoop-2.9.0.port-gpu.patch

如果你看到下面的输出那么你成功了。

		../../hadoop-2.9.0.port-gpu:276: trailing whitespace.
		../../hadoop-2.9.0.port-gpu:1630: trailing whitespace.
		../../hadoop-2.9.0.port-gpu:1631: trailing whitespace.
		  public static final long REFRESH_GPU_INTERVAL_MS = 60 * 1000;
		../../hadoop-2.9.0.port-gpu:1632: trailing whitespace.
		../../hadoop-2.9.0.port-gpu:1640: trailing whitespace.
		          Pattern.compile("^\\s*([0-9]{1,2})\\s*,\\s*([0-9]*)\\s*MiB,\\s*([0-9]+)\\s*MiB");
		warning: squelched 94 whitespace errors
		warning: 99 lines add whitespace errors.

   
6. 安装hadoop 智能增强系统
  
     	运行命令“mvn package -Pdist,native -DskipTests -Dtar”

如果一切顺利的话，你会在hadoop-dist/target文件夹下得到hadoop-2.9.0.tar.gz。

使用hadoop-2.9.0.tar.gz去配置你的hadoop路径从而部署你的集群。

     use `hadoop-2.9.0.tar.gz` to set your hadoop path to deploy into your cluster.  
   

## Yarn GPU 接口 ##
1. 添加GPUs与 GPU-属性到你的`yarn_protos `作为接口。

  源文件：
    hadoop-yarn-project/hadoop-yarn/hadoop-yarn-api/src/main/proto/yarn_protos.proto
    ```
		 message ResourceProto {
		   optional int32 memory = 1;
		   optional int32 virtual_cores = 2;
		   optional int32 GPUs = 3;
		   optional int64 GPUAttribute = 4;
		 }
    ```

2.	获取/设置GPU和GPU属性的接口

   GPU属性，位图，用一个long类型变量表示。
    
源文件： hadoop-yarn-project/hadoop-yarn/hadoop-yarn-api/src/main/java/org/apache/hadoop/yarn/api/records/Resource.java	
    ```
		 1. public static Resource newInstance(int memory, int vCores, int GPUs, long GPUAttribute) 
		 2. public abstract int getGPUs();
		 3. public abstract void setGPUs(int GPUs);
		 4. public abstract long getGPUAttribute();
		 5. public abstract void setGPUAttribute(long GPUAttribute);
    ```
3.	Yarn配置
    
        源文件: hadoop-yarn-project/hadoop-yarn/hadoop-yarn-common/src/main/resources/yarn-default.xml
        
        下面是修改后的yarn资源管理器要求的一些GPU属性：
        ```
            <property>
                <description>The minimum allocation for every container request at the RM,  in terms of GPUs. Requests lower than this will throw an InvalidResourceRequestException. </description>
                <name>yarn.scheduler.minimum-allocation-gpus</name>
                <value>0</value>
            </property>
            <property>
                <description>The maximum allocation for every container request at the RM, in terms of GPUs. Requests higher than this will throw an InvalidResourceRequestException. </description>
                <name>yarn.scheduler.maximum-allocation-gpus</name>
                <value>8</value>
            </property>		
            <property>
                <description>Percentage of GPU that can be allocated  for containers. This setting allows users to limit the amount of  GPU that YARN containers use. Currently functional only on Linux using cgroups. The default is to use 100% of GPU.
                </description>
                <name>yarn.nodemanager.resource.percentage-physical-gpu-limit</name>
                <value>100</value>
            </property>
        ```

##Yarn 客户：GPU资源请求##

GPU资源请求被寄到RM在一个资源对象中被描述在org.apache.hadoop.yarn.client.api.AMRMClient.ContainerRequest,通过使用org.apache.hadoop.yarn.client.api.YarnClientaddContainerRequest
有一些GPU请求场景。
1. 仅通过计数请求GPU:
如果一个工作只关心GPU的数量，并非GPU的安置，那么GPU属性必须设置为0。

		1.Resource res = Resource.newInstance(requireMem, requiredCPU, requiredGPUs, 0)
		2.Res.setGPUAttribute((long)0)

2. 申请带有属性的GPU：

    GPU存储信息被存在一个64位（long类型）的位图中，每一位表示一个GPU，GPU id 与位图的匹配如下：

		1111 1111 1111 1111 1111 1111 1111 1111 1111 1111 1111 1111 1111 1111 1111 1111
		 |                                                                |         | 
		 |                                                                |         V
		 V                                                                V       gpu:0-3
		gpu:60-63                                                      gpu:8-11
		
在分配感知的请求中，位图被包括在一个资源实例中。例如，如果4 GPUs 被要求，并且GPU部署要求是GPU 0-3，那么相应的请求实例如下：
		
		```
		Resource res = Resource.newInstance(requireMem, requiredCPU, 4, 15)
		#4 is the request GPU count.
		15 for “1111” is the GPU locality.
		```
		
如果GPU树形被设置非零值，那么被要求的GPU数量必须与他相匹配。否则这个要求不会成功。

3. 带有节点/标签的要求

    这也在GPU中被支持，并且这个行为是与官方Hadoop 2.9.0相同的。
    
4. 松弛请求
  
	在GPU调度中，松弛是节点级松弛，GPU分配不能被松弛。
	例如，	如果要求节点1带有一个计数为2的GPU，GPU属性设置为3对于GPU 0，1。
	当松弛操作在容器请求中被启用时，如果节点1的GPU  0或1 是不可用的，yarn RM可能松弛到其他节点的GPU 0 和 1（如果都可用）。
	但是yarn RM不将松弛到在节点1中其他GPUs，或者在其他节点以外的0和1的GPU。

## 资源管理 ##

1. GPU 分配算法

	a.	如果一个GPU分配被指定，这个算法将会执行一个简单的“匹配”。RM只会返回一个有资源的容器准确与要求相匹配。
	
	b.	如果请求没有GPU分配，这个算法仅仅比较被请求的GPU数与节点空闲GPU数量。 
	
2. 调度

	CapacityScheduler, FairScheduler 和  FifoScheduler都被修正为了支持GPU调度。在FairScheduler中，也支持抢占。

3. 资源计数器

	GPU数量被考虑在 DominantResourceCalculator 中对于混合资源环境。同时，一个新的计算器org.apache.hadoop.yarn.api.records.Resource.GPUResourceCalculator is被创造只为了计算资源。


## 节点管理插件 ##

  源文件: org.apache.hadoop.yarn.util.LinuxResourceCalculatorPlugin

 在节点管理中，节点GPU容量被采集，通过运行一个 nvidia-smi命令当节点管理服务开始时。我们只收集GPU容量在NM的初始化期间。
 
  在Hadoop 2.9.0.中节点管理不会报告资源现状情况。在Hadoop 2.8或者之后的版本，节点管理将报告资源信息，我们会考虑增加更多GPU状态在中心。

## 网页应用   ##

GPU计数和属性信息被展示在网页中。用户可以全面检查容量，占用，空闲信息，在app信息页中。用户也能检查每个节点GPU现状信息在节点信息页面以位图格式显示。
   

