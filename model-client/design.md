# 一. 概述

该项目是模块系统的客户端，主要功能是为用户提供一个上传和下载模型数据的命令行工具。

 本项目使用[node.js](https://nodejs.org/en/) 开发，借助[pkg](https://github.com/zeit/pkg#readme) 打包成跨平台的可执行文件。

# 二. 代码结构 

> 项目一期以完成功能为首要目标，仍存在不足，需要继续完善


### 2.1 主入口
 * `./ms_client.js` 是项目主入口，实际入口是`./command/index.js`

`./command/index.js`中的这个无限循环是主[corountine](https://en.wikipedia.org/wiki/Coroutine) ，用来接收用户的输入，并执行用户的命令

```js
co(function*(resume){
    while( 0 == 0){
        // get user's input
        let [input] = yield userInput.read(resume);

        if(!input || input.trim().length == 0){
            continue;
        }
        //parse user's input
        let {cmd,args,opt} = userInput.parse(input);

        //start run command
        let [err] = yield flow.run(cmd,args,opt);

        if(err){
            log.error(err);
        }
    }
})()
```

### 2.2 command 文件夹下

  
 * `./command/commands` 文件夹下是各个命令的具体实现
 * `./command/middlewares` 定义的中间件，
 * `./command/input.js` 获取用户输入的组件
 * `./command/setup.js` 打印一下欢迎页

### 2.3 lib 文件夹下

 * `./lib/upload` 里面定义了上传的逻辑，

 * `./lib/download` 定义了下载逻辑
 * `./lib/env`  操作本地环境设置的代码，现在只有切换语言会用到
 * `./lib/login` 用户登录仓库相关的操作
 * `./lib/userInfo` 操作本地用户缓存的代码，目前主要是存取用户登录后的`token`

 >`download` 和`upload` 相关的接口见`model-hub`项目的文档说明，该文档稍后会简要描述

### 2.4 prototype 文件夹下
 * `./prototype/command` 定义`Command`的原型（可以理解为面向对象概念里面的类）
 * `./prototype/flow` 路由命令的工具，支持中间件
 * `./prototype/lang` 语言系统相关，用来定义中文和英文文本信息

### 2.5 utils 文件夹下

 * `./utils/concurrent` 定义了并发锁
 * `./utils/file` 文件操作相关的工具函数
 * `./utils/log` 打印日志,待完善
 * `./utils/report` 跟踪并打印上传下载进度的工具
 * `./utils/validate` 验证工具，目前只用来验证一个远程项目地址是否合法


> 感谢 [node.js](https://nodejs.org/en/) , [zco](https://github.com/yyrdl/zco) , [pkg](https://github.com/zeit/pkg#readme), [request](https://github.com/request/request) , [single-line-log](https://github.com/freeall/single-line-log), [js-yaml](https://github.com/nodeca/js-yaml) 这些开源软件






# 三. 主要逻辑简述

### 3.1 命令路由

见 `./command/index.js`

所有的命令在这里都可以见到

```js
const flow = new Flow();
 
flow.use("exit",cmd_exit);//done
flow.use("lang",cmd_lang);//done

flow.use("ls",cmd_ls);//done
flow.use("cd",cmd_cd);//done
flow.use("rm",cmd_rm);//done
flow.use("mkdir",cmd_mkdir);//done
flow.use("touch",cmd_touch)//done

flow.use("init",cmd_init);//done
flow.use("login",cmd_login);//done
flow.use("clone",cmd_clone);//done
flow.use("pull",exist,signed,cmd_pull);//done
flow.use("push",exist,signed,cmd_push);//done
flow.use("version",exist,cmd_version);//done
flow.use("convert",exist,signed,cmd_convert);//done
```

`flow.use("exit",cmd_exit)` `exit` 为命令的名字，`cmd_exit` 是该命令的具体执行逻辑，（详细代码见`./command/commands/exit.js`）


```js
flow.use("pull",exist,signed,cmd_pull);
```
`use`方法的第一个参数是命令名称`pull` ,紧接着的两个参数是中间件，只有当`exist`（项目存在且合法） 返回 `true` 时才会进入到 `signed`  ,只有当 `signed`（检查用户是否已经登录） 返回`true` 时，才会继续执行`pull`命令的具体逻辑。


### 3.2 上传和下载

该部分概述一下主要逻辑 :

文件的上传和下载都采用分块的方式,即将一个大文件分割成若干个小文件上传和下载,在改方案中设置的文件块大小为64MB.

分块有两个好处, 一个是若传输出现故障,只需重传出现故障的文件块,二是 可以并发上传和下载一个文件,这样可以缩小传输时间.

所以上传的步骤为:

* 客户端浏览待上传的文件目录，生成上传任务，并向`model-hub`初始化上传任务
* `model-hub`返回该次上传的事务ID
* 客户端根据上传文件的大小，生成文件块上传任务列表
* 客户端开始上传文件块（并发上传，代码里设置的并发度是5）
* 服务端接收客户端上传的文件块，命名为临时文件，接收完成即去合并连续的文件块
* 客户端上传完成，向服务端`model-hub`发起`commit` ,若服务端发现还有文件块缺失，则告知客户端重传，若无，则本次上传任务结束
  

下载步骤为:

下载步骤是上传的逆向操作，步骤略。

> 需要注意，并发操作带来的资源竞争问题，虽然是老生常谈的问题了，还是得注意。比如你以为Node.js 是单线程的吧，不用担心并发时资源竞争，
> 但是呢，单线程还是存在的，see method `dirMustExist` in file `./utils/file/index.js`.

