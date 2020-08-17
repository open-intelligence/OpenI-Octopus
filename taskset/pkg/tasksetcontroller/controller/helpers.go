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
	libClientsets "scheduler/pkg/crd/generated/clientset/versioned"

	corev1 "k8s.io/api/core/v1"
	meta "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/rest"
	"k8s.io/client-go/tools/cache"
)

var configMapGroupVersionKind = corev1.SchemeGroupVersion.WithKind("ConfigMap")

func createClients(config *rest.Config) (*kubernetes.Clientset, *libClientsets.Clientset) {
	return kubernetes.NewForConfigOrDie(config), libClientsets.NewForConfigOrDie(config)
}

func createControlUnitKey(attemptID uint, taskSetName string) string {
	return fmt.Sprintf("c-%s-%d", taskSetName, attemptID)
}

func createPodKey(taskSetAttemptID, attemptID, index uint, roleName, taskSetName string) string {
	return fmt.Sprintf("%s-%s-%d-%d-%d", taskSetName, roleName, taskSetAttemptID, attemptID, index)
}

func newPod(key string, id uint, role *typeTaskSet.TaskRole, configMap *corev1.ConfigMap,
	taskset *typeTaskSet.TaskSet) *corev1.Pod {

	taskPod := role.Pod.DeepCopy()

	pod := &corev1.Pod{
		ObjectMeta: taskPod.ObjectMeta,
		Spec:       taskPod.Spec,
	}

	pod.Name = key
	pod.Namespace = taskset.Namespace

	if pod.OwnerReferences == nil {
		pod.OwnerReferences = []meta.OwnerReference{}
	}
	// The Owner of pod should be ConfigMap
	pod.OwnerReferences = append(pod.OwnerReferences, *meta.NewControllerRef(configMap, configMapGroupVersionKind))

	if pod.Annotations == nil {
		pod.Annotations = map[string]string{}
	}

	pod.Annotations[AnnotationKeyPodTaskRoleIndex] = fmt.Sprintf("%d", id)
	pod.Annotations[AnnotationResourceOwner] = taskset.Name
	pod.Annotations[AnnotationKeyNamespace] = taskset.Namespace
	pod.Annotations[AnnotationResourceOwnerUID] = fmt.Sprintf("%s", taskset.UID)
	pod.Annotations[AnnotationControlUnitUID] = fmt.Sprintf("%s", configMap.UID)

	if pod.Labels == nil {
		pod.Labels = map[string]string{}
	}
	//be used to find pod
	pod.Labels[LabelKeyOwner] = taskset.Name
	pod.Labels[LabelKeyPodTaskRole] = role.Name

	predefinedEnvs := []corev1.EnvVar{
		{Name: EnvNameNamespace, Value: taskset.Namespace},
		{Name: EnvNameTaskSetName, Value: taskset.Name},
		{Name: EnvNameTaskRoleName, Value: role.Name},
		{Name: EnvNameTaskRoleReplicaIndex, Value: fmt.Sprintf("%d", id)},
	}

	for i := range pod.Spec.Containers {
		pod.Spec.Containers[i].Env = append(predefinedEnvs, pod.Spec.Containers[i].Env...)
		if len(pod.Spec.Containers[i].TerminationMessagePolicy) == 0 {
			pod.Spec.Containers[i].TerminationMessagePolicy = corev1.TerminationMessageFallbackToLogsOnError
		}
	}

	for i := range pod.Spec.InitContainers {
		pod.Spec.InitContainers[i].Env = append(predefinedEnvs, pod.Spec.InitContainers[i].Env...)
		if len(pod.Spec.InitContainers[i].TerminationMessagePolicy) == 0 {
			pod.Spec.InitContainers[i].TerminationMessagePolicy = corev1.TerminationMessageFallbackToLogsOnError
		}
	}

	return pod
}

func newConfigMap(key string, taskset *typeTaskSet.TaskSet) *corev1.ConfigMap {

	configMap := &corev1.ConfigMap{}

	configMap.Name = key

	configMap.Namespace = taskset.Namespace

	if configMap.OwnerReferences == nil {
		configMap.OwnerReferences = []meta.OwnerReference{}
	}
	// The owner of ConfigMap should be TaskSet
	configMap.OwnerReferences = append(configMap.OwnerReferences, *meta.NewControllerRef(taskset,
		typeTaskSet.SchemeGroupVersionKind))

	if configMap.Annotations == nil {
		configMap.Annotations = map[string]string{}
	}

	configMap.Annotations[AnnotationResourceOwner] = taskset.Name
	configMap.Annotations[AnnotationKeyNamespace] = taskset.Namespace

	if configMap.Labels == nil {
		configMap.Labels = map[string]string{}
	}

	//be used to find configMap
	configMap.Labels[LabelKeyOwner] = taskset.Name

	return configMap
}

