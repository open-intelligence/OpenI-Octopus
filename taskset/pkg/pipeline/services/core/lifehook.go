package core

import (
	"fmt"
	api "scheduler/pkg/pipeline/apis/common"
	featureConst "scheduler/pkg/pipeline/constants/feature"
)

//Sync LifeHook active task By feature
func (s *Service) SyncLifeHookByFeature(feature *api.Feature) error {
	if nil == feature {
		return fmt.Errorf("feature is nil")
	}
	if nil == feature.Plugins {
		return nil
	}

	for _, plugin := range feature.Plugins {
		if plugin.PluginType != featureConst.PLUGIN_TYPE_LIFEHOOK {
			continue
		}

		if feature.Enabled {
			s.app.Services().LifeHook().Subscribe(feature, plugin)
		} else {
			s.app.Services().LifeHook().Unsubscribe(feature, plugin)
		}
	}
	return nil
}

func (s *Service) SyncLifeHookByFeatureName(featureName string) error {
	if f, err := s.app.Services().Feature().GetFeature(featureName); err != nil {
		return err
	} else {
		if err = s.SyncLifeHookByFeature(f); err != nil {
			return err
		}
	}
	return nil
}
