package common

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

import (
	"fmt"
)

type Condition struct {
	Name   string `json:"name"`
	Key    string `json:"key"`
	Expect string `json:"expect"`
}

type JobSelector struct {
	Conditions []*Condition `json:"conditions"`
	Expression string       `json:"expression"`
	States     []string     `json:"states"`
}

type Plugin struct {
	Key               string       `json:"key"`
	PluginType        string       `json:"pluginType"`
	CallAddress       string       `json:"callAddress"`
	Description       string       `json:"description"`
	JobSelector       *JobSelector `json:"jobSelector"`
	ExecutionSequence int64        `json:"sequence"` //plugin被执行的顺序
}

//Feature is not thread safe
type Feature struct {
	Name          string       `json:"name"`
	Author        string       `json:"author"`
	Description   string       `json:"description"`
	Enabled       bool         `json:"enabled"`
	Authorization string       `json:"authorization"`
	JobSelector   *JobSelector `json:"jobSelector"`
	Plugins       []*Plugin    `json:"plugins"`
}

func (j *JobSelector) merge(s *JobSelector) {

	if "" == j.Expression {
		j.Expression = s.Expression
	}

	if nil == s.Conditions {
		return
	}

	if nil == j.Conditions {
		j.Conditions = s.Conditions
		return
	}

	for i := 0; i < len(s.Conditions); i++ {
		cond := s.Conditions[i]
		found := false
		for k := 0; k < len(j.Conditions); k++ {
			if cond.Name == j.Conditions[k].Name {
				j.Conditions[k].Key = cond.Key
				j.Conditions[k].Expect = cond.Expect
				found = true
				break
			}
		}

		if false == found {
			j.Conditions = append(j.Conditions, cond)
		}
	}

}

func (f *Feature) mergeSelector() {
	if nil == f.Plugins {
		return
	}

	if nil == f.JobSelector {
		return
	}

	for i := 0; i < len(f.Plugins); i++ {
		plugin := f.Plugins[i]
		if nil == plugin.JobSelector {
			plugin.JobSelector = f.JobSelector
		} else {
			plugin.JobSelector.merge(f.JobSelector)
		}
	}
}

func (f *Feature) generatePluginKey() {
	if nil == f.Plugins {
		return
	}
	for i := 0; i < len(f.Plugins); i++ {
		f.Plugins[i].Key = fmt.Sprintf("%s.%s.%s", f.Plugins[i].PluginType, f.Name, f.Author)
	}
}

func (f *Feature) Init() {
	f.mergeSelector()
	f.generatePluginKey()
}
