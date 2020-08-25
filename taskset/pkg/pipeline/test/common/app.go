package common

import (
	libApp "scheduler/pkg/pipeline/app"
	"scheduler/pkg/pipeline/config"
	"scheduler/pkg/pipeline/phases"
	"scheduler/pkg/pipeline/router"
	coreService "scheduler/pkg/pipeline/services/core"
	featureService "scheduler/pkg/pipeline/services/feature"
	jobService "scheduler/pkg/pipeline/services/job"
	lifeHookService "scheduler/pkg/pipeline/services/lifehook"
	storageService "scheduler/pkg/pipeline/services/storage"
	tokenService "scheduler/pkg/pipeline/services/token"
	k8sService "scheduler/pkg/pipeline/test/mock/kubernetes"

	"scheduler/pkg/pipeline/constants/authority"
	"scheduler/pkg/pipeline/models/token"

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

	gin.SetMode(gin.ReleaseMode)

	return app
}

const DefaultAdminToken = "admin-token"

func CreateDefaultAdminToken(app *libApp.App) error {

	token := &token.Token{
		Who:       "admin",
		Token:     DefaultAdminToken,
		Note:      "Default admin token for test",
		Authority: authority.ADMIN,
	}

	session := app.Services().Storage().GetDB().Create(token)

	return session.Error
}
