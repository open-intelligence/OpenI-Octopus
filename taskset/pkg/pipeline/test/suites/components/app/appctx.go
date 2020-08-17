package app

import (
	api "scheduler/pkg/pipeline/apis/common"
	libApp "scheduler/pkg/pipeline/app"
	"scheduler/pkg/pipeline/test/common"
	mockFeature "scheduler/pkg/pipeline/test/mock/feature"
	mockHttp "scheduler/pkg/pipeline/test/mock/http"
	"sync"
	"time"
)

type appTestCtx struct {
	App            *libApp.App
	services       []string
	remoteServices *mockHttp.RemoteService
}

func newAppTestCtx() *appTestCtx {

	ctx := &appTestCtx{
		App:            createApp(),
		services:       make([]string, 0),
		remoteServices: mockHttp.Inject(),
	}

	return ctx
}

func (a *appTestCtx) Run() error {
	a.App.Run()
	return common.CreateDefaultAdminToken(a.App)
}

func (a *appTestCtx) BindFeature(host string, feature *api.Feature, handlers *mockFeature.HandlerFuncs) error {

	imp := &mockFeature.FeatureImp{
		Host:    host,
		Feature: feature,
	}

	if nil != handlers {
		imp.HandlerFuncs = handlers
	}

	imp.BindEndpoints()

	err := a.App.Services().Core().UpsertFeature(feature)

	if nil != err {
		return err
	}

	isSucceeded, err := a.App.Services().Core().EnableFeature(feature.Name)

	if nil != err || !isSucceeded {
		return err
	}

	a.remoteServices.AddService(imp.BuildHttpService())

	a.services = append(a.services, host)

	return err
}

func (a *appTestCtx) Clean() {
	for i := 0; i < len(a.services); i++ {
		a.remoteServices.RemoveService(a.services[i])
	}

	a.App.Shutdown()
}

type jobCounter struct {
	Total   int
	cache   map[string]bool
	counted int
	done    chan string
	mutex   sync.Mutex
}

func newJobCounter(total int, timeoutSec int) *jobCounter {
	job := &jobCounter{
		Total:   total,
		cache:   make(map[string]bool, total),
		counted: 0,
		done:    make(chan string),
	}

	go func() {
		time.Sleep(time.Duration(timeoutSec) * time.Second)
		job.mutex.Lock()
		if job.counted < job.Total {
			job.done <- "timeout"
		}
		job.mutex.Unlock()
	}()

	return job
}

func (j *jobCounter) ReportJob(jobID string) {
	j.mutex.Lock()
	defer j.mutex.Unlock()

	if false == j.cache[jobID] {
		j.cache[jobID] = true
		j.counted++
	}

	if j.counted >= j.Total {
		j.done <- "success"
	}
}

func (j *jobCounter) Done() chan string {
	return j.done
}
