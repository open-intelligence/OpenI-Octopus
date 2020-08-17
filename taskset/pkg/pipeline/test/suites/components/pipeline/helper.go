package pipeline

import (
	api "scheduler/pkg/pipeline/apis/common"
	apiModule "scheduler/pkg/pipeline/apis/module"
	"scheduler/pkg/pipeline/components/pipeline"
	libPipeline "scheduler/pkg/pipeline/components/pipeline"
	"scheduler/pkg/pipeline/phases"
	mockFeature "scheduler/pkg/pipeline/test/mock/feature"
	mockHttp "scheduler/pkg/pipeline/test/mock/http"
	"sync"
)

func createPipeline(handlers *pipeline.EventHandlerFuncs) *pipeline.Pipeline {
	factory := pipeline.NewPipeline(handlers, 2)
	factory.DeclarePhases(
		phases.NewTemplateTranslator(),
		phases.NewFactorGenerator(),
		phases.NewAccessGate(),
		phases.NewDecorator(),
		phases.NewSchedulerBinder(),
	)
	return factory
}

type phaseTestCtx struct {
	Pipeline       *pipeline.Pipeline
	wg             sync.WaitGroup
	services       []string
	remoteServices *mockHttp.RemoteService
}

const (
	PIPELINE_FAILED    = "failed"
	PIPELINE_SUCCEEDED = "succeeded"
	PIPELINE_STOPPED   = "stopped"
	PIPELINE_SUSPENDED = "suspended"
)

func newPhaseTestCtx(handlers *pipeline.EventHandlerFuncs, done chan string) *phaseTestCtx {
	defaultHandlers := &pipeline.EventHandlerFuncs{
		UnexpectFunc: func(work *pipeline.Workpiece) error {

			if nil != handlers && nil != handlers.UnexpectFunc {
				return handlers.UnexpectFunc(work)
			}

			go func() {
				done <- PIPELINE_FAILED
			}()
			return nil
		},
		DoneFunc: func(work *pipeline.Workpiece) error {

			if nil != handlers && nil != handlers.DoneFunc {
				return handlers.DoneFunc(work)
			}
			go func() {
				done <- PIPELINE_SUCCEEDED
			}()
			return nil
		},
		StopFunc: func(work *pipeline.Workpiece) error {

			if nil != handlers && nil != handlers.StopFunc {
				return handlers.StopFunc(work)
			}
			go func() {
				done <- PIPELINE_STOPPED
			}()
			return nil
		},
		SuspendFunc: func(work *pipeline.Workpiece) error {

			if nil != handlers && nil != handlers.SuspendFunc {
				return handlers.SuspendFunc(work)
			}
			go func() {
				done <- PIPELINE_SUSPENDED
			}()
			return nil
		},
	}
	factory := createPipeline(defaultHandlers)

	ctx := &phaseTestCtx{
		Pipeline:       factory,
		services:       make([]string, 0),
		remoteServices: mockHttp.Inject(),
	}

	ctx.wg.Add(1)

	go func() {
		ctx.Pipeline.Run()
		ctx.wg.Done()
	}()

	return ctx
}

func (p *phaseTestCtx) BindFeature(host string, feature *api.Feature, handlers *mockFeature.HandlerFuncs) error {

	imp := &mockFeature.FeatureImp{
		Host:    host,
		Feature: feature,
	}

	if nil != handlers {
		imp.HandlerFuncs = handlers
	}

	imp.BindEndpoints()

	err := p.Pipeline.UpsertFeature(feature)
	if nil != err {
		return err
	}
	err = p.Pipeline.EnableFeature(feature.Name)

	if nil != err {
		return err
	}

	p.remoteServices.AddService(imp.BuildHttpService())

	p.services = append(p.services, host)

	return err
}

func (p *phaseTestCtx) Clean() {
	for i := 0; i < len(p.services); i++ {
		p.remoteServices.RemoveService(p.services[i])
	}
	p.Pipeline.Shutdown()
	p.wg.Wait()
}

func (p *phaseTestCtx) SubmitOneJob(cursor *apiModule.JobCursor) error {
	if nil == cursor {
		cursor = &apiModule.JobCursor{
			UserID:     "test",
			JobID:      "123",
			Phase:      "",
			PluginDone: map[string]bool{},
			Job: `{
				"kind":"UserDefinedRuntime"
			}`,
			Header: `{
				"userID":"test",
				"jobName":"pluginSeq",
				"jobKind":"UserDefinedRuntime",
				"user":{
					"type":"test"
				}
			}`,
			Params:   "{}",
			Submited: false,
		}
	}

	workpiece, err := libPipeline.NewWorkpieceFromJobCursor(cursor)

	if nil != err {
		return err
	}

	p.Pipeline.AddWorkpiece(workpiece)
	return nil
}
