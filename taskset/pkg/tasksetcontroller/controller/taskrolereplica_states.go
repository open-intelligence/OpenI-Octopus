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
	typeStateMachine "scheduler/pkg/common/statemachine"
	typeTaskSet "scheduler/pkg/crd/apis/taskset/v1alpha1"

	jsoniter "github.com/json-iterator/go"
	"github.com/pkg/errors"
	"go.uber.org/zap"
	corev1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

var (
	//declare all taskrole replica attempt states
	//TRRA -> TaskRole replica attempt

	// TRRAPending means this repica has not been scheduled ,and will be
	TRRAPending = typeStateMachine.NewState("TaskRoleReplicaAttemptPending")

	//TRRACreationRequested means pod does not exist at local , but the creation request has already been made
	TRRACreationRequested = typeStateMachine.NewState("TaskRoleReplicaAttemptCreationRequested")

	//TRRAPreparing means pod exists at local ,and is not being deleted, and the deletion request has not been made,
	// and the pod is not running or exited or unknown state
	TRRAPreparing = typeStateMachine.NewState("TaskRoleReplicaAttemptPreparing")

	//TRRAAssigned means pod exists at local ,and is not being deleted, and the deletion request has not been made,
	// and the pod is not running or exited or unknown state,and pod is assigned to node
	TRRAAssigned = typeStateMachine.NewState("TaskRoleReplicaAttemptAssigned")
	//TRRARunning means  pod exists at local ,and is not being deleted, and the deletion request has not been made,
	// and pod is running
	TRRARunning = typeStateMachine.NewState("TaskRoleReplicaAttemptRunning")

	//TRRADeletionPending means pod exists at local,and is not being deleted ,and the deletion request has not been made,
	// and is ready to be deleted
	TRRADeletionPending = typeStateMachine.NewState("TaskRoleReplicaAttemptDeletonPending")

	//TRRADeletionRequested means pod still exists at local cache ,but  the deletion request has already been made
	TRRADeletionRequested = typeStateMachine.NewState("TaskRoleReplicaAttemptDeletionRequested")

	//TRRACompleted means pod has already exited and  has been deleted from k8s and disappears from local cache,
	TRRACompleted = typeStateMachine.NewState("TaskRoleReplicaAttemptCompleted")

	TRRARetryPending = typeStateMachine.NewState("TaskRoleReplicaAttemptRetryPending")

	//TaskRoleReplicaCompleted means the state of taskrole replica state is the last one (TRRACompleted), and the replica
	// will not been retied again according to the RetryPolicy
	TaskRoleReplicaCompleted = typeStateMachine.NewState("TaskRoleReplicaCompleted")
)

// DeclareReplicaStates declares the states of TaskRole replica
func (c *TaskSetController) DeclareReplicaStates() {

	TRRAPending.
		Condition(condTRRAPending).
		Action(actCreatePod).
		NextState(TRRACreationRequested, "TaskRole replica is going to start")

	TRRACreationRequested.
		Condition(condTRRACreationRequested).
		Action(actWaitPodSynced).
		When(condWhenTRRACreationRequestedSyncTimeout).To(TRRADeletionPending,
		"Waiting for the synchronization of Pod  is already timeout").GoRun().
		When(condWhenRRACreationRequestedSynced).To(TRRAPreparing,
		"Pod is synced").GoRun()

	//no action for this state,just wait the event of the pod
	TRRAPreparing.
		Condition(condTRRAPreparing).
		When(condWhenPodRunning).To(TRRARunning, "Pod is running now").
		When(condWhenPodExited).To(TRRADeletionPending, "Pod is exited").GoRun().
		When(condWhenPodAssigned).To(TRRAAssigned, "Pod scheduled").GoRun()

	TRRAAssigned.
		Condition(condTRRAAssigned).
		When(condWhenPodRunning).To(TRRARunning, "Pod is running now").GoRun().
		When(condWhenPodExited).To(TRRADeletionPending, "Pod is exited").GoRun()

	TRRARunning.
		Condition(condTRRARunning).
		When(condWhenPodExited).To(TRRADeletionPending, "Pod is exited").GoRun()

	TRRADeletionPending.
		Condition(condTRRADeletionPending).
		Action(actDeletePod).
		NextState(TRRADeletionRequested, "The deletion request of pod has been made")

	TRRADeletionRequested.
		Condition(condTRRADeletionRequested).
		Action(actWaitPodDeletionCompleted).
		When(condWhenPodDeletionCompleted).To(TRRACompleted, "Pod deletion completed").GoRun()

	TRRACompleted.
		Condition(condTRRACompleted).
		When(condWhenNeedRetryReplica).To(TRRARetryPending, "Retry replica again").
		Else().To(TaskRoleReplicaCompleted, "No need to retry replica,taskrole replica attempt completed")

	TRRARetryPending.
		Condition(condTRRARetryPending).
		Action(actTRRADelayRetry).
		When(condWhenTRRADelayReached).To(TRRAPending, "retry delay reached").GoRun()

	TaskRoleReplicaCompleted.Condition(condTaskRoleReplicaCompleted)

	c.replicaStateMachine.Register(
		TRRAPending,
		TRRACreationRequested,
		TRRAPreparing,
		TRRAAssigned,
		TRRARunning,
		TRRADeletionPending,
		TRRADeletionRequested,
		TRRACompleted,
		TRRARetryPending,
		TaskRoleReplicaCompleted,
	)

	c.replicaStateMachine.OnStateChange(replicaStateChangeHandler)

	c.replicaStateMachine.OnUnexpectedSituation(replicaUnexpectedHandler)

}

