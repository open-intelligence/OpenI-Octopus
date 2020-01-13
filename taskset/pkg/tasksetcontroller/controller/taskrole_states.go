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

	jsoniter "github.com/json-iterator/go"
	"github.com/pkg/errors"
	"go.uber.org/zap"
	corev1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

var (
	//declare states of TaskRole
	//TR --> TaskRole

	//TRPending means TaskRole is not completed ,and the state
	//of all replica is TRRAPending、TRRACreationRequested or TRRAPreparing
	TRPending = typeStateMachine.NewState("TaskRoleWaiting")

	//TRRunning means TaskRole is not completed ,and the completion policy is not satisfied,
	//and there at least one replica is running
	TRRunning = typeStateMachine.NewState("TaskRoleRunning")

	//TRCleaningPending means TaskRole is not completed ,but completion policy is satisfied ,and
	// is going to clean the scene
	TRCleaningPending = typeStateMachine.NewState("TaskRoleCleaningPending")

	//TRCompleted means completion policy is satisfied,and the cleaning work is done
	TRCompleted = typeStateMachine.NewState("TaskRoleCompleted")
)

//DeclareTaskRoleStates declare the states of TaskRole
func (c *TaskSetController) DeclareTaskRoleStates() {

	TRPending.
		Condition(condTRPending).
		Action(actSyncReplicaStatus).
		When(condWhenTaskRoleCompleted).To(TRCleaningPending, "TaskRole is completed").GoRun().
		When(condWhenAnyReplicaRunning).To(TRRunning, "Some replica are running")

	TRRunning.
		Condition(condTRRunning).
		Action(actSyncReplicaStatus).
		When(condWhenTaskRoleCompleted).To(TRCleaningPending, "TaskRole is completed").GoRun()

	TRCleaningPending.
		Condition(condTRCleaningPending).
		Action(actStopReplicas).
		When(condWhenAllReplicaCompleted).To(TRCompleted, "All replicas are completed")

	TRCompleted.
		Condition(condTRCompleted)

	c.taskroleStateMachine.Register(
		TRPending,
		TRRunning,
		TRCleaningPending,
		TRCompleted,
	)

	c.taskroleStateMachine.OnStateChange(taskroleStateChangeHandler)

	c.taskroleStateMachine.OnUnexpectedSituation(taskroleUnexpectedHandler)

}

func taskroleStateChangeHandler(pre, next *typeStateMachine.State, reason string, args ...interface{}) error {

	controller, taskset, _, record := convertTaskRoleStateMachineArgs(args...)

	if record.Phase != next.GetName() {
		record.Phase = next.GetName()
		record.PhaseMessage = reason
		record.TransitionTime = metav1.Now()

		controller.logger.Info("",
			zap.String("QueryKey", "TaskRoleTransition"),
			zap.String("TaskSet", taskset.Name),
			zap.String("Namespace", taskset.Namespace),
			zap.String("Role", record.Name),
			zap.String("PrePhase", pre.GetName()),
			zap.String("NextPhase", next.GetName()),
			zap.String("Reason", reason),
		)
	}

	if pre.GetName() != next.GetName() && next.GetName() == TRCompleted.GetName() {

		policy := taskset.GetTaskRoleCompletionPolicy(record.Name)

		completed, succeeded, reason := isTaskRoleCompleted(policy, record)

		msg := "TaskRole:" + record.Name + ", Reason:" + reason

		if completed == true && true == succeeded {
			if record.State != SUCCEEDED {
				controller.recorder.Event(taskset, corev1.EventTypeNormal, "TaskRole Succeeded", msg)
			}

			record.State = SUCCEEDED
		}

		if completed == true && false == succeeded {
			if record.State != FAILED {
				controller.recorder.Event(taskset, corev1.EventTypeNormal, "TaskRole Failed", msg)
			}

			record.State = FAILED
		}
	}

	if next.GetName() != pre.GetName() && next.GetName() == TRPending.GetName() {
		if record.State != WAITING {
			controller.recorder.Event(taskset, corev1.EventTypeNormal, "TaskRole is waiting", "TaskRole:"+record.Name)
		}
		record.State = WAITING
	}

	if next.GetName() != pre.GetName() && next.GetName() == TRRunning.GetName() {
		if record.State != RUNNING {
			controller.recorder.Event(taskset, corev1.EventTypeNormal, "TaskRole is running", "TaskRole:"+record.Name)
		}
		record.State = RUNNING
	}

	return nil
}

func taskroleUnexpectedHandler(args ...interface{}) error {
	controller, _, _, record := convertTaskRoleStateMachineArgs(args...)

	var json = jsoniter.ConfigCompatibleWithStandardLibrary

	line := "*******************TaskRole Unhandle Situation*******************\n"

	var logStr string = line

	if nil == record {
		logStr += "record is nil\n"
	} else {
		bytes, err := json.Marshal(record)
		if nil == err {
			logStr += string(bytes) + "\n"
		}
	}

	logStr += line

	controller.logger.Warn(logStr, zap.String("DebugKey", "UnhandleSitutation"))

	return errors.Errorf("TaskRole Unhandle Situation,TaskRole:%s", record.Name)
}
