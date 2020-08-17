package core

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

import (
	libApp "scheduler/pkg/pipeline/app"
	"scheduler/pkg/pipeline/config"
	"scheduler/pkg/pipeline/phases"
	"scheduler/pkg/pipeline/router"
	coreService "scheduler/pkg/pipeline/services/core"
	featureService "scheduler/pkg/pipeline/services/feature"
	jobService "scheduler/pkg/pipeline/services/job"
	k8sService "scheduler/pkg/pipeline/services/kubernetes"
	lifeHookService "scheduler/pkg/pipeline/services/lifehook"
	storageService "scheduler/pkg/pipeline/services/storage"
	tokenService "scheduler/pkg/pipeline/services/token"

	"github.com/gin-gonic/gin"
)

func serviceBinder(app *libApp.App) *libApp.Service {
	return &libApp.Service{
		JobService:        jobService.New(app),
		CoreService:       coreService.New(app),
		KubernetesService: k8sService.New(app, app.Config().Kubernetes),
		StorageService:    storageService.New(app.Config().Mysql),
		LifeHookService:   lifeHookService.New(app, app.Config().LifeHook),
		FeatureService:    featureService.New(app),
		TokenService:      tokenService.New(app),
	}
}

func routerBinder(app *libApp.App) *gin.Engine {
	return router.Router(app)
}

func CreateApp(config *config.Config) *libApp.App {

	app := libApp.New(config, serviceBinder, routerBinder)

	app.Pipeline().DeclarePhases(
		phases.NewTemplateTranslator(),
		phases.NewFactorGenerator(),
		phases.NewAccessGate(),
		phases.NewDecorator(),
		phases.NewSchedulerBinder(),
	)

	return app
}
