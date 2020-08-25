package framework

import (
	"fmt"
	"scheduler/pkg/applet/conf"
	libTaskset "scheduler/pkg/crd/apis/taskset/v1alpha1"
	api "scheduler/pkg/pipeline/apis/common"
)

func NewComplexFeatureAppletDelegator() AppletDelegator {
	return &complexFeatureAppletDelegator{
		applets: make(map[string]*featureAppletDelegator),
	}
}

func (c * complexFeatureAppletDelegator) RegisterApplet(feature *api.Feature, applet Applet, config *conf.AppletConfiguration) error {
	c.mux.Lock()
	defer c.mux.Unlock()

	if _, found := c.applets[feature.Name]; found {
		return fmt.Errorf("featureName %v had exsited", feature.Name)
	}

	c.applets[feature.Name] = &featureAppletDelegator{}
	return c.applets[feature.Name].RegisterApplet(feature, applet, config)
}

func (c * complexFeatureAppletDelegator) dispatch(packet *AppletPacket) (Applet, error) {
	c.mux.RLock()
	defer c.mux.RUnlock()

	if applet, found := c.applets[packet.FeatureUID];found {
		return applet, nil
	} else {
		return nil, fmt.Errorf("not found applet")
	}
}

func (c * complexFeatureAppletDelegator) ExecTemplateTranslator(packet *AppletPacket) (*libTaskset.TaskSet, error) {
	if applet, err := c.dispatch(packet); err == nil {
		return applet.ExecTemplateTranslator(packet);
	} else {
		return nil, err
	}
}

func (c * complexFeatureAppletDelegator) ExecFactorGenerator(packet *AppletPacket) (*Factor, error) {
	if applet, err := c.dispatch(packet); err == nil {
		return applet.ExecFactorGenerator(packet);
	} else {
		return nil, err
	}
}

func (c * complexFeatureAppletDelegator) ExecAccessGate(packet *AppletPacket) (*Accessor, error) {
	if applet, err := c.dispatch(packet); err == nil {
		return applet.ExecAccessGate(packet);
	} else {
		return nil, err
	}
}

func (c * complexFeatureAppletDelegator) ExecTemplateDecorator(packet *AppletPacket) (*libTaskset.TaskSet, error) {
	if applet, err := c.dispatch(packet); err == nil {
		return applet.ExecTemplateDecorator(packet);
	} else {
		return nil, err
	}
}

func (c * complexFeatureAppletDelegator) ExecSchedulerBinder(packet *AppletPacket) (*libTaskset.TaskSet, error) {
	if applet, err := c.dispatch(packet); err == nil {
		return applet.ExecSchedulerBinder(packet);
	} else {
		return nil, err
	}
}

func (c * complexFeatureAppletDelegator) ExecLifeHook(packet *AppletPacket) ([]byte, error) {
	if applet, err := c.dispatch(packet); err == nil {
		return applet.ExecLifeHook(packet);
	} else {
		return nil, err
	}
}

func (c * complexFeatureAppletDelegator) Start(fn WrapperFeatureFn) error {
	c.mux.RLock()
	defer c.mux.RUnlock()

	for _, applet := range c.applets {
		err := applet.Start(fn)
		if err != nil {
			return err
		}
	}
	return nil
}

func (c * complexFeatureAppletDelegator) Stop() error {
	c.mux.RLock()
	defer c.mux.RUnlock()

	for _, applet := range c.applets {
		err := applet.Stop()
		if err != nil {
			return err
		}
	}
	return nil
}