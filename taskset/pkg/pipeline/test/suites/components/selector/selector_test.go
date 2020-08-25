package selector

import (
	"fmt"
	api "scheduler/pkg/pipeline/apis/common"
	"scheduler/pkg/pipeline/components/selector"
	libSelector "scheduler/pkg/pipeline/components/selector"
	"strings"
	"testing"

	jsoniter "github.com/json-iterator/go"
)

type condProvider struct {
	header []byte
}

func (c *condProvider) GetValue(cond *selector.Cond) (bool, error) {

	keys := strings.Split(cond.GetKey(), ".")

	paths := make([]interface{}, len(keys))

	for i := 0; i < len(keys); i++ {
		paths[i] = keys[i]
	}

	value := jsoniter.Get(c.header, paths...).ToString()

	return cond.Test(value), nil
}
func compile(str string) (*libSelector.Selector, error) {
	selectorData := &api.JobSelector{}

	jsoniter.UnmarshalFromString(str, selectorData)

	selector := libSelector.New()

	err := selector.Compile(selectorData)
	return selector, err
}

func TestConditionParse(t *testing.T) {
	str := `{
		"conditions":[
			{
				"name":"sa",
				"key":"job",
				"expect":"hello"
			},
			{
				"name":"dsh",
				"key":"job",
				"expect":"hello"
			}
		],
		"expression":"sa && dsh"
	}`

	_, err := compile(str)

	if err != nil {
		t.Error("Failed to compile Jobselector")
	}
}
func TestWrongExpression(t *testing.T) {
	conds := `
	{
		"name":"sa",
		"key":"job",
		"expect":"hello"
	},
	{
		"name":"dsh",
		"key":"job",
		"expect":"hello"
	}
	`
	str := `{
		"conditions":[` + conds + `],
		"expression":"sa dsh"
	}`

	_, err := compile(str)

	if err == nil {
		t.Error("Error should not be nil when compile illegal boolean expression")
	}

	//illegal char
	str = `{
		"conditions":[` + conds + `],
		"expression":"s-a &&  dsh"
	}`

	_, err = compile(str)

	if err == nil {
		t.Error("Error should not be nil when compile  boolean expression with illegal char")
	}

	str = `{
		"conditions":[` + conds + `],
		"expression":""
	}`

	_, err = compile(str)

	if err == nil {
		t.Error("Error should not be nil when miss boolean expression")
	}

	str = `{
		"expression":"H"
	}`

	_, err = compile(str)

	if err == nil {
		t.Error("Error should not be nil when no condition")
	}

	str = `{
		"conditions":[` + conds + `],
		"expression":"sa&dsh"
	}`

	_, err = compile(str)

	if err == nil {
		t.Error("Error should not be nil")
	}

	str = `{
		"conditions":[` + conds + `],
		"expression":"(sa&dsh"
	}`

	_, err = compile(str)

	if err == nil {
		t.Error("Error should not be nil")
	}

	str = `{
		"conditions":[` + conds + `],
		"expression":"(sa&&dsh&"
	}`

	_, err = compile(str)

	if err == nil {
		t.Error("Error should not be nil")
	}
	str = `{
		"conditions":[` + conds + `],
		"expression":"sa&&dsh)"
	}`

	_, err = compile(str)

	if err == nil {
		t.Error("Error should not be nil")
	}

	str = `{
		"conditions":[
			{
				"name":"",
				"key":"job",
				"expect":"hello"
			}
		],
		"expression":"sh"
	}`

	_, err = compile(str)

	if err == nil {
		t.Error("Error should not be nil")
	}

	str = `{
		"conditions":[
			{
				"name":"c1",
				"key":"job",
				"expect":"hello"
			},
			{
				"name":"c1",
				"key":"job2",
				"expect":"hello"
			}
		],
		"expression":"c1"
	}`

	_, err = compile(str)

	if err == nil {
		t.Error("Error should not be nil")
	}

}

func TestOperatorTargetNotFound(t *testing.T) {
	conds := `
	{
		"name":"sa",
		"key":"job",
		"expect":"hello"
	},
	{
		"name":"dsh",
		"key":"job",
		"expect":"hello"
	}
	`
	str := `{
		"conditions":[` + conds + `],
		"expression":"!"
	}`

	_, err := compile(str)

	if err == nil {
		t.Error("Error should not be nil")
	}

	str = `{
		"conditions":[` + conds + `],
		"expression":"sa ||"
	}`

	_, err = compile(str)

	if err == nil {
		t.Error("Error should not be nil")
	}

	str = `{
		"conditions":[` + conds + `],
		"expression":"sa &&"
	}`

	_, err = compile(str)

	if err == nil {
		t.Error("Error should not be nil")
	}
}

