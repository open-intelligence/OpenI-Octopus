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

package v1alpha1

import metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"

// Key returns the uniq id of this taskset
func (t *TaskSet) Key() string {
	return t.Namespace + "/" + t.Name
}

// TransitionPhase records the new Phase of this taskset
func (t *TaskSet) TransitionPhase(phase string, msg string) {
	t.Status.Phase = phase
	t.Status.PhaseMessage = msg
	t.Status.TransitionTime = metav1.Now()
}

//GetTaskRoleSpec returns the taskrole spec
func (t *TaskSet) GetTaskRoleSpec(rolename string) *TaskRole {
	var roleSpec *TaskRole
	for i := 0; i < len(t.Spec.Roles); i++ {
		if rolename == t.Spec.Roles[i].Name {
			roleSpec = &t.Spec.Roles[i]
			break
		}
	}
	return roleSpec
}

//GetTaskPhaseMessage returns the phase message
func (t *TaskSet) GetTaskPhaseMessage() *TaskMessage {
	taskMessage := &TaskMessage{}
	taskMessage.State = t.Status.State
	taskMessage.StateMessage = t.Status.StateMessage
	for i := 0; i < len(t.Status.TaskRoleStatus); i++ {
		var role = t.Status.TaskRoleStatus[i]
		roleMessage := RoleMessage{}
		roleMessage.Name = role.Name
		roleMessage.Phase = role.Phase
		roleMessage.PhaseMessage = role.PhaseMessage
		for j := 0; j < len(role.ReplicaStatuses); j++ {
			replicaMessage := ReplicaMessage{}
			var replica = role.ReplicaStatuses[j]
			replicaMessage.Name = replica.Name
			replicaMessage.Phase = replica.Phase
			replicaMessage.PhaseMessage  = replica.PhaseMessage
			roleMessage.Replicas = append(roleMessage.Replicas, replicaMessage)
		}
		taskMessage.Roles = append(taskMessage.Roles, roleMessage)
	}
	return taskMessage
}


//GetTaskRoleCompletionPolicy returns the completion policy of specific taskrole
func (t *TaskSet) GetTaskRoleCompletionPolicy(rolename string) *CompletionPolicy {
	spec := t.GetTaskRoleSpec(rolename)
	if nil == spec {
		return nil
	}

	return &spec.CompletionPolicy
}

//Equal returns true when the value is same
func (s *TaskSetStatus) Equal(status *TaskSetStatus) bool {
	if status == nil {
		return false
	}

	if status.Phase != s.Phase ||
		status.PhaseMessage != s.PhaseMessage ||
		status.State != s.State ||
		status.StateMessage != s.StateMessage ||
		status.PreemptCount != s.PreemptCount ||
		status.TotalRetriedCount != s.TotalRetriedCount {
		return false
	}

	if (status.ControlUnitUID == nil && s.ControlUnitUID != nil) ||
		(status.ControlUnitUID != nil && s.ControlUnitUID == nil) {
		return false
	}

	if nil != status.ControlUnitUID && *status.ControlUnitUID != *s.ControlUnitUID {
		return false
	}

	if (status.StartAt == nil && s.StartAt != nil) ||
		(status.StartAt != nil && s.StartAt == nil) {
		return false
	}

	if (status.FinishAt == nil && s.FinishAt != nil) ||
		(status.FinishAt != nil && s.FinishAt == nil) {
		return false
	}

	if (status.TaskRoleStatus == nil && s.TaskRoleStatus != nil) ||
		(status.TaskRoleStatus != nil && s.TaskRoleStatus == nil) {
		return false
	}

	if status.TaskRoleStatus == nil {
		return true
	}

	if len(status.TaskRoleStatus) != len(s.TaskRoleStatus) {
		return false
	}

	for i := 0; i < len(status.TaskRoleStatus); i++ {
		a := &status.TaskRoleStatus[i]
		var b *TaskRoleStatus = nil
		for j := 0; j < len(s.TaskRoleStatus); j++ {
			if a.Name == s.TaskRoleStatus[j].Name {
				b = &s.TaskRoleStatus[j]
				break
			}
		}

		if nil == b {
			return false
		}

		if !a.Equal(b) {
			return false
		}
	}

	return true
}

func (s *TaskRoleStatus) Equal(status *TaskRoleStatus) bool {
	if status == nil {
		return false
	}
	if status.Name != s.Name ||
		status.State != s.State ||
		status.Phase != s.Phase ||
		status.PhaseMessage != s.PhaseMessage {
		return false
	}

	if (status.ReplicaStatuses == nil && s.ReplicaStatuses != nil) ||
		(status.ReplicaStatuses != nil && s.ReplicaStatuses == nil) {
		return false
	}

	if status.ReplicaStatuses == nil {
		return true
	}

	if len(status.ReplicaStatuses) != len(s.ReplicaStatuses) {
		return false
	}

	for i := 0; i < len(status.ReplicaStatuses); i++ {
		a := &status.ReplicaStatuses[i]
		var b *ReplicaStatus = nil
		for j := 0; j < len(s.ReplicaStatuses); j++ {
			if a.Index == s.ReplicaStatuses[j].Index {
				b = &s.ReplicaStatuses[j]
				break
			}
		}

		if nil == b {
			return false
		}

		if !a.Equal(b) {
			return false
		}
	}
	return true
}

func (s *ReplicaStatus) Equal(status *ReplicaStatus) bool {
	if status == nil {
		return false
	}
	if status.Index != s.Index ||
		status.Name != s.Name ||
		status.Phase != s.Phase ||
		status.PhaseMessage != s.PhaseMessage ||
		status.PodName != s.PodName ||
		status.PodReason != s.PodReason ||
		status.PodIP != s.PodIP ||
		status.PodHostIP != s.PodHostIP ||
		status.ContainerName != s.ContainerName ||
		status.ContainerID != s.ContainerID ||
		status.Stopped != s.Stopped ||
		status.TotalRetriedCount != s.TotalRetriedCount {
		return false
	}

	if (status.StartAt == nil && s.StartAt != nil) ||
		(status.StartAt != nil && s.StartAt == nil) {
		return false
	}

	if (status.FinishAt == nil && s.FinishAt != nil) ||
		(status.FinishAt != nil && s.FinishAt == nil) {
		return false
	}

	if (status.PodUID == nil && s.PodUID != nil) ||
		(status.PodUID != nil && s.PodUID == nil) {
		return false
	}

	if nil != status.PodUID && *status.PodUID != *s.PodUID {
		return false
	}

	if (status.TerminatedInfo == nil && s.TerminatedInfo != nil) ||
		(status.TerminatedInfo != nil && s.TerminatedInfo == nil) {
		return false
	}

	if nil != status.TerminatedInfo {
		if status.TerminatedInfo.ExitCode != s.TerminatedInfo.ExitCode ||
			status.TerminatedInfo.ExitMessage != s.TerminatedInfo.ExitMessage ||
			status.TerminatedInfo.Signal != s.TerminatedInfo.Signal ||
			status.TerminatedInfo.Reason != s.TerminatedInfo.Reason {
			return false
		}
	}

	return true
}
