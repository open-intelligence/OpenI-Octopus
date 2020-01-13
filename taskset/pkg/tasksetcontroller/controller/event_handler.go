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
// created by yyrdl on 2019/10/23

package controller

import (
	"fmt"
)

// Pod
func (c *TaskSetController) handlePodEvent(obj interface{}, event string) {
	pod, errMsg := deltaFIFOObjToPod(obj)

	if errMsg != "" {
		c.logger.Error(errMsg)
	}

	if nil == pod {
		return
	}

	if ts := c.getPodOwner(pod); ts != nil {

		c.enqueueTaskSet(ts, fmt.Sprintf("%s :%s", event, pod.Name))
	}
}

func (c *TaskSetController) onPodAdd(obj interface{}) {

	c.handlePodEvent(obj, "PodAdding")
}

func (c *TaskSetController) onPodUpdate(old, obj interface{}) {

	c.handlePodEvent(obj, "PodUpdation")
}

func (c *TaskSetController) onPodDelete(obj interface{}) {

	c.handlePodEvent(obj, "PodDeletion")
}

// controlunit -> ConfigMap

func (c *TaskSetController) handleConfigMapEvent(obj interface{}, event string) {

	configMap, errMsg := deltaFIFOObjToConfigMap(obj)

	if errMsg != "" {
		c.logger.Error(errMsg)
	}

	if nil == configMap {
		return
	}

	if ts := c.getConfigMapOwner(configMap); ts != nil {

		c.enqueueTaskSet(ts, fmt.Sprintf("%s :%s", event, configMap.Name))
	}
}

func (c *TaskSetController) onConfigMapAdd(obj interface{}) {

	c.handleConfigMapEvent(obj, "ConfigMapAdding")
}

func (c *TaskSetController) onConfigMapUpdate(old, obj interface{}) {

	c.handleConfigMapEvent(obj, "ConfigMapUpdation")
}

func (c *TaskSetController) onConfigMapDelete(obj interface{}) {

	c.handleConfigMapEvent(obj, "ConfigMapDeletion")
}

// TaskSet

func (c *TaskSetController) handleTaskSetEvent(obj interface{}, event string) {
	taskset, errMsg := deltaFIFOObjToTaskSet(obj)

	if errMsg != "" {
		c.logger.Error(errMsg)
	}

	if nil == taskset {
		return
	}

	c.enqueueTaskSet(taskset, fmt.Sprintf("%s :%s", event, taskset.Name))
}

func (c *TaskSetController) onTaskSetAdd(obj interface{}) {
	c.handleTaskSetEvent(obj, "TaskSetAdding")
}

func (c *TaskSetController) onTaskSetUpdate(old, obj interface{}) {
	c.handleTaskSetEvent(obj, "TaskSetUpdation")
}

func (c *TaskSetController) onTaskSetDelete(obj interface{}) {
	c.handleTaskSetEvent(obj, "TaskSetDeletion")
}
