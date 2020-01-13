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

package controller

import (
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/util/errors"
)

/*******************Conditions***************************/
func condTRPending(args ...interface{}) bool {
	_, _, _, record := convertTaskRoleStateMachineArgs(args...)

	if nil == record {
		return true
	}

	pending := true

	for i := 0; i < len(record.ReplicaStatuses); i++ {
		status := &record.ReplicaStatuses[i]
		if status.Phase != TRRAPending.GetName() &&
			status.Phase != TRRAPreparing.GetName() &&
			status.Phase != TRRACreationRequested.GetName() &&
			status.Phase != TRRAAssigned.GetName() &&
			status.Phase != TRRARetryPending.GetName() {

			pending = false

			break
		}
	}

	return pending
}

func condTRRunning(args ...interface{}) bool {
	_, _, _, record := convertTaskRoleStateMachineArgs(args...)

	if nil == record {
		return false
	}

	running := false

	for i := 0; i < len(record.ReplicaStatuses); i++ {
		replica := &record.ReplicaStatuses[i]
		if replica.Phase == TRRARunning.GetName() ||
			replica.Phase == TRRADeletionPending.GetName() ||
			replica.Phase == TRRADeletionRequested.GetName() ||
			replica.Phase == TRRACompleted.GetName() {
			running = true
			break
		}
	}

	if false == running {
		return false
	}

	if record.Phase == TRRunning.GetName() || record.Phase == TRPending.GetName() {
		return true
	}

	return false
}

func condTRCleaningPending(args ...interface{}) bool {
	_, _, _, record := convertTaskRoleStateMachineArgs(args...)

	if nil == record {
		return false
	}

	if record.Phase == TRCleaningPending.GetName() {
		return true
	}

	return false
}

func condTRCompleted(args ...interface{}) bool {

	_, taskset, _, record := convertTaskRoleStateMachineArgs(args...)

	if nil == taskset {
		return false
	}
	if nil == record {
		return false
	}

	completionPolicy := taskset.GetTaskRoleCompletionPolicy(record.Name)

	completed, _, _ := isTaskRoleCompleted(completionPolicy, record)

	if true == completed && record.Phase == TRCompleted.GetName() {
		return true
	}

	return false
}

/********************Actions******************************/

func actSyncReplicaStatus(args ...interface{}) error {

	controller, taskset, controlunit, record := convertTaskRoleStateMachineArgs(args...)

	if nil == record {
		return nil
	}

	errs := []error{}

	for i := 0; i < len(record.ReplicaStatuses); i++ {
		err := controller.syncTaskRoleReplicaStatus(taskset, controlunit, &record.ReplicaStatuses[i])
		if err != nil {
			errs = append(errs, err)
		}
	}

	if len(errs) != 0 {
		return errors.NewAggregate(errs)
	}

	return nil
}

func actStopReplicas(args ...interface{}) error {

	_, _, _, record := convertTaskRoleStateMachineArgs(args...)

	for i := 0; i < len(record.ReplicaStatuses); i++ {

		replica := &record.ReplicaStatuses[i]

		if replica.Phase == TRRARunning.GetName() || replica.Phase == TRRAPreparing.GetName() {
			replica.Phase = TRRADeletionPending.GetName()
			replica.PhaseMessage = "Stop replica"
			replica.TransitionTime = metav1.Now()
			replica.Stopped = true
		}

		if replica.Phase == TRRAPending.GetName() || replica.Phase == TRRACompleted.GetName() {
			replica.Phase = TaskRoleReplicaCompleted.GetName()
			replica.PhaseMessage = "Stop replica"
			replica.TransitionTime = metav1.Now()
			replica.Stopped = true
		}

	}

	return actSyncReplicaStatus(args...)
}

/********************Transitions***************************/

func condWhenAnyReplicaRunning(args ...interface{}) (bool, string) {

	_, _, _, record := convertTaskRoleStateMachineArgs(args...)

	if nil == record {
		return false, "Missing taskrole  status"
	}

	running := false

	for i := 0; i < len(record.ReplicaStatuses); i++ {
		replica := &record.ReplicaStatuses[i]
		if replica.Phase == TRRARunning.GetName() ||
			replica.Phase == TRRADeletionPending.GetName() ||
			replica.Phase == TRRADeletionRequested.GetName() ||
			replica.Phase == TRRACompleted.GetName() {
			running = true
			break
		}
	}

	if true == running {
		return true, "Some replica is running"
	}

	return false, "No replica is running"
}

func condWhenTaskRoleCompleted(args ...interface{}) (bool, string) {
	_, taskset, _, record := convertTaskRoleStateMachineArgs(args...)

	if nil == taskset {
		return false, "Missing taskset"
	}
	if nil == record {
		return false, "Missing taskrole status"
	}

	completionPolicy := taskset.GetTaskRoleCompletionPolicy(record.Name)

	completed, _, reason := isTaskRoleCompleted(completionPolicy, record)

	if true == completed {
		return true, reason
	}

	return false, reason
}

func condWhenAllReplicaCompleted(args ...interface{}) (bool, string) {

	_, _, _, record := convertTaskRoleStateMachineArgs(args...)

	if nil == record {
		return false, "Missing taskrole status"
	}

	completed := true

	for i := 0; i < len(record.ReplicaStatuses); i++ {
		replica := &record.ReplicaStatuses[i]
		if replica.Phase != TaskRoleReplicaCompleted.GetName() {
			completed = false
			break
		}
	}

	if true == completed {
		return true, "TaskRole is completed ,because all replica are completed"
	}

	return false, "TaskRole is not completed ,because somm replica is not completed now"
}
