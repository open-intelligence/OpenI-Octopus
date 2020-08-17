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
	"scheduler/pkg/common/list"
	featureConst "scheduler/pkg/pipeline/constants/feature"
	"sort"
)

func (p *Pipeline) getFeature(featureName string) *Feature {

	if nil == p.features {
		return nil
	}

	return p.features[featureName]
}

func (p *Pipeline) phaseExist(phase string) bool {

	if featureConst.PLUGIN_TYPE_LIFEHOOK == phase {
		return true
	}

	if nil == p.phases {
		return false
	}

	for i := 0; i < len(p.phases); i++ {
		if phase == p.phases[i].Name() {
			return true
		}
	}

	return false
}

func (p *Pipeline) syncFeatureStatus(f *Feature) {

	if nil == p.features {
		return
	}

	if nil == p.features[f.Name()] {
		return
	}

	if p.features[f.Name()].Available() {
		f.Enable()
	} else {
		f.Disable()
	}

	//sync plugin execution sequence
	for i := 0; i < f.PluginAmount(); i++ {

		plugin := f.GetPlugin(i)

		//each feature only has at most one plugin at each phase

		if nil == p.plugins[plugin.GetPhase()] {
			plugin.SetExecutionSequence(0)
			continue
		}

		exist := false

		size := len(p.plugins[plugin.GetPhase()])

		var max int64 = 0

		for k := 0; k < size; k++ {

			oldPlugin := p.plugins[plugin.GetPhase()][k]

			if plugin.Key() == oldPlugin.Key() {

				plugin.SetExecutionSequence(oldPlugin.GetExecutionSequence())

				exist = true
			}

			if oldPlugin.GetExecutionSequence() > max {
				max = oldPlugin.GetExecutionSequence()
			}
		}

		if !exist {
			plugin.SetExecutionSequence(max + 1)
		}
	}
}

func (p *Pipeline) getPlugin(pluginType, key string) *Plugin {

	if !p.phaseExist(pluginType) {
		return nil
	}

	if nil == p.plugins {
		return nil
	}

	if nil == p.plugins[pluginType] {
		return nil
	}

	var plugin *Plugin

	for i := 0; i < len(p.plugins[pluginType]); i++ {
		if p.plugins[pluginType][i].Key() == key {
			plugin = p.plugins[pluginType][i]
			break
		}
	}

	return plugin
}

func (p *Pipeline) upsertPlugin(plugin *Plugin) {

	if nil == p.plugins[plugin.GetPhase()] {
		p.plugins[plugin.GetPhase()] = make([]*Plugin, 0)
	}

	if 0 == len(p.plugins[plugin.GetPhase()]) {
		p.plugins[plugin.GetPhase()] = append(p.plugins[plugin.GetPhase()], plugin)
		plugin.SetExecutionSequence(0)
		return
	}

	var max int64

	var exist bool = false

	for i := 0; i < len(p.plugins[plugin.GetPhase()]); i++ {

		oldPlugin := p.plugins[plugin.GetPhase()][i]

		if plugin.Key() == oldPlugin.Key() {
			p.plugins[plugin.GetPhase()][i] = plugin
			plugin.SetExecutionSequence(oldPlugin.GetExecutionSequence())
			exist = true
		}

		if oldPlugin.GetExecutionSequence() > max {
			max = oldPlugin.GetExecutionSequence()
		}
	}

	if !exist {
		plugin.SetExecutionSequence(max + 1)
		p.plugins[plugin.GetPhase()] = append(p.plugins[plugin.GetPhase()], plugin)
	}
}

func (p *Pipeline) addWorkpiece(work *Workpiece) {
	p.workpieces.Store(work.GetJobID(), work)
}

func (p *Pipeline) getWorkpiece(jobID string) *Workpiece {

	v, found := p.workpieces.Load(jobID)

	if false == found {
		return nil
	}

	return v.(*Workpiece)
}

func (p *Pipeline) deleteWorkpiece(jobID string) {
	p.workpieces.Delete(jobID)
}

func (p *Pipeline) stopFast(actions *list.List) *action {

	var stopAct *action

	for i := 0; i < actions.Len(); i++ {
		act := actions.Get(i).(*action)
		if act.action == _ACTION_STOP {
			stopAct = act
			actions.Delete(i)
			break
		}
	}

	return stopAct
}

func (p *Pipeline) bindPlugins(work *Workpiece) error {

	work.pluginMatched = make([]*Plugin, 0)

	if nil == p.features || nil == p.plugins {
		return nil
	}

	plugins := p.plugins[work.GetPhase()]

	if nil == plugins {

		return nil
	}

	for i := 0; i < len(plugins); i++ {

		plugin := plugins[i]

		if !p.features[plugin.GetFeature()].Available() {
			continue
		}

		match, err := plugin.GetSelector().Match(&condProvider{work.header})

		if err != nil {
			return fmt.Errorf("Failed to run Plugin Selector,Plugin: %s,Error:%s",
				plugin.Key(), err.Error())
		}

		if match {
			work.pluginMatched = append(work.pluginMatched, plugin)
		}

	}

	sort.Sort(_plugins(work.pluginMatched))

	return nil
}

func (p *Pipeline) selectPlugin(work *Workpiece) (phase Phase, plugin *Plugin, err error) {

	if nil == p.phases || 0 == len(p.phases) {
		return
	}

	if "" == work.GetPhase() {
		work.phase = p.phases[0].Name()
	}

	phaseName := work.GetPhase()

	if nil == work.pluginMatched {
		err = p.bindPlugins(work)
	}

	if err != nil {
		return
	}

	if len(work.pluginMatched) != 0 && work.pluginMatched[0].GetPhase() != work.GetPhase() {
		err = p.bindPlugins(work)
	}

	if err != nil {
		return
	}

	for i := 0; i < len(p.phases); i++ {

		if p.phases[i].Name() != phaseName {
			continue
		}

		plugin = p.phases[i].SelectPlugin(work, work.pluginMatched)

		if work.IsTerminated() {
			return nil, nil, nil
		}

		if nil != plugin {
			phase = p.phases[i]
			break
		}

		if nil == plugin && i+1 < len(p.phases) {
			work.phase = p.phases[i+1].Name()
			work.pluginDone = make(map[string]bool, 5)
			phaseName = work.GetPhase()
			err = p.bindPlugins(work)
			if err != nil {
				return
			}
		}
	}

	return
}

func (p *Pipeline) replyAction(act, next *action, actions *list.List) {

	if nil == act {
		return
	}
	if act.action == _ACTION_STOP {
		if act.done != nil {
			act.done <- nil
			act.done = nil
		}
		for i := 1; i < actions.Len(); i++ {
			action := actions.Get(i).(*action)
			if action.done != nil {
				action.done <- nil
				//only reply once
				action.done = nil
			}
		}
	} else {
		if nil != act.done {
			act.done <- next
			act.done = nil
		}
	}
}
