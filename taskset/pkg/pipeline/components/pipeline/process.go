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
	"time"

	"k8s.io/apimachinery/pkg/util/wait"
)

func (p *Pipeline) Run() {

	stopList := make([]chan struct{}, p.workerAmount)

	p.waitGroup.Add(p.workerAmount)

	for i := 0; i < p.workerAmount; i++ {

		sig := make(chan struct{}, 0)

		stopList[i] = sig

		go func(id int, stop chan struct{}) {
			wait.Until(func() { p.worker(i) }, time.Second, sig)
			p.waitGroup.Done()
		}(i, sig)
	}

	exit := false

	for {
		if true == exit {
			break
		}

		select {
		case workpiece := <-p.jobChannel:
			{
				p.handleWorkpiece(workpiece)
			}
		case act := <-p.actionChannel:
			{
				p.handleAction(act)
			}
		case <-p.exitSigChan:
			{
				go func() {
					for i := 0; i < len(stopList); i++ {
						stopList[i] <- struct{}{}
						close(stopList[i])
					}
				}()

				exit = true
				break
			}
		}
	}
}

func (p *Pipeline) handleWorkpiece(work *Workpiece) {

	p.addWorkpiece(work)

	act := &action{
		job:    work.GetJobID(),
		action: _ACTION_PREPARE,
		reason: "handle workpiece",
	}

	p.actionChannel <- act
}

func (p *Pipeline) handleAction(act *action) {

	work := p.getWorkpiece(act.job)

	if nil != work {
		p.eventQueue.add(act)
		p.jobQueue.Add(act.job)
	} else if nil != act.done {
		act.done <- nil
		act.done = nil
	}
}

func (p *Pipeline) worker(id int) {

	for p.loop() {
	}
}

func (p *Pipeline) loop() bool {

	job, shutdown := p.jobQueue.Get()

	if shutdown {
		return false
	}

	defer p.jobQueue.Done(job)

	jobID := job.(string)

	if "" == jobID {
		return true
	}

	workpiece := p.getWorkpiece(jobID)

	actions := p.eventQueue.get(jobID)

	//workpiece was removed from pipeline,remove it from workqueue
	if nil == workpiece {
		p.jobQueue.Forget(jobID)
		p.eventQueue.delete(jobID)
		return true
	}

	//no actions for this workpiece ,nothing to do
	if nil == actions || 0 == actions.Len() {
		return true
	}

	p.processWorkpiece(workpiece, actions)

	if 0 != actions.Len() {
		p.eventQueue.reAdd(jobID, actions)
		p.jobQueue.Add(jobID)
	}

	return true
}

func (p *Pipeline) processWorkpiece(workpiece *Workpiece, actions *list.List) {

	var act, next *action

	act = p.stopFast(actions)

	if nil == act {
		act = actions.Shift().(*action)
	}

	if nil == act {
		return
	}

	switch act.action {
	case _ACTION_PREPARE:
		{
			next = p.actPrepare(workpiece, act)
		}
	case _ACTION_STOP:
		{
			next = p.actStop(workpiece, act)
		}
	case _ACTION_SUSPEND:
		{
			next = p.actSuspend(workpiece, act)
		}
	case _ACTION_COMPLETE:
		{
			next = p.actComplete(workpiece, act)
		}
	case _ACTION_CLEAN:
		{
			next = p.actClean(workpiece, act)
		}
	case _ACTION_UNEXPECT:
		{
			next = p.actUnexpect(workpiece, act)
		}
	}

	if nil != next {
		actions.Unshift(next)
	}

	p.replyAction(act, next, actions)
}

func (p *Pipeline) actPrepare(work *Workpiece, act *action) (next *action) {

	defer p.mutex.RUnlock()
	p.mutex.RLock()

	next = &action{
		job:    work.GetJobID(),
		action: _ACTION_PREPARE,
		reason: "continue the pipeline",
	}

	phase, plugin, err := p.selectPlugin(work)

	if err != nil {
		next.action = _ACTION_UNEXPECT
		next.reason = err.Error()
		return
	}

	if work.IsSuspended() {
		next.action = _ACTION_SUSPEND
		next.reason = work.reason
		return
	}

	if work.IsTerminated() {
		next.action = _ACTION_UNEXPECT
		next.reason = work.reason
		return
	}

	if work.IsStopped() {
		next.action = _ACTION_STOP
		next.reason = work.reason
		return
	}

	if nil == plugin {
		next.action = _ACTION_COMPLETE
		next.reason = "no more plugin"
		return
	}

	buf, err := p.pluginProcessFunc(work, plugin)

	if nil != err {
		next.action = _ACTION_UNEXPECT
		next.reason = fmt.Sprintf(
			"Error occured when executed plugin(%s).Error:%s",
			plugin.Key(), err.Error(),
		)
		return
	}

	phase.ProcessPluginResult(work, buf)

	work.pluginDone[plugin.Key()] = true

	if nil != p.eventHandlers && nil != p.eventHandlers.PluginCalledFunc {
		p.eventHandlers.PluginCalledFunc(work, plugin)
	}

	if work.IsSuspended() {
		next.action = _ACTION_SUSPEND
		next.reason = work.reason
		return
	}

	if work.IsTerminated() {
		next.action = _ACTION_UNEXPECT
		next.reason = work.reason
		return
	}

	if work.IsStopped() {
		next.action = _ACTION_STOP
		next.reason = work.reason
		return
	}

	return
}

func (p *Pipeline) actStop(work *Workpiece, act *action) *action {

	next := &action{
		job:    work.GetJobID(),
		action: _ACTION_CLEAN,
		reason: "The target is been stopped",
	}

	work.Stop(act.reason)

	if nil == p.eventHandlers || nil == p.eventHandlers.StopFunc {
		return next
	}

	err := p.eventHandlers.StopFunc(work)

	if nil != err {
		next.action = _ACTION_UNEXPECT
		next.reason = err.Error()
	}

	return next
}

func (p *Pipeline) actSuspend(work *Workpiece, act *action) *action {

	next := &action{
		job:    work.GetJobID(),
		action: _ACTION_CLEAN,
		reason: "The target is been suspended",
	}

	if nil == p.eventHandlers || nil == p.eventHandlers.SuspendFunc {
		return next
	}

	err := p.eventHandlers.SuspendFunc(work)

	if nil != err {
		next.action = _ACTION_UNEXPECT
		next.reason = err.Error()
	}

	return next
}

func (p *Pipeline) actComplete(work *Workpiece, act *action) *action {

	next := &action{
		job:    work.GetJobID(),
		action: _ACTION_CLEAN,
		reason: "all plugins have been executed",
	}

	if nil == p.eventHandlers || nil == p.eventHandlers.DoneFunc {
		return next
	}

	err := p.eventHandlers.DoneFunc(work)

	if nil != err {
		next.action = _ACTION_UNEXPECT
		next.reason = err.Error()
	}

	return next
}

func (p *Pipeline) actUnexpect(work *Workpiece, act *action) *action {

	p.deleteWorkpiece(work.GetJobID())
	p.eventQueue.delete(work.GetJobID())

	work.Terminate("Unexpected Error:" + act.reason)

	if nil == p.eventHandlers || nil == p.eventHandlers.DoneFunc {
		return nil
	}

	p.eventHandlers.UnexpectFunc(work)

	return nil
}

func (p *Pipeline) actClean(work *Workpiece, act *action) *action {
	actions := p.eventQueue.get(work.GetJobID())
	if nil == actions || actions.Len() == 0 {
		p.deleteWorkpiece(work.GetJobID())
		p.eventQueue.delete(work.GetJobID())
	}

	return nil
}
