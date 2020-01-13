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

import "time"

/********************Conditions**********************************/
func condTaskSetValidation(args ...interface{}) bool {
	_, _, controlunit, record := convertTaskSetStateMachineArgs(args...)
	return nil == controlunit && record.Status.Phase == TaskSetValidation.GetName()
}

func condTSAPending(args ...interface{}) bool {

	_, _, controlunit, record := convertTaskSetStateMachineArgs(args...)

	return nil == controlunit && record.Status.Phase == TSAPending.GetName()
}

func condTSACreationRequested(args ...interface{}) bool {

	_, _, _, record := convertTaskSetStateMachineArgs(args...)

	return record.Status.Phase == TSACreationRequested.GetName()
}

func condTSAPreparing(args ...interface{}) bool {
	_, _, controlunit, record := convertTaskSetStateMachineArgs(args...)

	if nil == controlunit {
		return false
	}

	if controlunit.DeletionTimestamp != nil {
		return false
	}

	if record.Status.Phase == TSAPreparing.GetName() {
		return true
	}

	// that's the truth
	if record.Status.Phase == TSACreationRequested.GetName() {
		return true
	}

	return false
}

func condTSARunning(args ...interface{}) bool {
	_, _, controlunit, record := convertTaskSetStateMachineArgs(args...)

	if nil == controlunit {
		return false
	}

	if controlunit.DeletionTimestamp != nil {
		return false
	}

	if record.Status.Phase == TSARunning.GetName() {
		return true
	}

	// that's the truth
	if record.Status.Phase == TSAPreparing.GetName() && isAnyTaskRoleRunning(record) {
		return true
	}

	return false
}

func condTSADeletionPending(args ...interface{}) bool {

	_, _, controlunit, record := convertTaskSetStateMachineArgs(args...)

	if nil == controlunit {
		return false
	}

	if controlunit.DeletionTimestamp != nil {
		return false
	}

	if record.Status.Phase == TSADeletionPending.GetName() {
		return true
	}

	return false
}

func condTSADeletionRequested(args ...interface{}) bool {
	_, _, controlunit, record := convertTaskSetStateMachineArgs(args...)

	if nil == controlunit {
		//maybe delete by others
		if record.Status.Phase == TSAPreparing.GetName() || record.Status.Phase == TSARunning.GetName() {
			return true
		}

		return false
	}

	//that's the truth
	if nil != controlunit && controlunit.DeletionTimestamp != nil {
		return true
	}

	if record.Status.Phase == TSADeletionRequested.GetName() {
		return true
	}

	return false
}

func condTSACompleted(args ...interface{}) bool {

	_, _, controlunit, record := convertTaskSetStateMachineArgs(args...)

	if controlunit != nil {
		return false
	}

	if record.Status.Phase == TSACompleted.GetName() {
		return true
	}
	// that's the truth
	if record.Status.Phase == TSADeletionPending.GetName() {
		return true
	}
	// that's the truth
	if record.Status.Phase == TSADeletionRequested.GetName() {
		return true
	}

	return false
}

func condTSARetryPending(args ...interface{}) bool {
	_, _, controlunit, record := convertTaskSetStateMachineArgs(args...)

	if nil != controlunit {
		return false
	}

	if record.Status.Phase == TSARetryPending.GetName() {
		return true
	}

	return false
}

func condTaskSetCompleted(args ...interface{}) bool {
	_, _, controlunit, record := convertTaskSetStateMachineArgs(args...)

	if controlunit != nil {
		return false
	}

	if record.Status.Phase == TaskSetCompleted.GetName() {
		return true
	}
	return false
}

/********************Actions*****************************/
func actBindDefaultSettings(args ...interface{}) error {
	_, taskset, _, _ := convertTaskSetStateMachineArgs(args...)
	bindDefaultEventPolicy(taskset)
	return nil
}

func actCreateControlUnit(args ...interface{}) error {

	controller, taskset, _, record := convertTaskSetStateMachineArgs(args...)

	controlunit, err := controller.actCreateControlUnit(taskset, record)

	if err == nil && controlunit != nil {
		record.Status.ControlUnitUID = &controlunit.UID
	}

	return err
}

func actWaitControlUnitSynced(args ...interface{}) error {
	controller, taskset, controlunit, record := convertTaskSetStateMachineArgs(args...)

	if controlunit != nil {
		return nil
	}

	timeLeft := controller.timeLeftForTotallySynced(record.Status.TransitionTime)

	if timeLeft <= 0 {
		return nil
	}

	controller.waitCacheSynced(taskset)

	return nil
}

