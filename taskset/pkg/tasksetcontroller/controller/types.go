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
	libClientsets "scheduler/pkg/crd/generated/clientset/versioned"
	typeTaskSetInformer "scheduler/pkg/crd/generated/informers/externalversions/taskset/v1alpha1"
	typeTaskSetLister "scheduler/pkg/crd/generated/listers/taskset/v1alpha1"
	cConfig "scheduler/pkg/tasksetcontroller/config"
	"sync"

	"go.uber.org/zap"
	infov1 "k8s.io/client-go/informers/core/v1"
	"k8s.io/client-go/kubernetes"
	listerv1 "k8s.io/client-go/listers/core/v1"
	"k8s.io/client-go/rest"
	"k8s.io/client-go/tools/record"
	"k8s.io/client-go/util/workqueue"
)

// TaskSetController is the controller of CRD TaskSet
type TaskSetController struct {
	CRDKind          string
	controllerConfig *cConfig.Config
	k8sConfig        *rest.Config

	k8sClient   *kubernetes.Clientset
	innerClient *libClientsets.Clientset

	podInformer       infov1.PodInformer
	configMapInformer infov1.ConfigMapInformer
	taskSetInformer   typeTaskSetInformer.TaskSetInformer

	podLister       listerv1.PodLister
	configMapLister listerv1.ConfigMapLister
	tasksetLister   typeTaskSetLister.TaskSetLister

	tQueue         workqueue.RateLimitingInterface
	recorder       record.EventRecorder
	logger         *zap.Logger
	taskSetRecords *sync.Map

	tasksetStateMachine  *typeStateMachine.StateMachine
	taskroleStateMachine *typeStateMachine.StateMachine
	replicaStateMachine  *typeStateMachine.StateMachine
}

// TaskSetRecord is used to record the status of TaskSet
type TaskSetRecord struct {
	Status *typeTaskSet.TaskSetStatus
}

func (t *TaskSetRecord) DeepCopy() *TaskSetRecord {
	r := &TaskSetRecord{}
	if nil != t.Status {
		r.Status = t.Status.DeepCopy()
	}
	return r
}

const (
	// AnnotationKeyPodTaskRoleIndex is the index of TaskRole's replicas
	AnnotationKeyPodTaskRoleIndex = "RoleReplicaIndex"
	// AnnotationKeyNamespace declare which k8s namespace that the pod is running
	AnnotationKeyNamespace = "Namespace"
	// AnnotationResourceOwner declare which TaskSet that this pod belong to
	AnnotationResourceOwner = "TaskSet"

	//AnnotationResourceOwnerUID is the UID of taskset that the pod belong to
	AnnotationResourceOwnerUID = "TSUID"

	//AnnotationControlUnitUID the UID that the pod belong to
	AnnotationControlUnitUID = "CID"

	// LabelKeyOwner declare which TaskSet that this pod belong to
	LabelKeyOwner = "TaskSet"
	// LabelKeyPodTaskRole declare which TaskRole that this pod belong to
	LabelKeyPodTaskRole = "PodTaskRole"

	//EnvNameNamespace define which namespace the taskset is running
	EnvNameNamespace = "TASKSET_NAMESPACE"
	// EnvNameTaskSetName define the key of TaskSet name which will be injected in  the pod
	EnvNameTaskSetName = "TASKSET_NAME"
	// EnvNameTaskRoleName define the key of TaskRole name which will be injected in the pod
	EnvNameTaskRoleName = "TASKROLE_NAME"
	// EnvNameTaskRoleReplicaIndex define the key of TaskRole replica index
	EnvNameTaskRoleReplicaIndex = "TASKROLE_REPLICA_INDEX"
)

//The human states of the TaskSet
const (
	//WAITING means the phase of the taskset is TSAPending or TSAPreparing
	WAITING string = "Waiting"
	//RUNNING means the phase of the taskset is TSARunning
	RUNNING string = "Running"
	//FAILED means the phase of the taskset is TaskSetCompleted and the exitcode is not zero
	FAILED string = "Failed"
	//SUCCEEDED means the phase of the taskset is TaskSetCompleted and the exitcode is zero
	SUCCEEDED string = "Succeeded"
)

const (
	//EventRoleFailed means the taskrole is failed
	EventRoleFailed string = "RoleFailed"
	//EventRoleSucceeded means the taskrole is succeeded
	EventRoleSucceeded string = "RoleSucceeded"
	//EventRoleCompleted means the taskrole is completed
	EventRoleCompleted string = "RoleCompleted"
)

const (
	//ActionTaskSetFailed means the taskset should be marked as failed
	ActionTaskSetFailed string = "TaskSetFailed"
	//ActionTaskSetSucceeded means the taskset should be marked as succeeded
	ActionTaskSetSucceeded string = "TaskSetSucceeded"

	//ActionTaskSetCompleted means the taskset should be marked as completed
	ActionTaskSetCompleted string = "TaskSetCompleted"
	//ActionNoAction means no action
	ActionNoAction string = "NoAction"
)

//DefaultTaskRoleCompletionPolicies define the default role completion event policy
var DefaultTaskRoleCompletionPolicies = []typeTaskSet.EventPolicy{
	typeTaskSet.EventPolicy{
		Event:  EventRoleFailed,
		Action: ActionTaskSetFailed,
	},
	typeTaskSet.EventPolicy{
		Event:  EventRoleSucceeded,
		Action: ActionNoAction,
	},
}
