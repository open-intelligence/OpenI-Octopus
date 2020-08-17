package framework

import (
	"fmt"
	"scheduler/pkg/applet/conf"
	"scheduler/pkg/applet/utils"
	libTaskset "scheduler/pkg/crd/apis/taskset/v1alpha1"
	api "scheduler/pkg/pipeline/apis/common"
)

func NewFeatureAppletDelegator(feature *api.Feature, applet Applet, config *conf.AppletConfiguration) AppletDelegator {
	f := &featureAppletDelegator{}
	f.RegisterApplet(feature, applet, config)
	return f
}

func (fa * featureAppletDelegator) ExecTemplateTranslator(packet *AppletPacket) (*libTaskset.TaskSet, error) {
	return fa.applet.ExecTemplateTranslator(fa.wrapperPacket(packet))
}

func (fa * featureAppletDelegator) ExecFactorGenerator(packet *AppletPacket) (*Factor, error) {
	return fa.applet.ExecFactorGenerator(fa.wrapperPacket(packet))
}

func (fa * featureAppletDelegator) ExecAccessGate(packet *AppletPacket)  (*Accessor, error) {
	return fa.applet.ExecAccessGate(fa.wrapperPacket(packet))
}

func (fa * featureAppletDelegator) ExecTemplateDecorator(packet *AppletPacket) (*libTaskset.TaskSet, error) {
	return fa.applet.ExecTemplateDecorator(fa.wrapperPacket(packet))
}

func (fa * featureAppletDelegator) ExecSchedulerBinder(packet *AppletPacket) (*libTaskset.TaskSet, error) {
	return fa.applet.ExecSchedulerBinder(fa.wrapperPacket(packet))
}

func (fa * featureAppletDelegator) ExecLifeHook(packet *AppletPacket) ([]byte, error) {
	return fa.applet.ExecLifeHook(fa.wrapperPacket(packet))
}

func (fa *featureAppletDelegator) RegisterApplet(feature *api.Feature, applet Applet, config *conf.AppletConfiguration) error {
	if feature == nil || applet == nil || config == nil {
		return fmt.Errorf("feature or applet or config is nil")
	}

	fa.feature = feature
	fa.applet = applet
	fa.config = config
	return nil
}

func (fa * featureAppletDelegator) wrapperPacket(packet *AppletPacket) *AppletPacket {
	// TODO impl config.Clone
	packet.config = fa.config
	return packet
}

func (fa *featureAppletDelegator) syncPipeline() error {
	if fa.featureWrapper == nil {
		return fmt.Errorf("feature miss attributes")
	}
	client := utils.NewPipelineClient(fa.config.Pipeline)

	if err := client.SyncFeature(fa.featureWrapper); err != nil {
		return fmt.Errorf("sync Feature to Pipeline failed, callback: %s", err.Error())
	}
	return nil
}

func (fa *featureAppletDelegator) Start(fn WrapperFeatureFn) error {
	if fn == nil {
		return fmt.Errorf("Wrapper Feature Not Found")
	}
	fa.featureWrapper = fn(*fa.feature)
	fa.featureWrapper.Enabled = true

	return fa.syncPipeline()
}

func (fa *featureAppletDelegator) Stop() error {
	if fa.featureWrapper == nil {
		return nil
	}
	fa.featureWrapper.Enabled = false

	return fa.syncPipeline()
}