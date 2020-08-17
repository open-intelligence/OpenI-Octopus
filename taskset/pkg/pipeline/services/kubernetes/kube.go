package kubernetes

import (
	typeTaskSet "scheduler/pkg/crd/apis/taskset/v1alpha1"
	libClientsets "scheduler/pkg/crd/generated/clientset/versioned"
	libInformer "scheduler/pkg/crd/generated/informers/externalversions"

	apiErrors "k8s.io/apimachinery/pkg/api/errors"
	meta "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/rest"
	"k8s.io/client-go/tools/cache"
)

func newkubeImp(config *rest.Config) *kubeImp {
	kube := &kubeImp{
		config: config,
		client: libClientsets.NewForConfigOrDie(config),
	}
	informerFactory := libInformer.NewSharedInformerFactory(kube.client, 0)

	taskSetInformer := informerFactory.Octopus().V1alpha1().TaskSets()

	kube.taskSetInformer = taskSetInformer

	kube.tasksetLister = taskSetInformer.Lister()

	return kube
}

func (k *kubeImp) Run(stopChan chan struct{}) {

	go k.taskSetInformer.Informer().Run(stopChan)

	synced := cache.WaitForCacheSync(stopChan, func() []cache.InformerSynced {
		informerSynced := []cache.InformerSynced{
			k.taskSetInformer.Informer().HasSynced,
		}

		return informerSynced
	}()...)

	if false == synced {
		panic("Failed to WaitForCacheSync")
	}
}

func (k *kubeImp) Shutdown() {

}

func (k *kubeImp) AddEventHandler(handlers cache.ResourceEventHandler) {
	k.taskSetInformer.Informer().AddEventHandler(handlers)
}

func (k *kubeImp) Create(ts *typeTaskSet.TaskSet) error {
	_, err := k.client.OctopusV1alpha1().TaskSets(ts.Namespace).Create(ts)
	return err
}

func (k *kubeImp) Get(namespace, jobID string) (*typeTaskSet.TaskSet, error) {
	ts, err := k.tasksetLister.TaskSets(namespace).Get(jobID)

	if err == nil && ts != nil {
		return ts, err
	}
	//try to get taskset from remote server
	ts, err = k.client.OctopusV1alpha1().TaskSets(namespace).Get(jobID, meta.GetOptions{})

	if apiErrors.IsNotFound(err) {
		return nil, nil
	}

	return ts, err
}

func (k *kubeImp) Delete(namespace, jobID string) error {
	err := k.client.OctopusV1alpha1().TaskSets(namespace).
		Delete(jobID, &meta.DeleteOptions{})

	if nil != err && apiErrors.IsNotFound(err) {
		return nil
	}

	return err
}
