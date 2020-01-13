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
	typeStateMachine "scheduler/pkg/common/statemachine"
	typeTaskSet "scheduler/pkg/crd/apis/taskset/v1alpha1"
	"time"

	jsoniter "github.com/json-iterator/go"
	"github.com/pkg/errors"
	"go.uber.org/zap"
	corev1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

// declare all states of taskset

var (
	// In this case ,ControlUnit is ConfigMap
	//TSA -> TaskSet Attempt

	//TaskSetValidation validate the taskset settings
	TaskSetValidation = typeStateMachine.NewState("TaskSetValidation")
	// TSAPending is the TaskSetAttemptPending state, which means the TaskSet has been accepted by the system
	// but did not schedule it
	TSAPending = typeStateMachine.NewState("TaskSetAttemptPending")

	// TSACreationRequested means the creation of ControlUnit has been made
	TSACreationRequested = typeStateMachine.NewState("TaskSetAttemptCreationRequested")

	// TSAPreparing means ControlUnit exists at local ,and is not being deleted and
	// has not been deletion requested ,and the TaskSet is not completed ,and there is no TaskRole
	// which is running
	TSAPreparing = typeStateMachine.NewState("TaskSetAttemptPreparing")

	// TSARunning means ControlUnit exists and is not being deleted and has
	//  not been deletion requested and TaskSet is not completed
	// and there is at least one Pod is running
	TSARunning = typeStateMachine.NewState("TaskSetAttemptRunning")

	// TSADeletionPending means ControlUnit exists and is not being deleted and
	// has not been deletion requested and CompletionPolicy has been  satisfied
	TSADeletionPending = typeStateMachine.NewState("TaskSetAttemptDeletionPending")

	// TSADeletionRequested means ControlUnit exists  and the deletion request has been made
	TSADeletionRequested = typeStateMachine.NewState("TaskSetAttemptDeletionRequested")

	// TSACompleted means ControlUnit has been deleted from k8s and disappears from local cache,
	// and the state of TaskSetAttempt is the last state
	TSACompleted = typeStateMachine.NewState("TaskSetAttemptCompleted")

	TSARetryPending = typeStateMachine.NewState("TaskSetAttemptRetryPending")

	// TaskSetCompleted means the phase of the current TaskSet attempt is the last phase(TaskSetAttemptCompleted) ,
	// and the TaskSet will not been retied again according to the RetryPolicy
	TaskSetCompleted = typeStateMachine.NewState("TaskSetCompleted")
)

// DeclareTaskSetStates declares the states of TaskSet
func (c *TaskSetController) DeclareTaskSetStates() {

	// Describe the state change process in code
	TaskSetValidation.
		Condition(condTaskSetValidation).
		Action(actBindDefaultSettings).
		When(condWhenTaskSetIllegal).To(TaskSetCompleted, "TaskSet is illegal").
		Else().To(TSAPending, "TaskSet is legal").GoRun() //run the state machine again

	TSAPending.
		Condition(condTSAPending).
		Action(actCreateControlUnit).
		NextState(TSACreationRequested, "TaskSet is going to start")

	TSACreationRequested.
		Condition(condTSACreationRequested).
		Action(actWaitControlUnitSynced).
		When(condWhenTSACacheSyncTimeout).To(TSADeletionPending,
		"Can not wait for the synchronization of control unit anymore,it's already timeout").GoRun().
		When(condWhenTSACacheSynced).To(TSAPreparing,
		"Control unit is synced,prepare to launch tasks").GoRun()

	TSAPreparing.
		Condition(condTSAPreparing).
		Action(actSyncTaskRole).
		When(condWhenTSAFailedOrSucceeded).To(TSADeletionPending, "The attempt is completed").GoRun().
		When(condWhenAnyTaskRoleRunning).To(TSARunning, "Some of the Roles are running")

	TSARunning.
		Condition(condTSARunning).
		Action(actSyncTaskRole).
		When(condWhenTSAFailedOrSucceeded).To(TSADeletionPending, "This attempt is completed").GoRun().
		When(condWhenAnyTaskRoleRunning).Else().To(TSAPreparing, "No Role is running")

	//Before delete the controlunit directly ,we could stop all roles by mark it as TRCleaningPending at first.
	//When all roles are stopped(no pod is running), then we delete the controlunit(configMap).
	//Is this a better way ?

	TSADeletionPending.
		Condition(condTSADeletionPending).
		Action(actDeleteControlUnit).
		NextState(TSADeletionRequested, "The deletion of control unit has been requested")

	TSADeletionRequested.
		Condition(condTSADeletionRequested).
		Action(actWaitControlUnitDeletionCompleted).
		When(condWhenTSAControlUnitDeletionCompleted).To(TSACompleted,
		"The deletion of control unit is completed").GoRun()

	TSACompleted.
		Condition(condTSACompleted).
		When(condWhenNeedRetry).To(TSARetryPending, "This attempt is completed ,but need to try again").
		Else().To(TaskSetCompleted, "This attempt is completed,and no need to retry")

	TSARetryPending.
		Condition(condTSARetryPending).
		Action(actTSADelayRetry).
		When(condWhenTSADelayReached).To(TSAPending, "Retry again").GoRun()

	TaskSetCompleted.
		Condition(condTaskSetCompleted)

	// register all states to StateMachine

	c.tasksetStateMachine.Register(
		TaskSetValidation,
		TSAPending,
		TSACreationRequested,
		TSAPreparing,
		TSARunning,
		TSADeletionPending,
		TSADeletionRequested,
		TSACompleted,
		TSARetryPending,
		TaskSetCompleted,
	)

	c.tasksetStateMachine.OnStateChange(tasksetStateChangeHandler)

	c.tasksetStateMachine.OnUnexpectedSituation(tasksetUnexpectedHandler)

}

