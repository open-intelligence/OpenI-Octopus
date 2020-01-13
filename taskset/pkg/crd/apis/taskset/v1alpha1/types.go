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

import (
	core "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/types"
)

//　Declarative programming is k8s' style

// +genclient
// +k8s:deepcopy-gen:interfaces=k8s.io/apimachinery/pkg/runtime.Object

// TaskSet is a collection of task role
type TaskSet struct {
	metav1.TypeMeta   `json:",inline"`                                                 // k8s standard   type meta
	metav1.ObjectMeta `json:"metadata,omitempty" protobuf:"bytes,1,opt,name=metadata"` // k8s standard object's meta data
	Spec              TaskSetSpec                                                      `json:"spec,omitempty" protobuf:"bytes,2,opt,name=spec"`     // config of the task set
	Status            *TaskSetStatus                                                   `json:"status,omitempty" protobuf:"bytes,3,opt,name=status"` // status of the task set
}

// TaskSetSpec is the config of a task set
type TaskSetSpec struct {
	RetryPolicy RetryPolicy `json:"retryPolicy"`
	Roles       []TaskRole  `json:"roles"`
}

// RetryPolicy declare if retry and how many times to try when failed
type RetryPolicy struct {
	Retry         bool `json:"retry"`
	Delay         uint `json:"delay"`
	MaxRetryCount uint `json:"maxRetryCount"`
}

// TaskRole is a kind of task ,such as PS worker
type TaskRole struct {
	Name             string               `json:"name"`
	Replicas         uint                 `json:"replicas"`
	CompletionPolicy CompletionPolicy     `json:"completionPolicy"`
	RetryPolicy      RetryPolicy          `json:"retryPolicy"`
	EventPolicies    []EventPolicy        `json:"eventPolicy"`
	Pod              core.PodTemplateSpec `json:"template"`
}

// CompletionPolicy declare the condition of completion
type CompletionPolicy struct {
	MaxFailed    int32 `json:"maxFailed"`
	MinSucceeded int32 `json:"minSucceeded"`
}

// EventPolicy is an event-action pair
type EventPolicy struct {
	Event  string `json:"event"`
	Action string `json:"action"`
}

// TaskSetStatus record the status of a TaskSet
type TaskSetStatus struct {
	Phase             string           `json:"phase"`
	PhaseMessage      string           `json:"phaseMessage"`
	TransitionTime    metav1.Time      `json:"transitionTime"`
	State             string           `json:"state"`        //任务的最终状态
	StateMessage      string           `json:"stateMessage"` //该state对应的message,对该state的一个附加说明
	ControlUnitUID    *types.UID       `json:"controlUnitUID"`
	CreatedAt         metav1.Time      `json:"createdAt"`         //任务创建时间
	StartAt           *metav1.Time     `json:"startAt"`           //任务开始时间
	FinishAt          *metav1.Time     `json:"finishAt"`          //任务结束时
	TotalRetriedCount uint             `json:"totalRetriedCount"` //总共重试的次数
	PreemptCount      uint             `json:"preemptCount"`      //在队列中排队时被抢占的次数，运行中的任务被抢占，要么整个任务失败，要么任务的一部分失败，并重试
	TaskRoleStatus    []TaskRoleStatus `json:"roleStatus"`
}

// TaskRoleStatus record the status of a task role
type TaskRoleStatus struct {
	Name            string          `json:"name"`
	Phase           string          `json:"phase"`
	PhaseMessage    string          `json:"phaseMessage"`
	TransitionTime  metav1.Time     `json:"transitionTime"`
	State           string          `json:"state"`
	ReplicaStatuses []ReplicaStatus `json:"replicaStatus"`
}

// ReplicaStatus record the  status of a replica
type ReplicaStatus struct {
	Index             uint                     `json:"index"`
	Name              string                   `json:"name"`
	Phase             string                   `json:"phase"`
	PhaseMessage      string                   `json:"phaseMessage"`
	Stopped           bool                     `json:"stopped"`
	TransitionTime    metav1.Time              `json:"transitionTime"`
	StartAt           *metav1.Time             `json:"startAt"`
	FinishAt          *metav1.Time             `json:"finishAt"`
	TotalRetriedCount uint                     `json:"totalRetriedCount"`
	PodName           string                   `json:"podName"`
	PodReason         string                   `json:"podReason"`
	PodUID            *types.UID               `json:"podUID"`
	PodIP             string                   `json:"podIP"`
	PodHostIP         string                   `json:"podHostIP"`
	ContainerName     string                   `json:"containerName"`
	ContainerID       string                   `json:"containerID"`
	TerminatedInfo    *ContainerTerminatedInfo `json:"terminatedInfo"`
}

//ContainerTerminatedInfo contains the terminated information
type ContainerTerminatedInfo struct {
	ExitCode    int32  `json:"exitCode"`
	ExitMessage string `json:"exitMessage"`
	Signal      int32  `json:"signal"`
	Reason      string `json:"reason"`
}

// +k8s:deepcopy-gen:interfaces=k8s.io/apimachinery/pkg/runtime.Object

// TaskSetList is a collection of task sets.
type TaskSetList struct {
	metav1.TypeMeta `json:",inline"` // k8s standard   type meta
	// Standard list metadata
	// More info: https://git.k8s.io/community/contributors/devel/api-conventions.md#metadata
	// +optional
	metav1.ListMeta `json:"metadata,omitempty" protobuf:"bytes,1,opt,name=metadata"`

	// items is the list of TaskSet
	Items []TaskSet `json:"items" protobuf:"bytes,2,rep,name=items"`
}
