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

package kubernetes

import (
	"context"
	typeTaskSet "scheduler/pkg/crd/apis/taskset/v1alpha1"
	libClientsets "scheduler/pkg/crd/generated/clientset/versioned"
	typeTaskSetInformer "scheduler/pkg/crd/generated/informers/externalversions/taskset/v1alpha1"
	typeTaskSetLister "scheduler/pkg/crd/generated/listers/taskset/v1alpha1"
	api "scheduler/pkg/pipeline/apis/module"
	"scheduler/pkg/pipeline/app"
	"sync"

	"k8s.io/client-go/tools/cache"

	"scheduler/pkg/common/list"

	"go.uber.org/zap"
	"k8s.io/client-go/rest"
)

type KubeInterface interface {
	Run(chan struct{})
	Shutdown()
	Create(*typeTaskSet.TaskSet) error
	Get(namespace, jobID string) (*typeTaskSet.TaskSet, error)
	Delete(namespace, jobID string) error
	AddEventHandler(cache.ResourceEventHandler)
}

type eventBox struct {
	name      string
	workerNum int
	box       *list.List
	handler   api.KubeEventListener
	ctx       context.Context
	cancel    context.CancelFunc
	event     chan *api.JobEvent
	dispatch  chan *api.JobEvent
	ack       chan int
	wg        sync.WaitGroup
}

type Service struct {
	config    *rest.Config
	app       *app.App
	mutex     sync.RWMutex
	kube      KubeInterface
	mailboxes map[string]*eventBox
	stopChan  chan struct{}
	logger    *zap.Logger
}

type kubeImp struct {
	config          *rest.Config
	client          *libClientsets.Clientset
	taskSetInformer typeTaskSetInformer.TaskSetInformer
	tasksetLister   typeTaskSetLister.TaskSetLister
}