func replicaStateChangeHandler(pre, next *typeStateMachine.State, reason string, args ...interface{}) error {
	controller, taskset, _, _, pod, record := convertReplicaStateMachineArgs(args...)

	//update replica status
	if record.Phase != next.GetName() {
		record.Phase = next.GetName()
		record.PhaseMessage = reason
		record.TransitionTime = metav1.Now()
		controller.logger.Info("",
			zap.String("QueryKey", "ReplicaTransition"),
			zap.String("TaskSet", taskset.Name),
			zap.String("Namespace", taskset.Namespace),
			zap.String("Role", record.Name),
			zap.String("PodName", record.PodName),
			zap.String("PrePhase", pre.GetName()),
			zap.String("NextPhase", next.GetName()),
			zap.String("Reason", reason),
		)
	}

	var podJustAssigned bool = false

	if nil != pod {
		podJustAssigned = (record.PodIP == "" && "" != pod.Status.PodIP) || (record.PodHostIP == "" && "" != pod.Status.HostIP)
		updatePodInfo(record, pod)
	}

	// record the pod information

	if true == podJustAssigned {
		logPodHistory(
			controller.logger,
			"TaskRole replica is assigned to node",
			taskset,
			record,
		)

	}
	//this replica is going to run again
	if pre.GetName() == TRRARetryPending.GetName() && next.GetName() == TRRAPending.GetName() {

		logPodHistory(
			controller.logger,
			"TaskRole replica is going to retry,log the pod history",
			taskset,
			record,
		)

		record.TotalRetriedCount++

		record.PodUID = nil
		record.TerminatedInfo = nil
		record.PodName = ""
		record.PodIP = ""
		record.PodHostIP = ""
		record.ContainerName = ""
		record.ContainerID = ""
		record.StartAt = nil
		record.FinishAt = nil
	}

	if record.Phase == TaskRoleReplicaCompleted.GetName() {
		logPodHistory(
			controller.logger,
			"TaskRole replica attempt completed",
			taskset,
			record,
		)
	}

	return nil
}

func updatePodInfo(record *typeTaskSet.ReplicaStatus, pod *corev1.Pod) {

	if nil == pod || nil == record {
		return
	}

	if nil == record.PodUID {
		record.PodUID = &pod.UID
	}

	if pod.Name != record.PodName {
		record.PodName = pod.Name
	}

	if pod.Status.Reason != record.PodReason {
		record.PodReason = pod.Status.Reason
	}

	if nil == record.StartAt && pod.Status.StartTime != nil {
		record.StartAt = &metav1.Time{Time: (*pod.Status.StartTime).Time}
	}

	if pod.Status.PodIP != record.PodIP && "" != pod.Status.PodIP {
		record.PodIP = pod.Status.PodIP
	}
	if pod.Status.HostIP != record.PodHostIP && "" != pod.Status.HostIP {
		record.PodHostIP = pod.Status.HostIP
	}

	if record.ContainerName == "" && len(pod.Status.ContainerStatuses) > 0 {
		record.ContainerName = pod.Status.ContainerStatuses[0].Name
	}

	if record.ContainerID == "" && len(pod.Status.ContainerStatuses) > 0 {
		record.ContainerID = pod.Status.ContainerStatuses[0].ContainerID
	}

	if record.TerminatedInfo == nil && len(pod.Status.ContainerStatuses) > 0 &&
		nil != pod.Status.ContainerStatuses[0].State.Terminated {

		record.FinishAt = &metav1.Time{Time: pod.Status.ContainerStatuses[0].State.Terminated.FinishedAt.Time}
		//can't use container's startTime as replica's startTime ,because container maybe restarts many times

		if record.TerminatedInfo == nil {
			record.TerminatedInfo = &typeTaskSet.ContainerTerminatedInfo{}
		}

		terminated := pod.Status.ContainerStatuses[0].State.Terminated //pointer
		terminatedInfo := record.TerminatedInfo                        //pointer

		terminatedInfo.ExitCode = terminated.ExitCode
		terminatedInfo.ExitMessage = terminated.Message
		terminatedInfo.Signal = terminated.Signal
		terminatedInfo.Reason = terminated.Reason
	}
}

func replicaUnexpectedHandler(args ...interface{}) error {

	controller, _, _, replica, pod, record := convertReplicaStateMachineArgs(args...)

	var json = jsoniter.ConfigCompatibleWithStandardLibrary

	line := "***********TaskRole Replica Unhandle Situation***********\n"

	var logStr string = line

	if nil == replica {
		logStr += "nil\n"

	} else {
		bytes, err := json.Marshal(replica)
		if nil == err {
			logStr += string(bytes) + "\n"
		}
	}

	logStr += line

	if nil == pod {
		logStr += "nil\n"
	} else {
		bytes, err := json.Marshal(pod.ObjectMeta)
		if nil == err {
			logStr += string(bytes) + "\n"
		}
	}

	logStr += line

	if nil == record {
		logStr += "nil"
	} else {
		bytes, err := json.Marshal(record)
		if nil == err {
			logStr += string(bytes) + "\n"
		}
	}

	logStr += line

	controller.logger.Warn(logStr, zap.String("QueryKey", "UnhandleSitutation"))

	return errors.Errorf("TaskRole Replica Unhandle Situation,TaskRole:%s", record.Name)
}
