# Selector 

Pipeline项目使用`Selector`来声明[Plugin](./document.md#c20)感兴趣的`Job`.

# 内容目录

* [语法说明](#jobselector1)
    * [conditions](#jobselector11)
        * [name](#jobselector111)
        * [key](#jobselector112)
        * [expect](#jobselector113)
    * [expression](#jobselector12)
    * [states](#jobselector13)
* [Example](#jobselector2)
  
## <a name="selector1">一。语法说明</a>

`JobSelector`用来声明感兴趣的Job,包含三个部分内容:

* `conditions` 
* `expression` 
* `states` 可选

使用JSON表示:

```json
{
    "conditions":[// 条件列表

    ],
    "expression":"",//布尔表达式
    "states":[]//感兴趣的状态列表
    
}
```

### 1.1 <a name="jobselector11">  conditions</a>

声明`JobSelector`使用的条件（`condition`）列表，`condition`的JSON格式如下:

```json
{
    "name":"",//条件的名称
    "key":"",//取值路径
    "expect":"",//期望的值
}
```
<a name="jobselector111">1 ) name</a>

含义: 条件的名称

类型：　字符串

格式:　随意的英文字母（a-zA-Z）组成的字符串

<a name="jobselector112">2 ) key</a>

含义：　条件的取值路径

类型：　字符串

格式: 随意的英文字母（a-zA-Z）和字符`.`组成的字符串

>在core项目里，将用`.`来分隔JSON取值路径，下面的例子中有演示

<a name="jobselector113">3 ) expect</a>
 

含义：　期望的取值，如果满足期望，这个条件就为`true`

类型: 字符串

格式: 正则表达式，[语法文档链接](http://docs.studygolang.com/pkg/regexp/syntax/)


### 1.2 <a name="jobselector12">expression</a>

判断与该`selector`是否匹配的布尔表达式,表达式返回`true`时表示匹配，反之不匹配.

可使用的操作符: `!`,`||`,`&&`,`()`

可操作的值:　在`conditions`里声明的条件，不支持字面值（比如布尔值`true`、数字`123`等）

比如在`conditions`里声明了`name`为:`cond1`、`cond2`、`cond3`的三个条件，那么在这里只能使用这三个条件。


__注意__:　可设置`expression`值为`*`,表示匹配任意目标.

### 1.3 <a name="jobselector12">states</a>


>该字段只有在`Pipeline`的[LifeHook](./document.md#c226)部分才有意义。

声明感兴趣的任务状态列表.

可用的状态:

* `waiting`
* `running`
* `failed`
* `succeeded`
* `stopped`

可用`["*"]`表示匹配所有状态,用`[]`表示都不感兴趣


## <a name="jobselector2">二。Example</a>

```go
package main

import (
	"fmt"
    "strings"
    api "scheduler/pkg/pipeline/apis/feature"
    jsoniter "github.com/json-iterator/go"
    libSelector "scheduler/pkg/pipeline/components/selector"
)

type ValueProvider struct {
	info string
}

func (p *ValueProvider) GetValue(cond *libSelector.Cond) (bool, error) {

	keys := strings.Split(cond.GetKey(), ".")

	paths := make([]interface{}, len(keys))

	for i := 0; i < len(keys); i++ {
		paths[i] = keys[i]
	}

	value := jsoniter.Get([]byte(p.info), paths...).ToString()

	return cond.Test(value), nil

}

func main() {

	jobSelector := `{
        "conditions":[
            {
                "name":"userTeacher",
                "key":"user.type",
                "expect":"teacher"
            },
            {
                "name":"jobKind",
                "key":"kind",
                "expect":"debug|small_task"
            }
        ],
        "expression":"!userTeacher && jobKind"
    }`

    selectorData := &api.JobSelector{}

	jsoniter.UnmarshalFromString(str, selectorData)

    selector := libSelector.New()
    
	err := selector.Compile(selectorData)

	if err != nil {
		//the grammer of jobSelector is illegal
		fmt.Println(err)
		return
	}

	jobInfo := `{
        "kind":"debug",
        "user":{
            "id":"DSJKDSVDGSADADADASBDGSAVGDSVFSD",
            "type":"student",
            "phone":"call me"
        }
    }`

	match, err := selector.Match(&ValueProvider{info: jobInfo})

	if err != nil {
		//some error occured
		fmt.Println(err)
		return
	}

    fmt.Printf("The result is %v\n", match)
}
```

