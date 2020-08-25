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

package pipeline

import (
	"fmt"
	api "scheduler/pkg/pipeline/apis/common"
	libSelector "scheduler/pkg/pipeline/components/selector"
)

//GetFeature returns the feature that the plugin belong to
func (p *Plugin) GetFeature() string {
	return p.feature
}

//GetSelector returns the job selector of this plugin
func (p *Plugin) GetSelector() *libSelector.Selector {
	return p.selector
}

//GetPhase returns the phase of the plugin
func (p *Plugin) GetPhase() string {
	return p.phase
}

//GetCallback returns the callback address of this plugin
func (p *Plugin) GetCallback() string {
	return p.callback
}

//GetAuthorization returns the http baisc authorization of this plugin
func (p *Plugin) GetAuthorization() string {
	return p.authorization
}

//SetExecutionSequence sets the execution sequence of this plugin
func (p *Plugin) SetExecutionSequence(sequence int64) {
	p.sequence = sequence
}

//GetExecutionSequence  returns the execution sequence of this plugin
func (p *Plugin) GetExecutionSequence() int64 {
	return p.sequence
}

//Equal : check if the plugin is same with another plugin
func (p *Plugin) Equal(plugin *Plugin) bool {
	return p.key == plugin.key && p.feature == plugin.feature &&
		p.phase == plugin.phase && p.description == plugin.description &&
		p.callback == plugin.callback && p.authorization == plugin.authorization &&
		p.selector.Equal(plugin.selector)
}

//Key returns the key of the plugin
func (p *Plugin) Key() string {
	return p.key
}

//NewPlugin creates a new plugin
func NewPlugin(feature *api.Feature, plugin *api.Plugin) (*Plugin, error) {

	pluginInPipeline := &Plugin{
		key:           plugin.Key,
		feature:       feature.Name,
		phase:         plugin.PluginType,
		description:   plugin.Description,
		callback:      plugin.CallAddress,
		authorization: feature.Authorization,
		sequence:      plugin.ExecutionSequence,
	}

	pluginInPipeline.selector = libSelector.New()

	if nil == plugin.JobSelector {
		return nil, fmt.Errorf("Missing Selector for plugin:%s", plugin.Key)
	}

	err := pluginInPipeline.selector.Compile(plugin.JobSelector)

	if nil != err {
		return nil, err
	}

	return pluginInPipeline, nil
}
