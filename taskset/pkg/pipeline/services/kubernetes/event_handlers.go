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

package kubernetes

import (
	"encoding/json"
	"go.uber.org/zap"
	typeTaskset "scheduler/pkg/crd/apis/taskset/v1alpha1"
	api "scheduler/pkg/pipeline/apis/module"
	"scheduler/pkg/pipeline/constants/jobstate"
	libController "scheduler/pkg/tasksetcontroller/controller"
)

func (s *Service) emit(jobID, state string, taskset *typeTaskset.TaskSet) {
	s.mutex.RLock()
	defer s.mutex.RUnlock()

	s.logger.Debug("Event emit",
		zap.String("jobID", jobID),
		zap.String("jobState", state),
	)
	event := &api.JobEvent{
		JobID:     jobID,
		EventName: state,
		Namespace: taskset.Namespace,
		Header:    getJobHeader(taskset),
		TaskSet:   taskset,
	}

	for _, box := range s.mailboxes {
		if nil != box {
			box.add(event.DeepCopy())
		}
	}
}

func (s *Service) convert(obj interface{}) *typeTaskset.TaskSet {

	taskset, errMsg := deltaFIFOObjToTaskSet(obj)

	if errMsg != "" && nil != s.logger {
		s.logger.Error(errMsg)
		return nil
	}

	return taskset
}

func (s *Service) onTaskSetAdd(obj interface{}) {
	ta := s.convert(obj)

	if nil == ta || nil == ta.Status {
		return
	}

	state := MapPhaseToState(ta.Status.Phase, ta.Status.State)
	//taskset will be added again when the service restart ,
	//but the state of taskset maybe others ,not just PENDING
	s.emit(ta.Name, state, ta)

}

func (s *Service) onTaskSetUpdate(old, obj interface{}) {

	taold := s.convert(old)

	tanew := s.convert(obj)

	if nil == taold || nil == tanew {
		return
	}
	var header, _ = tanew.ObjectMeta.Annotations["header"]
	headerMap := make(map[string]string)
	err := json.Unmarshal([]byte(header), &headerMap)
	if err == nil {
		var jobID, jobIDExist = headerMap["jobID"]
		if jobIDExist {
			var phaseMessage *typeTaskset.TaskMessage = tanew.GetTaskPhaseMessage()
			s.app.Services().Job().UpdateJobSummary(jobID, phaseMessage)
		}
	}

	var oldState, newState string
	var oldPhase, newPhase string

	if nil == taold.Status {
		oldState = jobstate.PENDING
	} else {
		oldState = MapPhaseToState(taold.Status.Phase, taold.Status.State)
		oldPhase = taold.Status.Phase
	}

	if nil == tanew.Status {
		newState = jobstate.PENDING
	} else {
		newState = MapPhaseToState(tanew.Status.Phase, tanew.Status.State)
		newPhase = tanew.Status.Phase
	}

	s.logger.Debug("TaskSet update state:",
		zap.String("jobID", tanew.Name),
		zap.String("OldState", oldState), zap.String("OldPhase", oldPhase),
		zap.String("NewState", newState), zap.String("NewPhase", newPhase),
		)

	if newState == jobstate.PENDING && nil != taold && nil != taold.Status {
		if taold.Status.Phase == libController.TSARunning.GetName() {
			return
		}
	}

	if oldState != newState && "" != newState && jobstate.UNKNOWN != newState {
		s.emit(tanew.Name, newState, tanew)
	} else if oldState == newState && oldState == jobstate.PENDING {
		if nil != tanew.Status && tanew.Status.Phase == libController.TSAPending.GetName() {
			s.emit(tanew.Name, newState, tanew)
		}
	}
}

func (s *Service) onTaskSetDelete(obj interface{}) {
	ta := s.convert(obj)
	if ta == nil {
		return
	}

	var state string
	if nil == ta.Status {
		state = jobstate.PENDING
	} else {
		state = MapPhaseToState(ta.Status.Phase, ta.Status.State)
	}

	if state == jobstate.FAILED ||
		state == jobstate.SUCCEEDED {
		s.app.Services().Job().ReplenishJobOnOver(ta.Name, state, ta.Namespace)
		return
	}

	if state == jobstate.STOPPED {
		return
	}

	var header, _ = ta.ObjectMeta.Annotations["header"]
	headerMap := make(map[string]string)
	err := json.Unmarshal([]byte(header), &headerMap)
	if err == nil {
		var jobID, jobIDExist = headerMap["jobID"]
		if jobIDExist {
			var phaseMessage *typeTaskset.TaskMessage = &typeTaskset.TaskMessage{}
			phaseMessage.State = "Stopped"
			phaseMessage.StateMessage = "Task was stopped manually or timed out"
			s.app.Services().Job().UpdateJobSummary(jobID, phaseMessage)
		}
	}

	s.emit(ta.Name, jobstate.STOPPED, ta)
	s.app.Services().Job().StopJob(ta.Name, ta.Namespace, "exception stopped")
}
