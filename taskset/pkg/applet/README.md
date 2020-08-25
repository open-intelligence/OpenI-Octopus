# Applet

Pipeline插件快速实现工具库，插件原理[参考](../pipeline/docs/document.md)

这里把插件的服务实现统称为`Applet`，工具库实现了包括：

- http服务，统一`Applet` Restful接口格式，统一响应格式；
- 向Pipeline注册Feature；
- 管理多`Applet`；

## 使用说明

### 实现接口

定义`struct`并实现如下`Applet接口`，每个接口方法对应`Pipeline`中相关[插件](../pipeline/docs/document.md)的实现

```go
type Applet interface {
	ExecTemplateTranslator(packet *AppletPacket) (*libTaskset.TaskSet, error)
	ExecFactorGenerator(packet *AppletPacket) (*Factor, error)
	ExecAccessGate(packet *AppletPacket) (*Accessor, error)
	ExecTemplateDecorator(packet *AppletPacket) (*libTaskset.TaskSet, error)
	ExecSchedulerBinder(packet *AppletPacket) (*libTaskset.TaskSet, error)
	ExecLifeHook(packet *AppletPacket) ([]byte, error)
}
```

实现：

```go
import (
	"scheduler/pkg/applet/framework"
	libTaskset "scheduler/pkg/crd/apis/taskset/v1alpha1"
)

type MockApplet struct {
	
}

func (m * MockApplet) ExecTemplateTranslator(packet *framework.AppletPacket) (*libTaskset.TaskSet, error) {
	# ...implement code...
	return nil, nil
}

func (m * MockApplet) ExecFactorGenerator(packet *framework.AppletPacket) (*framework.Factor, error) {
	# ...implement code...
	return nil, nil
}

func (m * MockApplet) ExecAccessGate(packet *framework.AppletPacket) (*framework.Accessor, error) {
	# ...implement code...
	return nil, nil
}

func (m * MockApplet) ExecTemplateDecorator(packet *framework.AppletPacket) (*libTaskset.TaskSet, error) {
	# ...implement code...
	return nil, nil
}

func (m * MockApplet) ExecSchedulerBinder(packet *framework.AppletPacket) (*libTaskset.TaskSet, error) {
	# ...implement code...
	return nil, nil
}

func (m * MockApplet) ExecLifeHook(packet *framework.AppletPacket) ([]byte, error) {
	# ...implement code...
	return nil, nil
}
```

### 定义Feature

定义Feature，定义需要定义的插件，`不需要的插件Plugin不用定义`

```go
import (
	api "scheduler/pkg/pipeline/apis/common"
)

var mockedFeature *api.Feature =  &api.Feature{
	Name:        "mocked",
	Author:      "xxx",
	Enabled:     false,
	Description: "mocked feature for test",
	JobSelector: &api.JobSelector{
		Expression: "*",
	},
	Plugins: []*api.Plugin{
		&api.Plugin{
			PluginType: pluginTypes.PLUGIN_TYPE_TEMPLATE_TRANSLATOR,
		},
		&api.Plugin{
			PluginType: pluginTypes.PLUGIN_TYPE_FACTOR_GENERATOR,
		},
		&api.Plugin{
			PluginType: pluginTypes.PLUGIN_TYPE_ACCESS_GATE,
		},
		&api.Plugin{
			PluginType: pluginTypes.PLUGIN_TYPE_TEMPLATE_DECORATOR,
		},
		&api.Plugin{
			PluginType: pluginTypes.PLUGIN_TYPE_SCHEDULER_BINDER,
		},
		&api.Plugin{
			PluginType: pluginTypes.PLUGIN_TYPE_LIFEHOOK,
			JobSelector: &api.JobSelector{
				States: []string{"*"},
			},
		},
	},
}

```

### 定义配置文件

配置文件内容格式如下：

```yaml
# config.yaml

server:
  host: "http://xxxx"         # Applet服务域名或者IP
  port: "xxxx"
pipeline:
  address: "http://xxxx:xxxx" # Pipeline服务域名或者IP+Port
  secret: "xxxx"
options:
  - name: 'xxxx'              # FeatureName
    arguments: {              # Feature的配置
      "xxxx":"xxxx"
    }
```

### 启动服务

接下来启动http服务

```go

import (
	"scheduler/pkg/applet/conf"
	"scheduler/pkg/applet/serv"
)


var server serv.Server

func init(){
	# 加载配置
	conf.LoadConfig("./config.yaml")
	
	# 初始化http服务
	server = serv.NewDefaultAppletServer()
    
	# 将实现的`Applet`和`Feature`注册到http服务中
	server.Append(mockedFeature, func(config *AppletConfiguration) (Applet, error) {
		return &MockApplet{}, nil
	})
}

func main() {
	// 启动http服务
	if err := server.Run(); err != nil {
		server.ShutDown()
	}
}

```