func deltaFIFOObjToPod(obj interface{}) (*corev1.Pod, string) {
	pod, ok := obj.(*corev1.Pod)

	if ok {
		return pod, ""
	}

	deletedFinalStateUnknown, ok := obj.(cache.DeletedFinalStateUnknown)

	if !ok {
		return nil, fmt.Sprintf("Failed to convert obj to Pod or DeletedFinalStateUnknown: %#v", obj)
	}

	pod, ok = deletedFinalStateUnknown.Obj.(*corev1.Pod)

	if !ok {
		return nil, fmt.Sprintf("Failed to convert DeletedFinalStateUnknown.Obj to Pod: %#v", deletedFinalStateUnknown)
	}

	return pod, ""
}

func deltaFIFOObjToConfigMap(obj interface{}) (*corev1.ConfigMap, string) {

	configMap, ok := obj.(*corev1.ConfigMap)

	if ok {
		return configMap, ""
	}

	deletedFinalStateUnknown, ok := obj.(cache.DeletedFinalStateUnknown)

	if !ok {
		return nil, fmt.Sprintf("Failed to convert obj to ConfigMap or DeletedFinalStateUnknown: %#v", obj)
	}

	configMap, ok = deletedFinalStateUnknown.Obj.(*corev1.ConfigMap)

	if !ok {
		return nil, fmt.Sprintf("Failed to convert DeletedFinalStateUnknown.Obj to ConfigMap: %#v", deletedFinalStateUnknown)
	}

	return configMap, ""
}

func deltaFIFOObjToTaskSet(obj interface{}) (*typeTaskSet.TaskSet, string) {

	taskset, ok := obj.(*typeTaskSet.TaskSet)

	if ok {
		return taskset, ""
	}

	deletedFinalStateUnknown, ok := obj.(cache.DeletedFinalStateUnknown)

	if !ok {
		return nil, fmt.Sprintf("Failed to convert obj to TaskSet or DeletedFinalStateUnknown: %#v", obj)
	}

	taskset, ok = deletedFinalStateUnknown.Obj.(*typeTaskSet.TaskSet)

	if !ok {

		return nil, fmt.Sprintf("Failed to convert DeletedFinalStateUnknown.Obj to TaskSet: %#v", deletedFinalStateUnknown)
	}

	return taskset, ""
}

func convertReplicaStateMachineArgs(args ...interface{}) (
	cc *TaskSetController,
	cts *typeTaskSet.TaskSet,
	ccu *corev1.ConfigMap,
	ctrr *typeTaskSet.ReplicaStatus,
	cpod *corev1.Pod,
	ctrrc *typeTaskSet.ReplicaStatus,
) {
	cc = args[0].(*TaskSetController)

	cts = args[1].(*typeTaskSet.TaskSet)

	ccu = args[2].(*corev1.ConfigMap)

	ctrr = args[3].(*typeTaskSet.ReplicaStatus)

	cpod = args[4].(*corev1.Pod)

	ctrrc = args[5].(*typeTaskSet.ReplicaStatus)

	return
}

func convertTaskSetStateMachineArgs(args ...interface{}) (
	cc *TaskSetController,

	cts *typeTaskSet.TaskSet,

	ccu *corev1.ConfigMap,

	crc *TaskSetRecord) {

	cc = args[0].(*TaskSetController)

	cts = args[1].(*typeTaskSet.TaskSet)

	ccu = args[2].(*corev1.ConfigMap)

	crc = args[3].(*TaskSetRecord)

	return
}

func convertTaskRoleStateMachineArgs(args ...interface{}) (
	cc *TaskSetController,

	cts *typeTaskSet.TaskSet,

	ccu *corev1.ConfigMap,

	crc *typeTaskSet.TaskRoleStatus) {

	cc = args[0].(*TaskSetController)

	cts = args[1].(*typeTaskSet.TaskSet)

	ccu = args[2].(*corev1.ConfigMap)

	crc = args[3].(*typeTaskSet.TaskRoleStatus)

	return
}

