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
	typeTaskset "scheduler/pkg/crd/apis/taskset/v1alpha1"
	"time"

	"github.com/pkg/errors"
	"go.uber.org/zap"
	corev1 "k8s.io/api/core/v1"
	apiErrors "k8s.io/apimachinery/pkg/api/errors"
	meta "k8s.io/apimachinery/pkg/apis/meta/v1"
)

func (c *TaskSetController) enqueueTaskSet(ts *typeTaskset.TaskSet, event string) {

	key := ts.Key()

	// Valid TaskSet Key
	c.tQueue.Add(key)

}

func (c *TaskSetController) getPodOwner(pod *corev1.Pod) *typeTaskset.TaskSet {

	controlunit := meta.GetControllerOf(pod)

	if controlunit == nil {
		return nil
	}

	controlunitUID := pod.Annotations[AnnotationControlUnitUID]

	if controlunitUID != fmt.Sprintf("%s", controlunit.UID) {
		return nil
	}

	taskSetName := pod.Annotations[AnnotationResourceOwner]

	namespace := pod.Annotations[AnnotationKeyNamespace]

	taskset, err := c.tasksetLister.TaskSets(namespace).Get(taskSetName)

	if err != nil {
		if !apiErrors.IsNotFound(err) {
			c.logger.Error(
				"PodOwner cannot be got from local cache",
				zap.String("pod", pod.Name),
				zap.String("namespace", pod.Namespace),
				zap.String("taskset", taskSetName),
				zap.Error(err),
			)

		}

		return nil
	}

	if nil == taskset {
		return nil
	}

	tasksetUID := pod.Annotations[AnnotationResourceOwnerUID]

	if tasksetUID != fmt.Sprintf("%s", taskset.UID) {
		return nil
	}

	return taskset

}

func (c *TaskSetController) getConfigMapOwner(configMap *corev1.ConfigMap) *typeTaskset.TaskSet {

	owner := meta.GetControllerOf(configMap)

	if owner == nil {
		return nil
	}

	taskSetName := configMap.Annotations[AnnotationResourceOwner]

	namespace := configMap.Annotations[AnnotationKeyNamespace]

	taskset, err := c.tasksetLister.TaskSets(namespace).Get(taskSetName)

	if err != nil {
		if !apiErrors.IsNotFound(err) {
			c.logger.Error(
				"PodOwner cannot be got from local cache",
				zap.String("configMap", configMap.Name),
				zap.String("namespace", configMap.Namespace),
				zap.String("taskset", taskSetName),
				zap.Error(err),
			)
		}
		return nil
	}

	if nil == taskset {
		return nil
	}

	if taskset.UID != owner.UID {
		return nil
	}

	return taskset

}

func (c *TaskSetController) createConfigMap(key string, taskset *typeTaskset.TaskSet) (*corev1.ConfigMap, error) {

	configMap := newConfigMap(key, taskset)

	rspConfigMap, err := c.k8sClient.CoreV1().ConfigMaps(taskset.Namespace).Create(configMap)

	if nil != err {
		return nil, errors.Wrapf(err, "Failed to create ConfigMap for TaskSet:%v", taskset.Name)
	}

	return rspConfigMap, nil
}

func (c *TaskSetController) deleteConfigMap(configMap *corev1.ConfigMap) error {

	err := c.k8sClient.CoreV1().ConfigMaps(configMap.Namespace).Delete(configMap.Name,
		&meta.DeleteOptions{Preconditions: &meta.Preconditions{UID: &configMap.UID}})

	if nil != err && !apiErrors.IsNotFound(err) {
		return errors.Wrapf(err, "Failed to delete ConfigMap:%v  in namespace:%v", configMap.Name, configMap.Namespace)
	}

	return err
}

func (c *TaskSetController) createPod(key string, id uint, role *typeTaskset.TaskRole,
	controlunit *corev1.ConfigMap, taskset *typeTaskset.TaskSet) (*corev1.Pod, error) {

	pod := newPod(key, id, role, controlunit, taskset)

	rspPod, err := c.k8sClient.CoreV1().Pods(pod.Namespace).Create(pod)

	if nil != err {
		return nil, errors.Wrapf(err, "Failed to create Pod for TaskRole:%v  of TaskSet: %v", role.Name, taskset.Name)
	}

	return rspPod, nil
}

func (c *TaskSetController) deletePod(pod *corev1.Pod) error {

	err := c.k8sClient.CoreV1().Pods(pod.Namespace).Delete(pod.Name,
		&meta.DeleteOptions{Preconditions: &meta.Preconditions{UID: &pod.UID}})

	if nil != err && !apiErrors.IsNotFound(err) {
		return errors.Wrapf(err, "Failed to delete Pod:%v in namespace:%v", pod.Name, pod.Namespace)
	}

	return err
}

