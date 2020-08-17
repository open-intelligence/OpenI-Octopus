// MIT License
//
// Copyright (c) PCL. All rights reserved.
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE
//

package selector

import (
	"fmt"
	libList "scheduler/pkg/common/list"
	api "scheduler/pkg/pipeline/apis/common"
	"strings"
)

type provider int

func (p *provider) GetValue(name *Cond) (bool, error) {
	return true, nil
}

var emptyProvider *provider = new(provider)

//Compile the jobSelector
func (s *Selector) Compile(selector *api.JobSelector) error {

	s.expression = strings.Trim(selector.Expression, " ")

	if "" == s.expression {
		return fmt.Errorf("Invalid Selector,missing 'expression'")
	}

	conds := selector.Conditions

	if nil == conds {
		conds = make([]*api.Condition, 0)
	}

	for i := 0; i < len(conds); i++ {

		it := conds[i]

		if "" == it.Name || "" == it.Key {
			return fmt.Errorf("Illegal  condition,name is '%s',key is '%s'", it.Name, it.Key)
		}

		name := it.Name

		if nil != s.conditions[name] {
			return fmt.Errorf("Redeclaration of Selector condition:%s", name)
		}

		s.conditions[name] = &Cond{
			name:   name,
			key:    it.Key,
			expect: it.Expect,
		}

		err := s.conditions[name].compile()

		if nil != err {
			//http://docscn.studygolang.com/pkg/regexp/syntax
			return fmt.Errorf("Wrong regular expression of Selector condition:\n\tCondition:\n\t\t`%s`\n\tError:%v", it.Expect, err)
		}
	}

	if "*" == s.expression {
		return nil
	}

	rpn, err := parse(s.expression)

	if nil != err {
		return err
	}

	//validate the JobSelector
	for i := 0; i < rpn.Len(); i++ {
		it := rpn.Get(i).(*item)
		if it.vtype == _TYPE_VARIABLE {
			if nil == s.conditions[it.value] {
				return fmt.Errorf("Condition(%s) is not declared in the Selector", it.value)
			}
		}
	}

	s.rpn = rpn

	_, err = s.Match(emptyProvider)

	if nil != err {
		return err
	}

	return nil
}

//Match tests the job info if match the selector
func (s *Selector) Match(provider CondProvider) (bool, error) {

	if "*" == s.expression {
		return true, nil
	}

	var stack *libList.List

	stack = s.pool.Get().(*libList.List)

	defer func() {
		stack.Reset()
		s.pool.Put(stack)
	}()

	var (
		result bool
		err    error
	)

	for i := 0; i < s.rpn.Len(); i++ {
		op := s.rpn.Get(i).(*item)

		if op.vtype == _TYPE_VARIABLE {
			result, err = provider.GetValue(s.conditions[op.value])
			if nil != err {
				return false, err
			}
			stack.Push(result)
			continue
		}

		if "!" == op.value {
			if stack.Len() == 0 {
				return false, fmt.Errorf("Invalid boolean expression(%s) of Selector", s.expression)
			}

			top := stack.Pop().(bool)
			stack.Push(!top)
			continue
		}

		if "||" == op.value {
			if stack.Len() < 2 {
				return false, fmt.Errorf("Invalid boolean expression(%s) of Selector", s.expression)
			}
			first := stack.Pop().(bool)
			second := stack.Pop().(bool)
			stack.Push(first || second)
			continue
		}

		if "&&" == op.value {
			if stack.Len() < 2 {
				return false, fmt.Errorf("Invalid boolean expression(%s) of Selector", s.expression)
			}
			first := stack.Pop().(bool)
			second := stack.Pop().(bool)
			stack.Push(first && second)
			continue
		}

	}

	if stack.Len() != 1 {
		return false, fmt.Errorf("Invalid boolean expression(%s) of Selector", s.expression)
	}

	return stack.Pop().(bool), nil
}

//ToJSONString returns the json format of this selector
func (s *Selector) ToJSONString() string {

	str := `{"` + KEY_CONDITIONS + `":[`

	for k, v := range s.conditions {
		c := `{"` + KEY_COND_NAME + `":"` + k + `",` +
			`"` + KEY_COND_KEY + `":"` + v.key + `",` +
			`"` + KEY_COND_EXPECT + `":"` + v.expect + `"}`
		str = str + c + ","
	}

	str = str[0:len(str)-1] + `],"` + KEY_EXPRESSION + `":"` + s.expression + `"}`

	return str
}

func (s *Selector) Equal(selector *Selector) bool {

	if s.expression != selector.expression {
		return false
	}

	if len(s.conditions) != len(selector.conditions) {
		return false
	}

	same := true

	for k, v := range s.conditions {
		if nil == selector.conditions[k] {
			same = false
			break
		}
		if v.key != selector.conditions[k].key ||
			v.expect != selector.conditions[k].expect {
			same = false
			break
		}
	}

	return same
}

//New return a brand new Selector
func New() *Selector {
	s := &Selector{}
	s.conditions = make(map[string]*Cond, 5)
	s.pool.New = func() interface{} {
		return new(libList.List)
	}
	return s
}
