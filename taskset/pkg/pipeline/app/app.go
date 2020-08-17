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

package app

import (
	api "scheduler/pkg/pipeline/apis/module"
	libPipeline "scheduler/pkg/pipeline/components/pipeline"
	"scheduler/pkg/pipeline/config"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
	"k8s.io/apimachinery/pkg/util/runtime"
)

//New : creates an app instance
func New(config *config.Config, serviceBinder ServiceBinder, routerBinder RouterBinder) *App {
	var (
		logger *zap.Logger
		err error
	)

	if config.Server.DebugMode == true {
		logger, err = zap.NewDevelopment()
	} else {
		logger, err = zap.NewProduction()
	}

	if err != nil {
		panic(err)
	}

	app := &App{
		config: config,
		logger: logger,
	}

	app.pipeline = libPipeline.NewPipeline(
		&libPipeline.EventHandlerFuncs{
			DoneFunc:         app.onPrepareDoneInPipeline,
			StopFunc:         app.onStopInPipeline,
			SuspendFunc:      app.onSuspendInPipeline,
			UnexpectFunc:     app.onUnexpect,
			PluginCalledFunc: app.onPluginCalled,
		},
		config.Pipeline.WorkerAmount,
	)

	app.service = serviceBinder(app)

	app.router = routerBinder(app)

	return app
}

//Run : start the core
func (a *App) Run() {
	defer runtime.HandleCrash()

	err := a.Services().Storage().Run()

	if err != nil {
		panic(err)
	}

	a.loadPlugins()

	go a.Services().Kubernetes().Run()
	go a.Services().LifeHook().Run()
	go a.Pipeline().Run()

	a.Services().Kubernetes().AddEventListener("AppJobStateListener", func(event *api.JobEvent) {
		a.onJobStateChange(event)
	})

	a.loadJobs()
}

func (a *App) Shutdown() {
	a.Pipeline().Shutdown()
	a.Services().Kubernetes().Shutdown()
	a.Services().LifeHook().Shutdown()
	a.Services().Storage().Shutdown()
	a.Logger().Sync()
}

func (a *App) Config() *config.Config {
	return a.config
}

func (a *App) Logger() *zap.Logger {
	return a.logger
}

func (a *App) Services() *Service {
	return a.service
}

func (a *App) Pipeline() *libPipeline.Pipeline {
	return a.pipeline
}

func (a *App) Router() *gin.Engine {
	return a.router
}

