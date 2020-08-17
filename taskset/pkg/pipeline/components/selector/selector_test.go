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
	api "scheduler/pkg/pipeline/apis/common"
	"testing"

	jsoniter "github.com/json-iterator/go"
)

type testProvider struct{}

func (t *testProvider) GetValue(name *Cond) (bool, error) {
	return true, nil
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

	selectorData := &api.JobSelector{}

	jsoniter.UnmarshalFromString(str, selectorData)

	selector := New()

	err := selector.Compile(selectorData)

	if err != nil {
		t.Error("Failed to compile Jobselector")
	}

	if len(selector.conditions) != 2 {
		t.Error("Failed to parse conditions")
	}
}
func TestWrongExpression(t *testing.T) {
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
		"expression":"sa dsh"
	}`

	selectorData := &api.JobSelector{}

	jsoniter.UnmarshalFromString(str, selectorData)

	selector := New()

	err := selector.Compile(selectorData)

	if err == nil {
		t.Error("Error should not be nil when compile illegal boolean expression")
	}
}

type p struct {
}

func (t *p) GetValue(name *Cond) (bool, error) {
	return false, nil
}

func TestCompileComplexExpression(t *testing.T) {
	str := `{
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
		"expression":"(sa || !dsh) && sa || (dsh&&sa || !dsh)"
	}`

	selectorData := &api.JobSelector{}

	jsoniter.UnmarshalFromString(str, selectorData)

	selector := New()

	err := selector.Compile(selectorData)

	if err != nil {
		t.Error("Failed to compile Jobselector")
		return
	}

	result, err := selector.Match(new(p))

	if err != nil {
		t.Error("Match test should success,but error occured")
	}

	if false == result {
		t.Error("The match test should return `true`,but got `false`")
	}

}
