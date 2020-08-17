package kubernetes

import (
	"fmt"
	"math/rand"
	typeTaskSet "scheduler/pkg/crd/apis/taskset/v1alpha1"
	libController "scheduler/pkg/tasksetcontroller/controller"
	"time"

	"k8s.io/client-go/tools/cache"
)

func (k *kubeImp) Run(chan struct{}) {
	k.wg.Add(2)
	go k.runTick()
	go k.runLoop()
}

func (k *kubeImp) Shutdown() {
	k.cancel()
	k.wg.Wait()
}

func (k *kubeImp) AddEventHandler(handlers cache.ResourceEventHandler) {
	k.handlers = handlers
}

func (k *kubeImp) Create(ts *typeTaskSet.TaskSet) error {
	if nil == ts {
		return fmt.Errorf("No TaskSet Provided")
	}
	if "" == ts.Namespace {
		return fmt.Errorf("Namspace can't be empty")
	}
	k.job <- ts
	return nil
}

func (k *kubeImp) Get(namespace, jobID string) (*typeTaskSet.TaskSet, error) {
	k.mutex.Lock()
	defer k.mutex.Unlock()
	if nil == k.tasksets[namespace] {
		return nil, nil
	}
	t := k.tasksets[namespace][jobID]
	if nil == t {
		return nil, nil
	}
	if nil == t.taskset {
		return nil, nil
	}
	return t.taskset.DeepCopy(), nil
}

func (k *kubeImp) Delete(namespace, jobID string) error {
	k.mutex.Lock()
	defer k.mutex.Unlock()

	if nil == k.tasksets[namespace] {
		return nil
	}
	t := k.tasksets[namespace][jobID]

	var ts *typeTaskSet.TaskSet

	if nil != t && nil != t.taskset {
		ts = t.taskset
	}

	delete(k.tasksets[namespace], jobID)

	if nil != k.handlers && nil != ts {
		k.handlers.OnDelete(ts)
	}
	return nil
}

func (k *kubeImp) runTick() {
	c := time.Tick(10 * time.Millisecond)
	stopped := false
	for {
		if stopped {
			break
		}
		select {
		case <-c:
			{
				k.tick <- 0
			}
		case <-k.ctx.Done():
			{
				stopped = true
				break
			}
		}
	}
	k.wg.Done()

}
func (k *kubeImp) runLoop() {
	stopped := false
	for {
		if true == stopped {
			break
		}
		select {
		case ts := <-k.job:
			{
				k.processNewTaskSet(ts)
			}
		case <-k.tick:
			{
				k.processEvent()
			}
		case <-k.ctx.Done():
			{
				stopped = true
				break
			}
		}
	}

	k.wg.Done()
}

func (k *kubeImp) processNewTaskSet(ts *typeTaskSet.TaskSet) {

	ts.Status = newTaskSetStatus(ts)
	k.mutex.Lock()
	defer k.mutex.Unlock()
	t := &TS{
		tick:    rand.Intn(10),
		counted: 0,
		taskset: ts,
	}

	if nil == k.tasksets[ts.Namespace] {
		k.tasksets[ts.Namespace] = map[string]*TS{}
	}
	k.tasksets[ts.Namespace][ts.Name] = t

	if nil != k.handlers {
		k.handlers.OnAdd(ts)
	}
}

func (k *kubeImp) processEvent() {
	k.mutex.Lock()
	defer k.mutex.Unlock()
	for _, tss := range k.tasksets {
		if nil == tss {
			continue
		}
		for _, ts := range tss {
			if ts.taskset.Status.Phase == libController.TaskSetCompleted.GetName() {
				continue
			}
			ts.counted++
			if ts.counted >= ts.tick {
				oldObj := ts.taskset.DeepCopy()
				newObj := nextState(ts.taskset)
				if nil != k.handlers {
					k.handlers.OnUpdate(oldObj, newObj)
				}
				ts.counted = 0
			}
		}
	}
}
