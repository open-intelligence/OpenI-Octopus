# rest-server说明

the rest-server of openi

## 背景说明

**Rest-Server项目是openi开源平台项目中的提供开放操作与管理训练任务的API服务。Rest-Server项目采用nodejs为开发语言，来提供高效可靠的服务能力。随着nodejs语言以及开源社区的不断发展更强，以往的Rest-Server项目的一些问题也逐步显现出来。主要可以总结为一下几点：**
- 安全防御能力不足；
- 单进程运行，无稳定可靠的集群能力，无法发挥性能；
- 代码规范性不足，弱约定性；
- 基于比较老旧的js语法，开发效率低；
- 模块与模块之间依赖关系不清晰，容易造成业务代码冗余现象；


## 需求分析
**针对Rest-Server项目中的问题，现阶段Rest-Server在原有基础上做一次系统性的增加，主要围绕以下几点：**
- 基于强安全能力的底层，让对常见的WEB攻击手段的防御作为基础设施提供；
- 提供稳定可靠的进程以及服务的集群能力，包括进程之间服务之间可靠安全的信号，rpc等通讯能力；
- 强约定性，保持清晰的项目结构，低耦合的业务模块与功能模块关系；
- 代码量少，开发效率高，基于高版本nodejs提供精简语法；
- 标准统一高效的组件插件分离组装能力，避免重复开发；

## 解决方案

### 运行时升级
Nodejs运行时至版本升级至Node[10.15.0.LTS](https://github.com/nodejs/node/blob/master/doc/changelogs/CHANGELOG_V10.md#10.15.0)版本

### 框架升级
阿里巴巴开源的[egg](https://eggjs.org/zh-cn/intro/)企业级NodeJs框架是一款遵循【约定大于配置】原则的web框架，基于egg框架搭建Rest-Server服务，将带来主要以下几点的增强：
- 基于主从模块的进程服务[集群调度方案](https://eggjs.org/zh-cn/advanced/cluster-client.html),提供稳定的服务高可用能力；
- 从底层基本上提供的[安全防御能力](https://eggjs.org/zh-cn/core/security.html)了，保证更专注于业务能力的扩展；
- [插件式开发](https://eggjs.org/zh-cn/advanced/view-plugin.html)，解耦功能模块，更好的团队技术沉淀能力

### 代码升级
针对代码进行部分的翻新升级，实施原则为：
- 业务代码与功能代码分离解耦；
- 基于async/await新语法执行函数调用，保持精简；
- 使用强声明变量，防止作用域污染

