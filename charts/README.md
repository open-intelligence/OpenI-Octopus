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

相关目录或者文件具有如下约定：

- 一般情况下，单个chart包描述的是`若干服务组成的最小可用功能单元`
- 在单个服务无法提供完善的`最小可用功能`时，不应该定义一个chart包对应一个服务
- 在一个chart包过于庞大冗余，且若干模块都可以提供一部分完整的功能，应考虑拆分成子chart，通过requirements.yaml或者charts来依赖
- 约定每个chart包中`.helmignore`文件配置`*.ign.yaml`项，用于在打包是排除内部配置或者文件
- 内部相关的values配置文件都以`.ign.yaml`后缀结尾，同时应描述系统环境信息；例如：`values-prod.yunnao.ign.yaml`表示`内部云脑系统在PROD环境下的配置文件`

## 开发 

基于helm cli生成的chart模块开发

```sh
$ helm create exampleChart
```

## 开源

本项目通过CI工具Drone实现自动打包上传到github中的开源仓库中，详细实现见`.drone.yml`，开源仓库地址为 [https://github.com/open-intelligence/charts](https://github.com/open-intelligence/charts)

### 打包

本项目通过在gitlab项目面板中 <font color="red">构建`tag`方式</font> 触发打包上传chart包  
其中`tag`名称对应项目根目录下的chart包目录名称， ``也就说`tag`名称决定了项目中需要打包上传chart包`` ，例如：

```angular2html
# tag 名称为 web-portal
# 对应需要打包的chart为 /charts/web-portal
# 打包后生成文件如下
$ ls .
$ web-portal-0.1.0.tgz
```



