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
	"fmt"
	"time"

	corev1 "k8s.io/api/core/v1"
)

/*******************Conditions***************************/

func condTRRAPending(args ...interface{}) bool {
	_, _, _, _, pod, record := convertReplicaStateMachineArgs(args...)
	return nil == pod && record.Phase == TRRAPending.GetName()
}

func condTRRACreationRequested(args ...interface{}) bool {
	_, _, _, _, _, record := convertReplicaStateMachineArgs(args...)
	return record.Phase == TRRACreationRequested.GetName()
}

func condTRRAPreparing(args ...interface{}) bool {

	_, _, _, _, pod, record := convertReplicaStateMachineArgs(args...)

	if nil == pod {
		return false
	}
	// pod is being deleted
	if pod.DeletionTimestamp != nil {
		return false
	}

	if record.Phase == TRRAPreparing.GetName() {
		return true
	}

	return false
}

func condTRRAAssigned(args ...interface{}) bool {
	_, _, _, _, pod, record := convertReplicaStateMachineArgs(args...)

	if nil == pod {
		return false
	}
	// pod is being deleted
	if pod.DeletionTimestamp != nil {
		return false
	}

	if record.Phase == TRRAAssigned.GetName() {
		return true
	}

	return false
}

func condTRRARunning(args ...interface{}) bool {
	_, _, _, _, pod, record := convertReplicaStateMachineArgs(args...)

	if nil == pod {
		return false
	}
	// pod is being deleted
	if pod.DeletionTimestamp != nil {
		return false
	}

	if record.Phase == TRRARunning.GetName() {
		return true
	}

	if record.Phase == TRRAPreparing.GetName() && pod.Status.Phase == corev1.PodRunning {
		return true
	}

	return false
}

func condTRRADeletionPending(args ...interface{}) bool {
	_, _, _, _, pod, record := convertReplicaStateMachineArgs(args...)

	// pod is being deleted
	if nil != pod && pod.DeletionTimestamp != nil {
		return false
	}

	if record.Phase == TRRADeletionPending.GetName() {
		return true
	}

	return false
}

func condTRRADeletionRequested(args ...interface{}) bool {
	_, _, _, _, pod, record := convertReplicaStateMachineArgs(args...)

	if nil == pod {
		//maybe delete by others
		if record.Phase == TRRARunning.GetName() || record.Phase == TRRAPreparing.GetName() {
			return true
		}
		return false
	}

	//that's the truth
	if nil != pod && pod.DeletionTimestamp != nil {
		return true
	}

	if record.Phase == TRRADeletionRequested.GetName() {
		return true
	}

	return false
}

func condTRRACompleted(args ...interface{}) bool {
	_, _, _, _, pod, record := convertReplicaStateMachineArgs(args...)
	if pod != nil {
		return false
	}

	if record.Phase == TRRACompleted.GetName() {
		return true
	}

	if record.Phase == TRRADeletionPending.GetName() || record.Phase == TRRADeletionRequested.GetName() {
		return true
	}

	return false
}

func condTRRARetryPending(args ...interface{}) bool {
	_, _, _, _, pod, record := convertReplicaStateMachineArgs(args...)

	if pod != nil {
		return false
	}

	if record.Phase == TRRARetryPending.GetName() {
		return true
	}

	return false
}

func condTaskRoleReplicaCompleted(args ...interface{}) bool {

	_, _, _, _, pod, record := convertReplicaStateMachineArgs(args...)

	if nil != pod {
		return false
	}

	if record.Phase == TaskRoleReplicaCompleted.GetName() {
		return true
	}

	return false
}

/********************Actions******************************/

func actCreatePod(args ...interface{}) error {
	controller, taskset, controlUnit, _, _, record := convertReplicaStateMachineArgs(args...)

	pod, err := controller.actCreatePod(taskset, controlUnit, record)

	if err != nil {
		return err
	}

	if nil != pod {
		record.PodName = pod.Name
		record.PodUID = &pod.UID
		record.PodIP = pod.Status.PodIP
		record.PodHostIP = pod.Status.HostIP
		record.StartAt = pod.Status.StartTime
	}

	return err
}

func actWaitPodSynced(args ...interface{}) error {

	controller, taskset, _, _, pod, record := convertReplicaStateMachineArgs(args...)

	if pod != nil {
		return nil
	}

	timeLeft := controller.timeLeftForTotallySynced(record.TransitionTime)

	if timeLeft <= 0 {
		return nil
	}

	controller.waitCacheSynced(taskset)

	return nil
}

