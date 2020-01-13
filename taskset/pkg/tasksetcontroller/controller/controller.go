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
	utils "scheduler/pkg/common/utils"
	"sync"

	typeTaskSet "scheduler/pkg/crd/apis/taskset/v1alpha1"
	"scheduler/pkg/crd/generated/clientset/versioned/scheme"
	libInformer "scheduler/pkg/crd/generated/informers/externalversions"
	cConfig "scheduler/pkg/tasksetcontroller/config"
	"time"

	"go.uber.org/zap"
	corev1 "k8s.io/api/core/v1"
	"k8s.io/apimachinery/pkg/util/runtime"
	"k8s.io/apimachinery/pkg/util/wait"
	"k8s.io/client-go/informers"
	typedcorev1 "k8s.io/client-go/kubernetes/typed/core/v1"
	"k8s.io/client-go/rest"
	"k8s.io/client-go/tools/cache"
	"k8s.io/client-go/tools/record"
	"k8s.io/client-go/util/workqueue"
)

// NewController is contructor of TaskSetController
func NewController(cConfig *cConfig.Config, kConfig *rest.Config) *TaskSetController {

	logger, err := zap.NewProduction()

	if err != nil {
		panic(err)
	}

	logger = logger.Named(*cConfig.ControllerName)

	logger.Info("Initializing...")

	k8sClient, innerClient := createClients(kConfig)

	listerInformerFactory := informers.NewSharedInformerFactory(k8sClient, 0)

	podInformer := listerInformerFactory.Core().V1().Pods()

	configMapInformer := listerInformerFactory.Core().V1().ConfigMaps()

	innerInformerFactory := libInformer.NewSharedInformerFactory(innerClient, 0)

	taskSetInformer := innerInformerFactory.Octopus().V1alpha1().TaskSets()

	tQueue := workqueue.NewRateLimitingQueue(workqueue.DefaultControllerRateLimiter())

	eventBroadcaster := record.NewBroadcaster()

	eventBroadcaster.StartRecordingToSink(&typedcorev1.EventSinkImpl{Interface: k8sClient.CoreV1().Events("")})

	recorder := eventBroadcaster.NewRecorder(scheme.Scheme, corev1.EventSource{Component: *cConfig.ControllerName})

	ct := &TaskSetController{
		CRDKind:          typeTaskSet.TaskSetKind,
		controllerConfig: cConfig,
		k8sConfig:        kConfig,
		k8sClient:        k8sClient,
		innerClient:      innerClient,

		podInformer:       podInformer,
		configMapInformer: configMapInformer,
		taskSetInformer:   taskSetInformer,

		podLister:       podInformer.Lister(),
		configMapLister: configMapInformer.Lister(),
		tasksetLister:   taskSetInformer.Lister(),

		tQueue:   tQueue,
		recorder: recorder,
		logger:   logger, //thread safe

		taskSetRecords: &sync.Map{},

		tasksetStateMachine:  typeStateMachine.NewStateMachine(),
		taskroleStateMachine: typeStateMachine.NewStateMachine(),
		replicaStateMachine:  typeStateMachine.NewStateMachine(),
	}

	ct.DeclareTaskSetStates()
	ct.DeclareTaskRoleStates()
	ct.DeclareReplicaStates()

	ct.podInformer.Informer().AddEventHandler(cache.FilteringResourceEventHandler{
		FilterFunc: func(obj interface{}) bool {
			switch obj.(type) {
			case *corev1.Pod:
				pod := obj.(*corev1.Pod)
				if pod.Annotations[AnnotationResourceOwner] != "" {
					return true
				}
				return false
			default:
				return false
			}
		},
		Handler: cache.ResourceEventHandlerFuncs{
			AddFunc:    ct.onPodAdd,
			UpdateFunc: ct.onPodUpdate,
			DeleteFunc: ct.onPodDelete,
		},
	})

	ct.configMapInformer.Informer().AddEventHandler(cache.FilteringResourceEventHandler{
		FilterFunc: func(obj interface{}) bool {
			switch obj.(type) {
			case *corev1.ConfigMap:
				configMap := obj.(*corev1.ConfigMap)
				if configMap.Annotations[AnnotationResourceOwner] != "" {
					return true
				}
				return false
			default:
				return false
			}
		},
		Handler: cache.ResourceEventHandlerFuncs{
			AddFunc:    ct.onConfigMapAdd,
			UpdateFunc: ct.onConfigMapUpdate,
			DeleteFunc: ct.onConfigMapDelete,
		},
	})

	ct.taskSetInformer.Informer().AddEventHandler(cache.ResourceEventHandlerFuncs{
		AddFunc:    ct.onTaskSetAdd,
		UpdateFunc: ct.onTaskSetUpdate,
		DeleteFunc: ct.onTaskSetDelete,
	})

	return ct

}

// RegisterCRD register the TaskSet CRD
func (c *TaskSetController) RegisterCRD() {

	c.logger.Info("Started to register CRD TaskSet...")

	err := utils.RegisterCRD(c.k8sConfig, typeTaskSet.BuildTaskSetCRD())

	if err != nil {
		c.logger.Error(
			"Failed to register CRD",
			zap.Error(err),
		)
		panic(err)
	}
	c.logger.Info("Succeeded to register CRD TaskSet!")
}

// Run is main entrance of TaskSetController
func (c *TaskSetController) Run(stopCh <-chan struct{}) {

	defer c.logger.Error("Controller is stopping")
	defer c.logger.Sync()
	defer runtime.HandleCrash()

	go c.podInformer.Informer().Run(stopCh)
	go c.configMapInformer.Informer().Run(stopCh)
	go c.taskSetInformer.Informer().Run(stopCh)

	synced := c.waitForCacheSync(stopCh)

	if false == synced {
		panic("Failed to WaitForCacheSync")
	}

	c.start(stopCh)

	<-stopCh
}

func (c *TaskSetController) waitForCacheSync(stopCh <-chan struct{}) bool {
	return cache.WaitForCacheSync(stopCh, func() []cache.InformerSynced {
		informerSynced := []cache.InformerSynced{
			c.podInformer.Informer().HasSynced,
			c.taskSetInformer.Informer().HasSynced,
			c.configMapInformer.Informer().HasSynced,
		}

		return informerSynced
	}()...)
}

// run worker
func (c *TaskSetController) start(stopCh <-chan struct{}) {

	for i := uint(0); i < *c.controllerConfig.WorkerAmount; i++ {
		id := i
		// start the worker until the stopCh is closed
		// if the worker is completed ,restart it after one second
		go wait.Until(func() { c.worker(id) }, time.Second, stopCh)
	}
}

func (c *TaskSetController) worker(id uint) {

	defer c.logger.Error("Stopping worker", zap.Uint("id", id))
	c.logger.Info("Worker is running", zap.Uint("id", id))

	for c.processNextWorkItem(id) {

	}
}

func (c *TaskSetController) processNextWorkItem(id uint) bool {

	key, shutdown := c.tQueue.Get()

	if shutdown {
		return false
	}

	defer c.tQueue.Done(key)

	err := c.syncTaskSet(key.(string))

	if nil == err {
		// done
		c.tQueue.Forget(key)
	} else {
		// retry later
		c.tQueue.AddRateLimited(key)
	}

	return true

}