func TestCompileComplexExpression(t *testing.T) {
	str := `{
		"conditions":[
			{
				"name":"sa",
				"key":"job",
				"expect":"^hello$"
			},
			{
				"name":"dsh",
				"key":"job2",
				"expect":"^hello$"
			}
		],
		"expression":"(sa || !dsh) && sa || (dsh&&sa || !dsh)"
	}`

	selector, err := compile(str)

	if err != nil {
		t.Error("Failed to compile Jobselector")
		return
	}

	condP := &condProvider{
		header: []byte(`{
			"job":"no",
			"job2":"hello"
		}`),
	}

	result, err := selector.Match(condP)

	if err != nil {
		t.Error("Match test should success,but error occured")
	}

	if true == result {
		t.Error("The match test should return `false`,but got `true`")
	}
}

func TestMatchAll(t *testing.T) {
	conds := ``
	str := `{
		"conditions":[` + conds + `],
		"expression":"*"
	}`

	selector, err := compile(str)

	if err != nil {
		t.Error(err)
	}

	condP := &condProvider{
		header: []byte("{}"),
	}
	match, err := selector.Match(condP)

	if err != nil {
		t.Error(err)
	}
	if true != match {
		fmt.Errorf("* should match all")
	}
}

func TestSerialization(t *testing.T) {
	str := `{
		"conditions":[
			{
				"name":"sa",
				"key":"job",
				"expect":"^hello$"
			},
			{
				"name":"dsh",
				"key":"job2",
				"expect":"^hello$"
			}
		],
		"expression":"(sa || !dsh) && sa || (dsh&&sa || !dsh)"
	}`

	selector, err := compile(str)

	if err != nil {
		t.Error(err)
	}

	json := selector.ToJSONString()

	selectCopy, err := compile(json)

	if err != nil {
		t.Error(err)
	}
	if selector.Equal(selectCopy) == false {
		t.Error("The two selectors should be equal with each other")
	}
}

func TestEqualMethod(t *testing.T) {
	conds := `
	{
		"name":"sa",
		"key":"job",
		"expect":"hello"
	},
	{
		"name":"dsh",
		"key":"job",
		"expect":"hello"
	}
	`
	str := `{
		"conditions":[` + conds + `],
		"expression":"*"
	}`

	s1, err := compile(str)

	if err != nil {
		t.Error(err)
	}

	str = `{
		"conditions":[` + conds + `],
		"expression":"!sa"
	}`

	s2, err := compile(str)

	if err != nil {
		t.Error(err)
	}

	if s1.Equal(s2) {
		t.Error("s1 is different from s2")
	}

	str = `{
		"conditions":[],
		"expression":"*"
	}`

	s3, err := compile(str)

	if err != nil {
		t.Error(err)
	}
	if s1.Equal(s3) {
		t.Error("s1 is different from s3")
	}

	str = `{
		"conditions":[
			{
				"name":"sa",
				"key":"job",
				"expect":"hello"
			},
			{
				"name":"c2",
				"key":"job2",
				"expect":"hello"
			}
		],
		"expression":"*"
	}`

	s4, err := compile(str)

	if err != nil {
		t.Error(err)
	}
	if s1.Equal(s4) {
		t.Error("s1 is different from s4")
	}
	//same name ,same expect ,but different key
	str = `{
		"conditions":[
			{
				"name":"sa",
				"key":"job",
				"expect":"hello"
			},
			{
				"name":"dsh",
				"key":"job2",
				"expect":"hello"
			}
		],
		"expression":"*"
	}`

	s5, err := compile(str)

	if err != nil {
		t.Error(err)
	}
	if s1.Equal(s5) {
		t.Error("s1 is different from s5")
	}

	//same name ,same key ,but different expect
	str = `{
		"conditions":[
			{
				"name":"sa",
				"key":"job",
				"expect":"hello"
			},
			{
				"name":"dsh",
				"key":"job",
				"expect":"hello1"
			}
		],
		"expression":"*"
	}`

	s6, err := compile(str)

	if err != nil {
		t.Error(err)
	}
	if s1.Equal(s6) {
		t.Error("s1 is different from s6")
	}
}
