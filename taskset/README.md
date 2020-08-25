# TaskSet

TaskSet是该项目在kubernetes系统内定义的一个CRD.

包如下几个子项目:

* [tasksetcontroller](./pkg/tasksetcontroller/readme.md)
* [poddiscovery](./pkg/poddiscovery/readme.md)
* [core](./pkg/core/readme.md)

```json
{
    "command":["echo hello","sh","-c","/root/env.sh;/root/run.sh"]
}
```