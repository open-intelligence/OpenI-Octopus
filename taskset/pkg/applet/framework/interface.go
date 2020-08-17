package framework

import (
	"scheduler/pkg/applet/conf"
	libTaskset "scheduler/pkg/crd/apis/taskset/v1alpha1"
	api "scheduler/pkg/pipeline/apis/common"
)

type AppletDelegator interface {
	Applet
	Linker
}

type Applet interface {
	ExecTemplateTranslator(packet *AppletPacket) (*libTaskset.TaskSet, error)
	ExecFactorGenerator(packet *AppletPacket) (*Factor, error)
	ExecAccessGate(packet *AppletPacket) (*Accessor, error)
	ExecTemplateDecorator(packet *AppletPacket) (*libTaskset.TaskSet, error)
	ExecSchedulerBinder(packet *AppletPacket) (*libTaskset.TaskSet, error)
	ExecLifeHook(packet *AppletPacket) ([]byte, error)
}

type Linker interface {
	RegisterApplet(feature *api.Feature, applet Applet, conf *conf.AppletConfiguration) error
	Start(fn WrapperFeatureFn) error
	Stop() error
}