func actDeletePod(args ...interface{}) error {

	controller, taskset, _, _, pod, record := convertReplicaStateMachineArgs(args...)

	if pod == nil {
		return nil
	}

	err := controller.actDeletePod(taskset, pod, record)

	return err
}

func actWaitPodDeletionCompleted(args ...interface{}) error {

	controller, taskset, _, _, pod, record := convertReplicaStateMachineArgs(args...)

	if pod == nil {
		return nil
	}

	timeLeft := controller.timeLeftForTotallySynced(record.TransitionTime)

	if timeLeft <= 0 {
		return nil
	}

	controller.waitCacheSynced(taskset)

	return nil
}

func actTRRADelayRetry(args ...interface{}) error {

	controller, taskset, _, _, _, record := convertReplicaStateMachineArgs(args...)

	spec := taskset.GetTaskRoleSpec(record.Name)

	if nil == spec {
		return nil
	}

	if 0 == spec.RetryPolicy.Delay {
		return nil
	}

	delay := time.Duration(spec.RetryPolicy.Delay) * time.Second

	waitTime := time.Since(record.TransitionTime.Time)

	if waitTime < delay {
		controller.tQueue.AddAfter(taskset.Key(), delay-waitTime)
	}

	return nil

}

/********************Transitions***************************/

func condWhenTRRACreationRequestedSyncTimeout(args ...interface{}) (bool, string) {

	controller, _, _, _, _, record := convertReplicaStateMachineArgs(args...)

	timeLeft := controller.timeLeftForTotallySynced(record.TransitionTime)

	if timeLeft < 0 {
		return true, "It's already timeout ,can't wait anymore"
	}

	return false, "Creation has be made,waiting for cache synced"
}

func condWhenRRACreationRequestedSynced(args ...interface{}) (bool, string) {

	_, _, _, _, pod, _ := convertReplicaStateMachineArgs(args...)

	if nil != pod {
		return true, "Creation has be made,and pod appears at local"
	}

	return false, "Creation has be made,and pod does not appears at local"

}

func condWhenPodRunning(args ...interface{}) (bool, string) {
	_, _, _, _, pod, _ := convertReplicaStateMachineArgs(args...)

	if nil == pod {
		return false, "can not find pod at local "
	}

	if pod.Status.Phase == corev1.PodRunning {
		return true, "Pod is running"
	}

	return false, fmt.Sprintf("Pod is not running,the PodPhase is %v", pod.Status.Phase)
}

func condWhenPodAssigned(args ...interface{}) (bool, string) {
	_, _, _, _, pod, record := convertReplicaStateMachineArgs(args...)

	if nil == pod {
		return false, "can not find pod at local "
	}

	if pod.Status.HostIP != "" && pod.Status.PodIP != "" {
		return true, record.PhaseMessage
	}

	return false, "Pod is not assigned"
}

func condWhenPodExited(args ...interface{}) (bool, string) {
	_, _, _, _, pod, _ := convertReplicaStateMachineArgs(args...)

	if nil == pod {
		return false, "can not find pod at local "
	}

	reason := fmt.Sprintf(
		"PodPhase:%v ,PodMessage:%v ,PodReason: %v",
		pod.Status.Phase,
		pod.Status.Message,
		pod.Status.Reason,
	)

	if pod.Status.Phase != corev1.PodPending && pod.Status.Phase != corev1.PodRunning {
		return true, reason
	}

	return false, reason
}

func condWhenPodDeletionCompleted(args ...interface{}) (bool, string) {
	_, _, _, _, pod, record := convertReplicaStateMachineArgs(args...)
	if nil == pod {
		return true, record.PhaseMessage
	}
	return false, record.PhaseMessage
}

func condWhenNeedRetryReplica(args ...interface{}) (bool, string) {
	_, taskset, _, _, _, record := convertReplicaStateMachineArgs(args...)

	if true == record.Stopped {
		return false, "Replica is stopped by parent TaskRole"
	}

	retry, reason := shoudRetryTaskRoleReplica(taskset, record)

	if true == retry {
		return retry, reason
	}

	return retry, record.PhaseMessage
}

func condWhenTRRADelayReached(args ...interface{}) (bool, string) {
	_, taskset, _, _, _, record := convertReplicaStateMachineArgs(args...)

	spec := taskset.GetTaskRoleSpec(record.Name)

	if nil == spec {
		return true, record.PhaseMessage
	}

	if 0 == spec.RetryPolicy.Delay {
		return true, record.PhaseMessage
	}

	delay := time.Duration(spec.RetryPolicy.Delay) * time.Second

	waitTime := time.Since(record.TransitionTime.Time)

	if waitTime >= delay {
		return true, record.PhaseMessage
	}

	return false, record.PhaseMessage
}