func tasksetStateChangeHandler(pre, next *typeStateMachine.State, reason string, args ...interface{}) error {

	controller, taskset, _, record := convertTaskSetStateMachineArgs(args...)

	if record.Status.Phase != next.GetName() {
		record.Status.Phase = next.GetName()
		record.Status.PhaseMessage = reason
		record.Status.TransitionTime = metav1.Now()
		record.Status.StateMessage = record.Status.PhaseMessage

		controller.recorder.Event(
			taskset,
			corev1.EventTypeNormal,
			"TaskSet State Transition",
			"Pre:"+pre.GetName()+",Next:"+next.GetName(),
		)

		controller.logger.Info(
			"TaskSet Phase Transition",
			zap.String("QueryKey", "TaskSetPhaseTransition"),
			zap.String("TaskSet", taskset.Name),
			zap.String("Namespace", taskset.Namespace),
			zap.String("PrePhase", pre.GetName()),
			zap.String("NextPhase", next.GetName()),
			zap.String("Reason", reason),
		)
	}

	//TaskSet is going to retry
	if pre.GetName() == TSARetryPending.GetName() && next.GetName() == TSAPending.GetName() {

		record.Status.TotalRetriedCount++

		record.Status.PhaseMessage = "TaskSet is going to retry"
		record.Status.StateMessage = "TaskSet is going to retry"
		record.Status.ControlUnitUID = nil
		record.Status.TaskRoleStatus = newTaskSetStatus(taskset).TaskRoleStatus

		controller.recorder.Event(
			taskset,
			corev1.EventTypeNormal,
			"Retry Taskset",
			fmt.Sprintf("Current Retried Count:%d", record.Status.TotalRetriedCount-1),
		)
	}

	updateTaskSetState(controller, taskset, record, pre, next, reason)

	return nil
}

func updateTaskSetState(controller *TaskSetController, taskset *typeTaskSet.TaskSet, record *TaskSetRecord, pre, next *typeStateMachine.State, reason string) {

	if record.Status.Phase == TSAPending.GetName() ||
		record.Status.Phase == TSACreationRequested.GetName() ||
		record.Status.Phase == TSAPreparing.GetName() {
		record.Status.State = WAITING
	}

	if record.Status.Phase == TSARunning.GetName() {

		if record.Status.State != RUNNING {
			controller.recorder.Event(taskset, corev1.EventTypeNormal, "TaskSet is running", "TaskSet:"+taskset.Name)
		}

		record.Status.State = RUNNING

		if nil == record.Status.StartAt {
			record.Status.StartAt = &metav1.Time{Time: time.Now()}
		}

	}

	if record.Status.Phase == TaskSetCompleted.GetName() && pre.GetName() == TaskSetValidation.GetName() {

		record.Status.FinishAt = &metav1.Time{Time: time.Now()}
		record.Status.State = FAILED
		record.Status.StateMessage = reason

		controller.recorder.Event(taskset, corev1.EventTypeNormal, "TaskSet Failed", "TaskSet:"+taskset.Name)
	}

	if record.Status.Phase == TaskSetCompleted.GetName() && pre.GetName() != TaskSetValidation.GetName() {

		record.Status.FinishAt = &metav1.Time{Time: time.Now()}

		_, succeeded, reason := shouldTaskSetCompleted(taskset, record)

		if reason != "" {
			record.Status.StateMessage = reason
		}

		if true == succeeded {
			if record.Status.State != SUCCEEDED {
				controller.recorder.Event(taskset, corev1.EventTypeNormal, "TaskSet  Succeeded", "TaskSet:"+taskset.Name)
			}
			record.Status.State = SUCCEEDED
		} else {
			if record.Status.State != FAILED {
				controller.recorder.Event(taskset, corev1.EventTypeNormal, "TaskSet Failed", "TaskSet:"+taskset.Name)
			}
			record.Status.State = FAILED
		}
	}

}

func tasksetUnexpectedHandler(args ...interface{}) error {

	controller, taskset, controlunit, record := convertTaskSetStateMachineArgs(args...)

	var json = jsoniter.ConfigCompatibleWithStandardLibrary

	line := "*******************TaskSet Unhandle Situation*******************\n"

	var logStr string = line

	if nil == controlunit {
		logStr += "controlunit is nil\n"
	} else {
		bytes, err := json.Marshal(controlunit.ObjectMeta)
		if nil == err {
			logStr += string(bytes) + "\n"
		}
	}

	logStr += line

	if nil == record {
		logStr += "record is nil\n"
	} else {

		bytes, err := json.Marshal(record.Status)

		if nil == err {
			logStr += string(bytes) + "\n"
		}
	}

	logStr += line

	controller.logger.Warn(logStr, zap.String("DebugKey", "UnhandleSitutation"))

	return errors.Errorf("TaskSet Unhandle Situation,TaskSet:%s", taskset.Name)
}