func (c *TaskSetController) getExactPod(taskset *typeTaskSet.TaskSet,
	controlunit *corev1.ConfigMap, record *typeTaskSet.ReplicaStatus) (*corev1.Pod, error) {

	pod, err := c.podLister.Pods(taskset.Namespace).Get(record.PodName)

	if err != nil {
		if apiErrors.IsNotFound(err) {
			return nil, nil
		}
		return nil, errors.Wrapf(err, "Cannot find pod from local cache,podName:%s", record.PodName)
	}

	if record.PodUID == nil || *record.PodUID != pod.UID {

		if meta.IsControlledBy(pod, controlunit) {
			return nil, c.deletePod(pod)
		}

		return nil, errors.Errorf(
			"Pod naming conflicts with others,podname:%v,taskset:%v,role:%v,index:%v,namespace:%v",
			pod.Name,
			taskset.Name,
			record.Name,
			record.Index,
			taskset.Namespace,
		)
	}

	return pod, err
}

func (c *TaskSetController) updateRemoteTaskSetStatus(ts *typeTaskset.TaskSet, record *TaskSetRecord) error {

	maxTryTime := 3

	recordC := record.DeepCopy()

	var err error

	var cache, taskset *typeTaskset.TaskSet

	taskset = ts

	for i := 0; i < maxTryTime; i++ {

		if 0 != i {
			time.Sleep(time.Duration(10*i) * time.Second)
		}

		taskset.Status = recordC.Status

		_, err = c.innerClient.OctopusV1alpha1().TaskSets(taskset.Namespace).Update(taskset)

		if nil == err {
			break
		}

		if !apiErrors.IsConflict(err) {
			break
		}

		cache, err = c.tasksetLister.TaskSets(taskset.Namespace).Get(taskset.Name)

		if err != nil {

			if apiErrors.IsNotFound(err) {
				err = errors.Wrapf(
					err,
					"Update status failed,can't find TaskSet:%s from local cache,maybe deleted by others,error:%v",
					taskset.Name,
					err,
				)
				break
			}
			err = errors.Errorf(
				"Update status failed,error occured when try to find TaskSet:%s from local cache,error:%v",
				taskset.Name,
				err,
			)

			break
		}

		if cache.UID != taskset.UID {

			err = errors.Errorf(
				"Update status failed,TaskSet naming conflicts,TaskSet UID mismatch,current UID:%v ,Cache UID:%v",
				taskset.UID,
				cache.UID,
			)

			break
		}

		taskset = cache.DeepCopy()

	}

	return err

}

func (c *TaskSetController) getExactConfigMap(ts *typeTaskSet.TaskSet, record *TaskSetRecord) (*corev1.ConfigMap, error) {

	name := createControlUnitKey(record.Status.TotalRetriedCount, ts.Name)

	cm, err := c.configMapLister.ConfigMaps(ts.Namespace).Get(name)

	if nil != err && apiErrors.IsNotFound(err) {
		return nil, nil
	}

	if nil != err {
		return nil, errors.Wrapf(err, "Cannot get ConfigMap from local cache")
	}

	if record.Status.ControlUnitUID == nil || *record.Status.ControlUnitUID != cm.UID {

		if meta.IsControlledBy(cm, ts) {
			return nil, c.deleteConfigMap(cm)
		}

		return nil, errors.Errorf("ConfigMap naming conflicts with others")
	}

	return cm, err
}

func (c *TaskSetController) timeLeftForTotallySynced(transitionTime meta.Time) time.Duration {
	alreadyWait := time.Since(transitionTime.Time)

	maxWaitTime := time.Duration(*c.controllerConfig.CacheCreationTimeoutSec) * time.Second

	return maxWaitTime - alreadyWait
}

func (c *TaskSetController) waitCacheSynced(ts *typeTaskSet.TaskSet) {

	c.tQueue.AddAfter(ts.Key(), 10*time.Second)
}

func (c *TaskSetController) getTaskSetRecord(key string) (*TaskSetRecord, bool) {

	v, found := c.taskSetRecords.Load(key)

	if false == found {
		return nil, false
	}

	return v.(*TaskSetRecord), true
}

func (c *TaskSetController) initTaskSetRecord(ts *typeTaskSet.TaskSet) *TaskSetRecord {

	record := &TaskSetRecord{
		Status: newTaskSetStatus(ts),
	}

	c.taskSetRecords.Store(ts.Key(), record)

	return record
}

func (c *TaskSetController) updateTaskSetRecord(key string, record *TaskSetRecord) {
	c.taskSetRecords.Store(key, record)
}

func (c *TaskSetController) deleteTaskSetRecord(key string) {
	c.taskSetRecords.Delete(key)
}
