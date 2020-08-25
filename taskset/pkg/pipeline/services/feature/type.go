package feature

import (
	"go.uber.org/zap"
	"scheduler/pkg/pipeline/app"
)

type Service struct {
	app      *app.App
	logger   *zap.Logger
}

func New(app *app.App) *Service {
	s := &Service{
		app:    app,
		logger: app.Logger().Named("svc-feature"),
	}
	return s
}
