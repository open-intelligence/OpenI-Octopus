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
)

//Disable the feature
func (f *Feature) Disable() {
	f.enabled = false
}

//Enable the feature
func (f *Feature) Enable() {
	f.enabled = true
}

//Name returns the name of this feature
func (f *Feature) Name() string {
	return f.name
}

//Description returns the description of this feature
func (f *Feature) Description() string {
	return f.description
}

//Author returns the author of this feature
func (f *Feature) Author() string {
	return f.author
}

//Available tests if the feature is enabled
func (f *Feature) Available() bool {
	return f.enabled == true
}

//PluginAmount returns plugin amount of this feature
func (f *Feature) PluginAmount() int {
	return len(f.plugins)
}

//GetPlugin returns the plugin at given position
func (f *Feature) GetPlugin(index int) *Plugin {
	return f.plugins[index]
}

//NewFeature creates a new feature instance
func NewFeature(feature *api.Feature) (*Feature, error) {

	pluginNum := 0

	if nil != feature.Plugins {
		pluginNum = len(feature.Plugins)
	}

	f := &Feature{
		name:        feature.Name,
		author:      feature.Author,
		enabled:     feature.Enabled,
		description: feature.Description,
		plugins:     make([]*Plugin, pluginNum),
	}

	types := make(map[string]bool, pluginNum)

	for i := 0; i < pluginNum; i++ {

		plugin, err := NewPlugin(feature, feature.Plugins[i])

		if nil != err {
			return nil, err
		}

		if true == types[feature.Plugins[i].PluginType] {

			return nil, fmt.Errorf(
				"Invalid feature,only at most one plugin can be registered for each type per feature,plugin type:%s",
				feature.Plugins[i].PluginType,
			)
		}

		types[feature.Plugins[i].PluginType] = true

		f.plugins[i] = plugin
	}

	return f, nil
}
