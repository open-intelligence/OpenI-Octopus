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
	"math/rand"

	typeTaskset "scheduler/pkg/crd/apis/taskset/v1alpha1"

	"scheduler/pkg/pipeline/constants/jobstate"
	libKubernetesService "scheduler/pkg/pipeline/services/kubernetes"
	libController "scheduler/pkg/tasksetcontroller/controller"

	jsoniter "github.com/json-iterator/go"
	meta "k8s.io/apimachinery/pkg/apis/meta/v1"
)

func nextState(ts *typeTaskset.TaskSet) *typeTaskset.TaskSet {

	header := ts.Annotations["header"]

	mockCommand := jsoniter.Get([]byte(header), "mockCommand").ToString()

	if nil == ts.Status {
		ts.Status = newTaskSetStatus(ts)
	}
	state := libKubernetesService.MapPhaseToState(ts.Status.Phase, "")
	if state == jobstate.PENDING {
		ts.Status.Phase = libController.TSARunning.GetName()
		ts.Status.State = libController.RUNNING
		return ts
	}

	if mockCommand == "alwaysRunning" {
		return ts
	}
	if mockCommand == "alwaysUnknown" {
		return ts
	}

	ts.Status.Phase = libController.TaskSetCompleted.GetName()
	if mockCommand == "mustSucceeded" {
		ts.Status.State = libController.SUCCEEDED
	} else if mockCommand == "mustFailed" {
		ts.Status.State = libController.FAILED
		ts.Status.StateMessage = "mustFailed by kubernetes mock"
	} else if rand.Intn(10) > 8 {
		ts.Status.State = libController.FAILED
		ts.Status.StateMessage = "randomFailed by kubernetes mock"
	} else {
		ts.Status.State = libController.SUCCEEDED
	}
	return ts
}

func newTaskSetStatus(taskset *typeTaskset.TaskSet) *typeTaskset.TaskSetStatus {

	status := &typeTaskset.TaskSetStatus{
		Phase:             libController.TaskSetValidation.GetName(),
		PhaseMessage:      "Initialize the taskset status",
		TransitionTime:    meta.Now(),
		State:             libController.WAITING,
		StateMessage:      "Initialize the taskset status",
		ControlUnitUID:    nil,
		CreatedAt:         meta.Now(),
		StartAt:           nil,
		FinishAt:          nil,
		TotalRetriedCount: 0,
		PreemptCount:      0,
	}

	if nil == status.TaskRoleStatus {
		status.TaskRoleStatus = []typeTaskset.TaskRoleStatus{}
	}

	for i := 0; i < len(taskset.Spec.Roles); i++ {

		role := taskset.Spec.Roles[i]

		roleStatus := typeTaskset.TaskRoleStatus{
			Name:            role.Name,
			State:           libController.WAITING,
			Phase:           libController.TRPending.GetName(),
			PhaseMessage:    "TaskRole is waiting",
			TransitionTime:  meta.Now(),
			ReplicaStatuses: []typeTaskset.ReplicaStatus{},
		}

		for k := uint(0); k < role.Replicas; k++ {

			replicaStatus := typeTaskset.ReplicaStatus{
				Index:             k,
				Name:              role.Name,
				Phase:             libController.TRRAPending.GetName(),
				PhaseMessage:      "TaskRole replica is pending",
				Stopped:           false,
				TransitionTime:    meta.Now(),
				TotalRetriedCount: 0,
				StartAt:           nil,
				FinishAt:          nil,
				PodName:           "",
				PodUID:            nil,
				PodIP:             "",
				PodHostIP:         "",
				ContainerName:     "",
				ContainerID:       "",
				TerminatedInfo:    nil,
			}

			roleStatus.ReplicaStatuses = append(roleStatus.ReplicaStatuses, replicaStatus)
		}

		status.TaskRoleStatus = append(status.TaskRoleStatus, roleStatus)
	}
	return status
}