func actSyncTaskRole(args ...interface{}) error {
	controller, taskset, controlunit, record := convertTaskSetStateMachineArgs(args...)
	err := controller.actSyncTaskRole(taskset, controlunit, record)
	return err
}

func actDeleteControlUnit(args ...interface{}) error {
	controller, taskset, controlunit, record := convertTaskSetStateMachineArgs(args...)
	err := controller.actDeleteControlUnit(taskset, controlunit, record)
	return err
}

func actTSADelayRetry(args ...interface{}) error {
	controller, taskset, _, record := convertTaskSetStateMachineArgs(args...)

	if taskset.Spec.RetryPolicy.Delay == 0 {
		return nil
	}

	delay := time.Duration(taskset.Spec.RetryPolicy.Delay) * time.Second

	waitTime := time.Since(record.Status.TransitionTime.Time)

	if waitTime < delay {
		controller.tQueue.AddAfter(taskset.Key(), delay-waitTime)
	}

	return nil
}

func actWaitControlUnitDeletionCompleted(args ...interface{}) error {
	controller, taskset, controlunit, record := convertTaskSetStateMachineArgs(args...)

	if controlunit == nil {
		return nil
	}

	timeLeft := controller.timeLeftForTotallySynced(record.Status.TransitionTime)

	if timeLeft <= 0 {
		return nil
	}

	controller.waitCacheSynced(taskset)

	return nil
}

/********************Transitions**********************************/

func condWhenTaskSetIllegal(args ...interface{}) (bool, string) {

	_, taskset, _, _ := convertTaskSetStateMachineArgs(args...)

	conflict, conflictName := isTaskRoleNamingConflict(taskset)

	if true == conflict {
		return true, "TaskRole naming conflicts,name:" + conflictName
	}

	illegal, reason := isTaskSetCompletionPolicyIllegal(taskset)

	if illegal {
		return true, reason
	}

	// illegal, reason　＝　isPodSpecIllegal(taskset)

	// if illegal {
	// 	return true, reason
	// }

	return false, "TaskSet is legal"
}

func condWhenTSACacheSyncTimeout(args ...interface{}) (bool, string) {

	controller, _, _, record := convertTaskSetStateMachineArgs(args...)

	timeLeft := controller.timeLeftForTotallySynced(record.Status.TransitionTime)

	if timeLeft < 0 {
		return true, "It's already timeout ,can't wait anymore"
	}

	return false, "waiting for cache synced"

}

func condWhenTSACacheSynced(args ...interface{}) (bool, string) {
	_, _, controlunit, _ := convertTaskSetStateMachineArgs(args...)

	if controlunit != nil {
		return true, ""
	}

	return false, "waiting for cache synced"
}

func condWhenAnyTaskRoleRunning(args ...interface{}) (bool, string) {
	_, _, _, record := convertTaskSetStateMachineArgs(args...)
	running := isAnyTaskRoleRunning(record)
	if true == running {
		return true, "Some TaskRole is running"
	}
	return false, "No TaskRole is running"
}

func condWhenTSAFailedOrSucceeded(args ...interface{}) (bool, string) {

	_, taskset, _, record := convertTaskSetStateMachineArgs(args...)

	completed, _, reason := shouldTaskSetCompleted(taskset, record)

	return completed, reason
}

func condWhenTSAControlUnitDeletionCompleted(args ...interface{}) (bool, string) {

	_, _, controlunit, _ := convertTaskSetStateMachineArgs(args...)

	if controlunit == nil {
		return true, "Controlunit deletion is completed"
	}

	return false, "Controlunit still can be found at local"
}

func condWhenNeedRetry(args ...interface{}) (bool, string) {

	_, taskset, _, record := convertTaskSetStateMachineArgs(args...)

	_, succeeded, reason := shouldTaskSetCompleted(taskset, record)

	if true == succeeded {
		return false, reason
	}

	return shouldRetryTaskSet(taskset, record)
}

func condWhenTSADelayReached(args ...interface{}) (bool, string) {
	_, taskset, _, record := convertTaskSetStateMachineArgs(args...)

	if taskset.Spec.RetryPolicy.Delay == 0 {
		return true, "No need to delay ,just try again"
	}

	delay := time.Duration(taskset.Spec.RetryPolicy.Delay) * time.Second

	waitTime := time.Since(record.Status.TransitionTime.Time)

	if waitTime >= delay {
		return true, "Delay reached"
	}

	return false, ""
}

/**************************************************************/
