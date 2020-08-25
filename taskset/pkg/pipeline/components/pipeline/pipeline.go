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
	"sync"

	"k8s.io/client-go/util/workqueue"
)

//NewPipeline creates a new pipeline instance
func NewPipeline(eventHandlers *EventHandlerFuncs, workerAmount int) *Pipeline {

	p := &Pipeline{
		features:          make(map[string]*Feature),
		phases:            make([]Phase, 0),
		plugins:           make(map[string][]*Plugin, 0),
		workerAmount:      workerAmount,
		workpieces:        new(sync.Map),
		jobChannel:        make(chan *Workpiece, 10),
		actionChannel:     make(chan *action, 10),
		eventQueue:        makeQueue(),
		exitSigChan:       make(chan struct{}),
		waitGroup:         sync.WaitGroup{},
		jobQueue:          workqueue.NewRateLimitingQueue(workqueue.DefaultControllerRateLimiter()),
		eventHandlers:     eventHandlers,
		pluginProcessFunc: defaultPluginProcessFunc,
	}

	return p
}

//Shutdown closes the pipeline
func (p *Pipeline) Shutdown() {
	p.exitSigChan <- struct{}{}
	p.jobQueue.ShutDown()
	p.waitGroup.Wait()
	close(p.jobChannel)
	close(p.actionChannel)
	close(p.exitSigChan)
}

//DeclarePhases declares phases in the pipline
func (p *Pipeline) DeclarePhases(phases ...Phase) {
	p.phases = phases
}

//SetPluginProcessFunc replaces the default plugin process function with given method
func (p *Pipeline) SetPluginProcessFunc(function func(*Workpiece, *Plugin) ([]byte, error)) {
	p.pluginProcessFunc = function
}

//DisableFeature turns off the specific feature
func (p *Pipeline) DisableFeature(featureName string) error {

	defer p.mutex.Unlock()

	p.mutex.Lock()

	f := p.getFeature(featureName)

	if nil == f {
		return nil
	}

	if false == f.Available() {
		return nil
	}

	f.Disable()

	return nil
}

//EnableFeature makes the feature given available
func (p *Pipeline) EnableFeature(featureName string) error {

	defer p.mutex.Unlock()

	p.mutex.Lock()

	f := p.getFeature(featureName)

	if nil == f {
		return fmt.Errorf("Feature Not Found")
	}

	if true == f.Available() {
		return nil
	}

	f.Enable()

	return nil
}

//DeleteFeature deletes the specific feature
func (p *Pipeline) DeleteFeature(featureName string) error {

	defer p.mutex.Unlock()

	p.mutex.Lock()

	delete(p.features, featureName)

	//remove plugins in each phase
	for phase, plugins := range p.plugins {

		temp := make([]*Plugin, 0)

		for i := 0; i < len(plugins); i++ {
			if plugins[i].GetFeature() != featureName {
				temp = append(temp, plugins[i])
			}
		}

		p.plugins[phase] = temp
	}

	return nil
}

//SyncFeatureStatus syncs the status of feature in the pipeline
func (p *Pipeline) SyncFeatureStatus(feature *api.Feature) error {
	var err error
	var f *Feature

	defer p.mutex.Unlock()

	p.mutex.Lock()

	f, err = NewFeature(feature)

	if nil != err {
		return err
	}

	//validate plugin type
	for i := 0; i < f.PluginAmount(); i++ {
		if false == p.phaseExist(f.GetPlugin(i).GetPhase()) {
			return fmt.Errorf("Unrecogized plugin type:%s", f.GetPlugin(i).GetPhase())
		}
	}
	//sync feature status if the the feature is existed
	p.syncFeatureStatus(f)

	orderMap := make(map[string]int64, 0)

	for i := 0; i < f.PluginAmount(); i++ {
		orderMap[f.GetPlugin(i).Key()] = f.GetPlugin(i).GetExecutionSequence()
	}

	for i := 0; i < len(feature.Plugins); i++ {
		feature.Plugins[i].ExecutionSequence = orderMap[feature.Plugins[i].Key]
	}

	feature.Enabled = f.enabled

	return nil
}

//UpsertFeature updates or inserts a feature ,and sync this feature in the pipeline
func (p *Pipeline) UpsertFeature(feature *api.Feature) error {

	if nil == feature {
		return nil
	}

	var err error
	var f *Feature

	defer p.mutex.Unlock()

	p.mutex.Lock()

	f, err = NewFeature(feature)

	if nil != err {
		return err
	}
	//validate plugin type
	for i := 0; i < f.PluginAmount(); i++ {
		if false == p.phaseExist(f.GetPlugin(i).GetPhase()) {
			return fmt.Errorf("Unrecogized plugin phase:%s", f.GetPlugin(i).GetPhase())
		}
	}
	//sync feature status if the the feature is existed
	p.syncFeatureStatus(f)

	//update plugin
	for i := 0; i < f.PluginAmount(); i++ {
		p.upsertPlugin(f.GetPlugin(i))
	}

	if nil == p.features {
		p.features = make(map[string]*Feature)
	}

	p.features[f.Name()] = f

	return nil
}

//GetPlugin gets expected plugin from the pipeline
func (p *Pipeline) GetPlugin(pluginType, key string) *Plugin {
	defer p.mutex.Unlock()
	p.mutex.Lock()

	return p.getPlugin(pluginType, key)
}

//ChangePluginExecutionSequence changes the plugin execution sequence
func (p *Pipeline) ChangePluginExecutionSequence(pluginType string, before, after string) error {

	defer p.mutex.Unlock()
	p.mutex.Lock()

	if !p.phaseExist(pluginType) {
		return nil
	}

	if nil == p.plugins {
		return nil
	}

	if nil == p.plugins[pluginType] {
		return nil
	}

	var b, a *Plugin
	var bIndex, aIndex int

	for i := 0; i < len(p.plugins[pluginType]); i++ {

		if a != nil && b != nil {
			break
		}

		if p.plugins[pluginType][i].Key() == before {
			b = p.plugins[pluginType][i]
			bIndex = i
		}

		if p.plugins[pluginType][i].Key() == after {
			a = p.plugins[pluginType][i]
			aIndex = i
		}
	}

	if a == nil {
		return fmt.Errorf("Missing Plugin,plugin key:%s", after)
	}

	if b == nil {
		return fmt.Errorf("Missing Plugin,plugin key:%s", before)
	}

	aO := a.GetExecutionSequence()
	a.SetExecutionSequence(b.GetExecutionSequence())
	b.SetExecutionSequence(aO)

	p.plugins[pluginType][bIndex] = a
	p.plugins[pluginType][aIndex] = b

	return nil
}

//AddWorkpiece adds a new workpiece to the pipeline
func (p *Pipeline) AddWorkpiece(work *Workpiece) {
	if nil == work {
		return
	}
	p.jobChannel <- work
}

//CancelWorkpiece removes a workpiece from the pipeline
func (p *Pipeline) CancelWorkpiece(id string, reason string) error {

	notify := make(chan *action, 0)

	defer close(notify)

	act := &action{
		job:    id,
		action: _ACTION_STOP,
		reason: reason,
		done:   notify,
	}

	p.actionChannel <- act

	back := <-notify

	if back == nil {
		return nil
	}

	if back.action == _ACTION_UNEXPECT {
		return fmt.Errorf("%s", back.reason)
	}

	return nil
}

func (p *Pipeline) GetPhase(index int) Phase {
	if nil == p.phases {
		return nil
	}
	if index < 0 || index > len(p.phases) {
		return nil
	}

	return p.phases[index]
}
