# 模块系统后端

model-hub 是OPENI模型仓库的后端，负责存储用户的模型数据，用户可以通过客户端（model-client）上传和下载自己的模型数据。


# 一. 编译

  `go build`
  
> go version >= 1.11


# 二. 环境配置

   * `SERVER_PORT`  服务监听的端口号
   * `FILE_STORAGE_PATH` 模型数据存储的根目录
   * `MYSQL`  mysql 数据库的连接参数 `user:password@[protocol(address)]/database`
   * `USER_CENTER` 用户中心地址
   * `EXCHANGE_SERVICE` model-exchange 地址

也可以以配置文件的形式指明配置:

例如:

```js
     {
       "SERVER_PORT":"8080", 

       "FILE_STORAGE_PATH": "./data",

       "MYSQL": "root:root@tcp(ip:port)/modelhub",
       
       "USER_CENTER":"http://ip:port",

       "EXCHANGE_SERVICE":"http://ip:port"
     }
 ```
 `ms_server --config ./config.json`


# 三. 目录结构

  * `./main.go`    项目主入口
  * `./config`     环境变量配置相关
  * `./router`     定义路由的处理句柄
  * `./middleware` 定义的中间件，如权限检查
  * `./lib/upload`  定义处理文件上传的相关方法
  * `./lib/login`  用户权限相关的方法
  * `./lib/persist` 存储相关（文件和mysql）
  * `./lib/project`  定义项目操作相关的方法
  * `./lib/download` 定义文件下载相关的方法

# 四. API 

   以下API 接口若无额外的注释，请求参数格式均为JSON格式.

   部分接口需要用户权限才能操作，这里统一表述，后面只注明需要用户权限。

   需要用户权限的接口，请在http 请求的header里带上登录成功时返回的`token`，如下:

   ```js
   {
       "headers":{
           "token":"your token"
       }
   }
   ```

   鉴权失败返回:

   statusCode： 403
   ```js
   {
     "success":false,
     "message":"Access denied!" //或者 `Token expired` ，token过期
   }
   ```

*  登录
    
    POST  `/login`
    
    参数 ：
    ```js
      {
          "user":"",//用户名
          "pwd":""//密码
      }
    ```
     
    成功的返回：
    ```js
    {
        "success":true,
        "token":"xxxxxxxxxx"
    }
    ```
    失败的返回:

    ```js
    {
        "success":false,
        "message":"Login failed"//or other kind of message
    }
    ```
* token 有效性校验
    
   POST `/login/check`
   参数 ：
   ```js
   {
       "token":"xxxxx" //您将要校验的token
   }
   ```
   成功的返回:
   ```js
   {
       "success":true,
       "user":"username"// 该token属于哪一个用户 
   }
   ```
   失败的返回：
   ```js
   {
       "success":false,
       "message":"Token is illegal"
   }
   ```
* 获取项目信息

   POST `/project/info`  __该接口弃用！__

* 获取项目版本信息

    GET `/project/versions?user=xxx&project_name=xxx` 

    需要用户权限

    Query 上的参数

    * user  用户名
    * project_name 项目名

    操作成功返回:
    ```js
    {
        "success":true,
        "versions":[{"project_version":"xxx","create_date":number}]// 版本号列表
    }
    ```
    `project_version` 是版本号， `create_date` 是创建的日期，数字类型，单位是秒 (since January 1, 1970 00:00:00 UTC) 

    操作失败返回：

    ```js
    {
        "success":false,
        "message":"Query parameter 'user' is required!"//或者其他错误信息
    }
    ```

* 转换模型数据格式

  POST `/project/convert` 

  需要用户权限

  参数:
  ```js
    {
        "project":{//项目的信息
            "user":"",//项目拥有者的用户名
            "project_name":"",//项目的名称
             "project_version":""//项目的版本号
        },
        "params":{// 进行转换的参数
            "input_shape":"",
            "source_framework":"",
            "destination_framework":"",
             ..... //其他不同模型间进行转换的必要参数
        }
    }
  ```
   
  成功的返回:

  ```js
    {
        "success":true,
        "message":"Convert successfully"
    }
  ```
  转换成功之后，用户可以使用客户端的`pull`命令把转换后的结果下载下来

  失败的返回：

  ```js
  {
      "success":false,
      "message":""// 模型转换服务（model-exchange）返回的失败信息
  }
  ```
* 初始化上传
  
  POST `/upload/init`

  需要用户权限

  参数:

  ```js
    {
        "user":"",//用户名
        "project_name":"",//项目名称
        "project_version":"",//版本号
        "project_info":{//项目信息，这里用JSON 来表示项目的目录结构
            "type":"dir",
            "name":"directory name",// 顶层目录名与项目名一致
            "child":[
                {
                    "type":"file",
                    "name":"hello.txt",
                    "size":1024 // 单位为字节
                },{
                    "type":"dir",
                    "name":"directory name",
                    "child":[
                        ....// 省略，这里只是举个例子，取决于具体项目
                    ]
                }
            ]

        }
    }
  ```

  成功的返回:

  ```js
  {
      "success":true,
      "upload_id":""//这次上传的事务ID
  }
  ```
  失败的返回:

  ```js
  {
      "success":false,
      "message":"Internal Error"
  }
  ```
