package serv

import (
	"scheduler/pkg/applet/framework"
	api "scheduler/pkg/pipeline/apis/common"
)

type Server interface {
	Append(feature *api.Feature, builder framework.AppletBuilder)
	Run() error
	ShutDown() error
}
