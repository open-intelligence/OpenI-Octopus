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
	typeTaskSet "scheduler/pkg/crd/apis/taskset/v1alpha1"

	libError "github.com/pkg/errors"
	"go.uber.org/zap"
	corev1 "k8s.io/api/core/v1"
	apiErrors "k8s.io/apimachinery/pkg/api/errors"
	"k8s.io/client-go/tools/cache"
)

func (c *TaskSetController) syncTaskSet(key string) (rtError error) {

	defer func() {

		if rtError != nil {
			c.logger.Error(
				"Failed to syncTaskSet",
				zap.String("key", key),
				zap.Error(rtError),
			)
			return
		}

	}()

	namespace, name, err := cache.SplitMetaNamespaceKey(key)

	if err != nil {
		rtError = err
		return
	}

	localTS, err := c.tasksetLister.TaskSets(namespace).Get(name)

	if err != nil && apiErrors.IsNotFound(err) {

		c.logger.Info(
			"Can't find the taskset ,maybe it has already been deleted",
			zap.String("taskset", name),
			zap.String("namespace", namespace),
		)

		c.deleteTaskSetRecord(key)

		rtError = nil

		return nil
	}

	if err != nil {

		c.logger.Info(
			"TaskSet cannot be found in local cache",
			zap.String("taskset", name),
			zap.String("namespace", namespace),
			zap.Error(err),
		)

		rtError = libError.Wrapf(err, "Failed to find taskset from lister")

		return nil
	}

	ts := localTS.DeepCopy()

	return c.syncTaskSetStatus(ts)

}

func (c *TaskSetController) syncTaskSetStatus(ts *typeTaskSet.TaskSet) error {

	record, found := c.getTaskSetRecord(ts.Key())

	// the  record maybe lost ,recover it from the most latest cache
	// this case only happened when tasksetcontroller restarts
	// and the cache has already been synced before the worker is running.
	// there will be only one Add event for each old object created by the controller.
	// And the Taskset we get from the cache is just the latest one
	if false == found && nil != ts.Status {

		record = &TaskSetRecord{
			Status: ts.Status.DeepCopy(),
		}

		found = true

		c.updateTaskSetRecord(ts.Key(), record)
	}

	// this is the first time we see this taskset
	if false == found && nil == ts.Status {
		ts.Status = newTaskSetStatus(ts)
		record = c.initTaskSetRecord(ts)
	}

	// The taskset record is found ,but the status is nil,which means some actions for this taskset
	// have already been made ,but the status has not been synced at local
	if found == true && nil == ts.Status {
		ts.Status = record.Status.DeepCopy()
	}

	// unexpected situation
	if nil == record || nil == ts.Status {

		c.logger.Warn(
			"Unexpected situation ,missing 'phase' or taskset.Status",
			zap.String("taskset", ts.Name),
			zap.String("namespace", ts.Namespace),
		)
		return nil
	}

	recordC := record.DeepCopy()

	controlUnit, err := c.getExactConfigMap(ts, recordC)

	if nil != err {
		return err
	}

	err = c.tasksetStateMachine.Run(c, ts, controlUnit, recordC)

	if err != nil {
		return err
	}

	if recordC.Status.Equal(ts.Status) {
		// no need to update taskset status
		return nil
	}

	err = c.updateRemoteTaskSetStatus(ts, recordC)

	if err == nil {
		c.updateTaskSetRecord(ts.Key(), recordC)
	}

	return err
}

func (c *TaskSetController) syncTaskRoleStatus(taskset *typeTaskSet.TaskSet, controlunit *corev1.ConfigMap,
	record *typeTaskSet.TaskRoleStatus) error {
	return c.taskroleStateMachine.Run(c, taskset, controlunit, record)
}

func (c *TaskSetController) syncTaskRoleReplicaStatus(taskset *typeTaskSet.TaskSet, controlunit *corev1.ConfigMap,
	record *typeTaskSet.ReplicaStatus) error {

	pod, err := c.getExactPod(taskset, controlunit, record)

	if err != nil {
		return err
	}

	var replicaStatusInCache *typeTaskSet.ReplicaStatus = nil

	for i := 0; i < len(taskset.Status.TaskRoleStatus); i++ {

		role := taskset.Status.TaskRoleStatus[i]

		if role.Name != record.Name {
			continue
		}

		for k := 0; k < len(role.ReplicaStatuses); k++ {
			temp := role.ReplicaStatuses[k]
			if temp.Index == record.Index {
				replicaStatusInCache = &temp
				break
			}
		}

		break
	}

	if nil == replicaStatusInCache {
		err = libError.Errorf(
			"Can not find replica status in cache, taskset:%v,taskrole:%v,index:%v,namespace:%v",
			taskset.Name,
			record.Name,
			record.Index,
			taskset.Namespace,
		)
	}

	if nil == err {
		err = c.replicaStateMachine.Run(c, taskset, controlunit, replicaStatusInCache, pod, record)
	}

	if nil != err {
		c.logger.Error(
			"Error occured when sync taskrole replica status",
			zap.String("taskset", taskset.Name),
			zap.String("namespace", taskset.Namespace),
			zap.String("taskrole", record.Name),
			zap.Uint("index", record.Index),
			zap.Error(err),
		)
	}

	return err
}
