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

	"github.com/pkg/errors"
	"go.uber.org/zap"
	corev1 "k8s.io/api/core/v1"
	errorsUtil "k8s.io/apimachinery/pkg/util/errors"
)

func (c *TaskSetController) actCreatePod(taskset *typeTaskSet.TaskSet,
	controlunit *corev1.ConfigMap, record *typeTaskSet.ReplicaStatus) (*corev1.Pod, error) {

	var role *typeTaskSet.TaskRole = nil

	for i := 0; i < len(taskset.Spec.Roles); i++ {
		if taskset.Spec.Roles[i].Name == record.Name {
			role = &taskset.Spec.Roles[i]
			break
		}
	}

	if nil == role {
		c.logger.Warn(
			"Faild to create pod ,can not find config",
			zap.String("taskset", taskset.Name),
			zap.String("namespace", taskset.Namespace),
			zap.String("taskrole", record.Name),
			zap.Uint("index", record.Index),
		)

		return nil, errors.Errorf("Cannot find config for role:%s", record.Name)
	}

	key := createPodKey(
		taskset.Status.TotalRetriedCount,
		record.TotalRetriedCount,
		record.Index,
		role.Name,
		taskset.Name,
	)

	pod, err := c.createPod(key, record.Index, role, controlunit, taskset)

	if err != nil {
		c.logger.Error(
			"Faild to create pod ,error occured",
			zap.String("taskset", taskset.Name),
			zap.String("namespace", taskset.Namespace),
			zap.String("taskrole", record.Name),
			zap.Uint("index", record.Index),
			zap.Error(err),
		)
		return nil, err
	}

	return pod, err
}

func (c *TaskSetController) actDeletePod(taskset *typeTaskSet.TaskSet, pod *corev1.Pod, record *typeTaskSet.ReplicaStatus) error {

	err := c.deletePod(pod)

	if nil != err {
		c.logger.Error(
			"Failed to delete pod",
			zap.String("taskset", taskset.Name),
			zap.String("namespace", taskset.Namespace),
			zap.String("taskrole", record.Name),
			zap.Uint("index", record.Index),
			zap.Error(err),
		)
		return err
	}

	return err
}

func (c *TaskSetController) actSyncTaskRole(ts *typeTaskSet.TaskSet, controlunit *corev1.ConfigMap, record *TaskSetRecord) error {
	errs := []error{}

	for i := 0; i < len(record.Status.TaskRoleStatus); i++ {
		roleStatus := &record.Status.TaskRoleStatus[i]
		err := c.syncTaskRoleStatus(ts, controlunit, roleStatus)
		if err != nil {
			errs = append(errs, err)
		}
	}

	if 0 != len(errs) {
		return errorsUtil.NewAggregate(errs)
	}

	return nil
}

func (c *TaskSetController) actDeleteControlUnit(ts *typeTaskSet.TaskSet, configMap *corev1.ConfigMap, record *TaskSetRecord) error {

	err := c.deleteConfigMap(configMap)

	if err != nil {
		c.logger.Warn(
			"Failed to delete ConfigMap",
			zap.String("taskset", ts.Name),
			zap.String("namespace", ts.Namespace),
			zap.Error(err),
		)
	}

	return err
}

func (c *TaskSetController) actCreateControlUnit(ts *typeTaskSet.TaskSet, record *TaskSetRecord) (configMap *corev1.ConfigMap,
	rtErr error) {

	pKey := createControlUnitKey(record.Status.TotalRetriedCount, ts.Name)

	configMap, rtErr = c.createConfigMap(pKey, ts)

	if rtErr != nil {
		c.logger.Error(
			"Failed to create ConfigMap for TaskSet",
			zap.String("taskset", ts.Name),
			zap.String("namespace", ts.Namespace),
			zap.String("configmap", pKey),
			zap.Error(rtErr),
		)

		return nil, errors.Wrapf(rtErr, "Create ConfigMap Failed,ConfigMap Name:%s", pKey)
	}

	return configMap, rtErr
}
