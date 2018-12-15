# 下载部分

下载部分为只读操作

数据在后端存的路径是：

`rootPath`+`/`+ `username`+`/`+`projectName`+`/v`+`project_version`

假如后端模型数据都存在目录 `/module` 下， 那么用户`test` 的`imgNet`项目的`v1` 版本的存储路径就是

`/module/test/imgNet/vv1`



###  下载

####  初始化下载任务

POST `/dowload/init`

```js
{
    user:"xxx",
    pwd:"xxx",
    project_name:"xxx",
    project_version:"xxx"
}
```

返回：

```js
{
    success:false,
    message:"Auth failed,access denied!"
}
```

或者成功

```js
{
    success:true,
    dowload_id:"xxx",
    project_info:{
        type:'dir',//这个为项目顶层额度dir
        name:"xxx",
        child:[
            {
                type:"file",
                name:"hello.txt",
                size:1024 //kb 文件大小
            },
            {
                type:"dir",
                name:"xxx",
                child:[

                ]
            }
        ]
    }

}
```

客户端会根据返回的`project_info` 依次分块下载数据

#### 开始下载

GET `/dowload?file=xxx&seq=xxx&block_size=xxx&user=xxx&project=xxx&version=xxx`

file 指明要下载的数据的文件名,seq表示数据块，block_size 表示块大小,user 表示用户名，
project 是项目名,version是版本号
 

> 同一文件 seq 串行下载，不同文件可以并行下载


####  下载完毕客户端commit一下

POST `/dowload/commit`

```js
{
    dowload_id:"xxx"
}
```