* 上传文件块
   
    POST `/upload?upload_id=xxx&seq=xx&total=xxx&file=xxx`

    需要用户权限

    http body 是文件块的数据，这里直接pipe到本地文件存储系统

    Query 上的参数:

    * `upload_id`  初始化上传时返回的事务ID
    * `seq` 表示是一个完整文件的第几块文件块
    * `total` 该文件总的文件块数量
    * `file` 该文件的路径，相对路径，相对于项目根目录


    成功时的返回:

    statusCode :200
      ```js
       {
       "success":true
       }
      ```
    失败时的返回:

    statusCode : 500 ，(非预期的失败)

      ```js
        {
          "success":false,
          "message":"Internal error"
        }
      ```
 *  结束上传任务
   
     POST `/upload/commit`

     需要用户权限

     参数:

     ```js
      {
          "upload_id":"xxx" //该次上传的事务ID
      }
     ```

     成功时的返回:

     statusCode : 200

     ```js
      {
          "success":true,
          "left":[] //如果还缺少文件没有上传，这里会列出来
      }
     ```

     失败时的返回:

     ```js
      {
          "success":false,
          "message": ""
      }
     ```

* 初始化下载
  
  POST `/download/init`

  需要用户权限

  参数:
  ```js
  {
     "user":"",//用户名,
     "project_name":"",//项目名称
     "project_version":""// 项目版本号   
  }
  ```

  成功的返回:

  ```js
  {
      "success":true,
      "project_info":{//项目的目录信息，参考上传初始化时的例子

      },
      "found":true // 项目存在,如果是false，则项目是不存在的
  }
  ```

  失败的返回:

  ```js
  {
    "success":false,
     "message":"Lack of parameter"
  }
  ```
 *  下载文件块
  
    GET `/download?user=xxx&project=xxx&version=xxx&file=xxx&seq=xxx&block_size=xxx`

    需要用户权限

     Query 上的参数:
       
       * `user` 该项目所属用户的用户名
       * `project` 项目名
       * `version`  版本号
       * `file` 文件相对于项目根目录的相对路径
       * `seq`  将要下载该文件的第几个分块
       * `block_size` 文件分块的大小，单位为字节
    
    返回的对应文件块的数据，(未压缩)

*  结束下载

   POST `/download/commit` __该接口弃用__


# 五. mysql 表

 

### 1. 项目表

```sql
create table ms_projects(
    username  varchar(124) NOT NULL, -- 用户id
    project_name varchar(24) NOT NULL,-- 项目名
    project_version varchar(24) NOT NULL, -- 版本
    project_dir varchar(258), -- 目录
    project_info JSON,-- 项目信息，对应ms_project_info 表的id
    create_date bigint, -- 创建时间
    update_date bigint,-- 更新时间
    PRIMARY KEY(username,project_name,project_version)
)
```

### 2. 上传任务表

upload  task

```sql
create table ms_task(
    task_id varchar(124) PRIMARY KEY,
    username varchar(124),-- username
    project_name varchar(24), -- 项目名
    project_version varchar(24),  -- version of project
    temp_dir varchar(258),-- temp dir for upload
    project_dir varchar(258),--project dir
    completed varchar(12), -- yes/no
    create_date bigint -- task create time
)
```

upload 和 dowload是一个有状态的操作， upload 的状态应该由服务端来维护

download 对服务端是只读操作，状态由客户端维护


### 3. token表

存放客户登陆后的 token

```sql
create table ms_token(
    username varchar(124) PRIMARY KEY,
    token varchar(248) ,
    create_date int,
    expiration int
)
```

# 六. 为什么

* 为什么选择Golang？

   Rust也是比较好的工程性语言，无GC，编译时内存检查；golang 早期因为GC 造成的`stop the world`问题很严重，现在已经改善，
   但是相对于 golang 无感知的使用异步IO，rust 基于社区提供的库的形式还是稍显逊色，毕竟该项目是IO密集型的。

    相对于其他C系语言,比如C,C++或者java ,golang的开发效率更高，channel 和 goroutine 使得并发编程变得更容易。

   但若论开发效率，强类型语言不如弱类型语言，本项目是IO密集型项目，主要是操作网络流或者文件流,那么 node.js 或者 python3 也是可以考虑的。

   考虑到日后项目规模扩大，比如写成集群的方式，这样一个带有类型检查的语言是较好的选择。

   综上 golang 是较好的方案。

* 为什么 选用简陋的 [httprouter](https://github.com/julienschmidt/httprouter)作为基础框架？
   
   首先从性能上讲[httprouter](https://github.com/julienschmidt/httprouter)是golang世界已知的最快的，比golang 官方提供的方案还快。

   也有很多基于[httprouter](https://github.com/julienschmidt/httprouter)实现的框架，性能也很好，比如[Gin](https://github.com/gin-gonic/gin) 。 但这类框架会默默地为用户做很多预处理，比如提前为用户解析客户端发送的数据。

   在该项目中，用户发送的数据可能是标准的JSON或者表单，也会是用户的模型数据，模型数据很大，而且是不用解析的。 但是并不确定框架会不会将数据读到内存，尝试去解析，并不想去check框架的源码来确定这件事。

   因此选择 httprouter ，并在其之上架构合适的方案。