func newTaskSetStatus(taskset *typeTaskSet.TaskSet) *typeTaskSet.TaskSetStatus {

	status := &typeTaskSet.TaskSetStatus{
		Phase:             TaskSetValidation.GetName(),
		PhaseMessage:      "Initialize the taskset status",
		TransitionTime:    meta.Now(),
		State:             WAITING,
		StateMessage:      "Initialize the taskset status",
		ControlUnitUID:    nil,
		CreatedAt:         meta.Now(),
		StartAt:           nil,
		FinishAt:          nil,
		TotalRetriedCount: 0,
		PreemptCount:      0,
	}

	if nil == status.TaskRoleStatus {
		status.TaskRoleStatus = []typeTaskSet.TaskRoleStatus{}
	}

	for i := 0; i < len(taskset.Spec.Roles); i++ {

		role := taskset.Spec.Roles[i]

		roleStatus := typeTaskSet.TaskRoleStatus{
			Name:            role.Name,
			State:           WAITING,
			Phase:           TRPending.GetName(),
			PhaseMessage:    "TaskRole is waiting",
			TransitionTime:  meta.Now(),
			ReplicaStatuses: []typeTaskSet.ReplicaStatus{},
		}

		for k := uint(0); k < role.Replicas; k++ {

			replicaStatus := typeTaskSet.ReplicaStatus{
				Index:             k,
				Name:              role.Name,
				Phase:             TRRAPending.GetName(),
				PhaseMessage:      "TaskRole replica is pending",
				Stopped:           false,
				TransitionTime:    meta.Now(),
				TotalRetriedCount: 0,
				StartAt:           nil,
				FinishAt:          nil,
				PodName:           "",
				PodUID:            nil,
				PodIP:             "",
				PodHostIP:         "",
				ContainerName:     "",
				ContainerID:       "",
				TerminatedInfo:    nil,
			}

			roleStatus.ReplicaStatuses = append(roleStatus.ReplicaStatuses, replicaStatus)
		}

		status.TaskRoleStatus = append(status.TaskRoleStatus, roleStatus)
	}
	return status
}

func isAnyTaskRoleRunning(record *TaskSetRecord) bool {
	var running bool = false
	for i := 0; i < len(record.Status.TaskRoleStatus); i++ {
		if record.Status.TaskRoleStatus[i].Phase == TRRunning.GetName() {
			running = true
			break
		}
	}
	return running
}

func isTaskRoleNamingConflict(taskset *typeTaskSet.TaskSet) (bool, string) {
	names := map[string]bool{}

	for i := 0; i < len(taskset.Spec.Roles); i++ {
		if true == names[taskset.Spec.Roles[i].Name] {
			return true, taskset.Spec.Roles[i].Name
		}

		names[taskset.Spec.Roles[i].Name] = true
	}
	return false, ""
}

func isTaskSetCompletionPolicyIllegal(taskset *typeTaskSet.TaskSet) (bool, string) {

	for i := 0; i < len(taskset.Spec.Roles); i++ {
		replica := taskset.Spec.Roles[i].Replicas
		policy := &taskset.Spec.Roles[i].CompletionPolicy
		roleName := taskset.Spec.Roles[i].Name

		if policy.MaxFailed < 0 {
			return true, "MaxFailed cannot be smaller than zero for TaskRole:" + roleName
		}

		if policy.MinSucceeded < 1 {
			return true, "MinSucceeded cannot be smaller than 1 for TaskRole:" + roleName
		}

		if policy.MaxFailed > int32(replica) {
			return true, "MaxFailed cannot be bigger than replica amount for TaskRole:" + roleName
		}

		if policy.MinSucceeded > int32(replica) {
			return true, "MinSucceeded cannot be bigger than replica amount for TaskRole:" + roleName
		}

	}

	return false, "TaskSet completion policy  is legal"
}

func isPodSpecIllegal(taskset *typeTaskSet.TaskSet) (bool, string) {

	// for i:=0;i<len(taskset.Spec.Roles);i++{
	// 	role := &taskset.Spec.Roles[i]
	// 	errs := v1Validaton.ValidatePodSpec(&role.Pod, field.NewPath("spec"))...)
	// 	if len(errs) > 0{
	// 		return true,"Pod's Spec is invalid"
	// 	}
	// }

	return false, ""

}

func bindDefaultEventPolicy(taskset *typeTaskSet.TaskSet) {

	for i := 0; i < len(taskset.Spec.Roles); i++ {
		if nil == taskset.Spec.Roles[i].EventPolicies {
			taskset.Spec.Roles[i].EventPolicies = DefaultTaskRoleCompletedPolicies
		}
	}

}
