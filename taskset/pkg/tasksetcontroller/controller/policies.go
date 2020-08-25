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
	typeTaskSet "scheduler/pkg/crd/apis/taskset/v1alpha1"
)

//ShouldTaskSetCompletedByEventPolicy determines if the taskset should be completed by event policy
func shouldTaskSetCompletedByEventPolicy(policy *typeTaskSet.EventPolicy,
	rolestatus *typeTaskSet.TaskRoleStatus) (completed bool, success bool) {

	if (rolestatus.State == FAILED && policy.Event == EventRoleFailed) ||
		(rolestatus.State == SUCCEEDED && policy.Event == EventRoleSucceeded) ||
		((rolestatus.State == SUCCEEDED || rolestatus.State == FAILED) && policy.Event == EventRoleCompleted) {

		if policy.Action == ActionTaskSetFailed {
			return true, false
		}
		if policy.Action == ActionTaskSetSucceeded {
			return true, true
		}
		if policy.Action == ActionTaskSetCompleted {
			return true, false
		}

		if policy.Action == ActionNoAction {
			return false, false
		}
	}

	return false, false

}

func shouldTaskSetCompleted(taskset *typeTaskSet.TaskSet, record *TaskSetRecord) (should bool, succeeded bool, reason string) {

	should = false

	succeeded = false

	var completedCount int = 0
	var succeededCount int = 0

	for i := 0; i < len(record.Status.TaskRoleStatus); i++ {

		status := &record.Status.TaskRoleStatus[i]

		roleSpec := taskset.GetTaskRoleSpec(status.Name)

		if nil == roleSpec {
			continue
		}

		if status.Phase != TRCompleted.GetName() {
			continue
		}

		if status.State == SUCCEEDED {
			succeededCount++
		}

		completedCount++

		var eventPolicies []typeTaskSet.EventPolicy = roleSpec.EventPolicies

		if len(eventPolicies) == 0 {
			eventPolicies = DefaultTaskRoleCompletedPolicies
		} else {

			var completedEvent, failedEvent bool = false, false

			for k := 0; k < len(eventPolicies); k++ {
				policy := &eventPolicies[k]
				if policy.Event == EventRoleFailed {
					failedEvent = true
				}
				if policy.Event == EventRoleCompleted {
					completedEvent = true
				}
			}

			if false == completedEvent && failedEvent == false {
				eventPolicies = append(eventPolicies, typeTaskSet.EventPolicy{
					Event:  EventRoleFailed,
					Action: ActionTaskSetFailed,
				})
			}
		}

		for k := 0; k < len(eventPolicies); k++ {
			policy := &eventPolicies[k]
			should, succeeded = shouldTaskSetCompletedByEventPolicy(policy, status)
			if true == should {
				break
			}
		}

		if should == true {
			if true == succeeded {
				reason = fmt.Sprintf("TaskSet completed beacause taskrole(%s) is succeeded ", status.Name)
			} else {
				reason = fmt.Sprintf("TaskSet completed beacause taskrole(%s) is failed", status.Name)
			}

			break
		}
	}

	if false == should && completedCount == len(record.Status.TaskRoleStatus) {
		if succeededCount == len(record.Status.TaskRoleStatus) {
			return true, true, "TaskSet succeeded beacause all taskrole are succeeded"
		}

		return true, false, "TaskSet failed beacause all taskrole are completed,but some TaskRole are failed"
	}

	return
}

//IsTaskRoleCompleted determines if the taskrole is completed
func isTaskRoleCompleted(policy *typeTaskSet.CompletionPolicy, rolestatus *typeTaskSet.TaskRoleStatus) (
	completed bool,
	success bool,
	reason string,
) {

	if policy == nil {
		return true, false, "missing completion policy"
	}

	var (
		failed    int32 = 0
		succeeded int32 = 0
	)

	for i := 0; i < len(rolestatus.ReplicaStatuses); i++ {
		status := &rolestatus.ReplicaStatuses[i]
		if status.Phase == TaskRoleReplicaCompleted.GetName() {

			if nil != status.TerminatedInfo {

				if 0 == status.TerminatedInfo.ExitCode {
					succeeded++
				} else {
					failed++
				}

			} else {
				failed++
			}
		}
	}

	if policy.MinSucceeded <= succeeded {
		return true, true, fmt.Sprintf("Completion policy MinSucceeded satisfied,succeeded count:%d", succeeded)
	}

	if policy.MaxFailed <= failed {
		return true, false, fmt.Sprintf("Completion policy MaxFailed  satisfied,faild count:%d", failed)
	}

	return false, true, "Completion policy did not satisfy"
}

//ShouldRetry make a decision if it will be  retried
func shouldRetry(policy *typeTaskSet.RetryPolicy, totalRetriedCount uint) (bool, string) {

	if nil == policy {
		return false, "No retry policy is supplied"
	}

	if policy.Retry == false {
		return false, "Retry is forbidden"
	}

	if totalRetriedCount < policy.MaxRetryCount {
		return true, "Policy.Retry is true,and current retry time is smaller than MaxRetryCount"
	}

	return false, "Can't retry anymore"
}

func shouldRetryTaskSet(taskset *typeTaskSet.TaskSet, record *TaskSetRecord) (bool, string) {
	return shouldRetry(&taskset.Spec.RetryPolicy, record.Status.TotalRetriedCount)
}

func shoudRetryTaskRoleReplica(taskset *typeTaskSet.TaskSet, record *typeTaskSet.ReplicaStatus) (bool, string) {

	// already succeeded
	if nil != record.TerminatedInfo && 0 == record.TerminatedInfo.ExitCode {
		return false, "TaskRole replica is already succeeded"
	}

	var policy *typeTaskSet.RetryPolicy

	for i := 0; i < len(taskset.Spec.Roles); i++ {
		role := taskset.Spec.Roles[i]
		if role.Name == record.Name {
			policy = &role.RetryPolicy
			break
		}
	}

	return shouldRetry(policy, record.TotalRetriedCount)
}
