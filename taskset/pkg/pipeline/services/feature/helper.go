package feature

import (
	"fmt"
	api "scheduler/pkg/pipeline/apis/common"
	model "scheduler/pkg/pipeline/models/feature"

	jsoniter "github.com/json-iterator/go"
)

func (s *Service) fmtFeatureApi2Model(feature *api.Feature) (*model.Feature, error) {
	featureBytes, err := jsoniter.Marshal(feature)

	if err != nil {
		return nil, err
	}

	mPlugins := []*model.Plugin{}
	for _, plugin := range feature.Plugins {
		mPlugin, err := s.fmtPluginApi2Model(plugin)
		if nil != err {
			return nil, err
		}
		mPlugin.Feature = feature.Name
		mPlugins = append(mPlugins, mPlugin)
	}

	mFeature := &model.Feature{
		Name:        feature.Name,
		Author:      feature.Author,
		Feature:     string(featureBytes),
		Description: feature.Description,
		Enabled:     feature.Enabled,
		Plugins:     mPlugins,
	}
	return mFeature, nil
}

func (s *Service) fmtFeatureModel2Api(feature *model.Feature) (*api.Feature, error) {

	var apiPlugins []*api.Plugin

	for _, pg := range feature.Plugins {
		apiPlugin, err := s.fmtPluginModel2Api(pg)
		if nil != err {
			return nil, err
		}
		apiPlugins = append(apiPlugins, apiPlugin)
	}
	apiFeature := &api.Feature{
		Name:        feature.Name,
		Author:      feature.Author,
		Description: feature.Description,
		Enabled:     feature.Enabled,
		Plugins:     apiPlugins,
	}
	return apiFeature, nil
}

func (s *Service) fmtPluginApi2Model(plugin *api.Plugin) (*model.Plugin, error) {
	jobSelector := plugin.JobSelector
	mJobSelector, err := jsoniter.Marshal(jobSelector)
	if err != nil {
		return nil, err
	}

	mPlugin := &model.Plugin{
		Key: plugin.Key,
		//Feature:           feature.Name,
		Type:              plugin.PluginType,
		Callback:          plugin.CallAddress,
		Description:       plugin.Description,
		ExecutionSequence: plugin.ExecutionSequence,
		Selector:          string(mJobSelector),
	}
	return mPlugin, err
}

func (s *Service) fmtPluginModel2Api(plugin *model.Plugin) (*api.Plugin, error) {
	var jobSel api.JobSelector
	selBlob := []byte(plugin.Selector)
	err := jsoniter.Unmarshal(selBlob, &jobSel)
	if err != nil {
		return nil, fmt.Errorf("the jobSelector of Plugin %s couldnot deserialize", plugin.Key)
	}
	apiPlugin := &api.Plugin{
		Key:               plugin.Key,
		PluginType:        plugin.Type,
		CallAddress:       plugin.Callback,
		Description:       plugin.Description,
		ExecutionSequence: plugin.ExecutionSequence,
		JobSelector:       &jobSel,
	}

	return apiPlugin, nil
}

// Like:
// difference([3, 2, 1], [4, 2]);
// => [3, 1]
func (s *Service) differencePluginsByKey(p1 []*model.Plugin, p2 []*model.Plugin) []*model.Plugin {
	result := make([]*model.Plugin, 0)
	if p1 == nil || len(p1) < 1 {
		return result
	}

	if p2 == nil || len(p2) < 1 {
		return p1[:]
	}

	for _, xp := range p1 {
		isEqual := false
		for _, yp := range p2 {
			if xp.Key == yp.Key {
				isEqual = true
				break
			}
		}
		if !isEqual {
			result = append(result, xp)
		}
	}
	return result
}

// Like:
// union([2], [1, 2]);
// => [2, 1]
func (s *Service) unionDestPluginsByKey(dst []*model.Plugin, comp []*model.Plugin) []*model.Plugin {
	result := make([]*model.Plugin, 0)
	if dst == nil || len(dst) < 1 ||
		comp == nil || len(comp) < 1 {
		return result
	}

	for _, xp := range dst {
		for _, yp := range comp {
			if xp.Key == yp.Key {
				result = append(result, xp)
				break
			}
		}
	}
	return result
}
