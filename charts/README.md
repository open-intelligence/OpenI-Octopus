# Private Charts Repository

本项目为内部的helm charts仓库

## 结构

根目录下的每个目录为chart最小单元，也就是一个chart包  
每个chart基本结构如下：

```angular2html
/exampleChart
    /charts/             子chart依赖存放目录
    /template/           资源模板存在目录
    /.helmignore         打包时忽略文件
    /Chart.yaml          包信息文件
    /requirements.yaml   子chart依赖文件
    /values.yaml         值文件
```

## 开发 

基于helm cli生成的chart模块开发

```sh
$ helm create exampleChart
```

