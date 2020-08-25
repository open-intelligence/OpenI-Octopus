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

package feature

import (
	"fmt"
	api "scheduler/pkg/pipeline/apis/common"
	model "scheduler/pkg/pipeline/models/feature"
)

func (s *Service) GetFeatureList(where map[string]interface{}) ([]*api.Feature, error) {
	var features []*model.Feature

	dbModel := s.app.Services().Storage().GetDB()
	result := dbModel.Preload("Plugins").Where(where).Find(&features)
	if result.Error != nil && !result.RecordNotFound() {
		return nil, result.Error
	}
	var apiFeatures []*api.Feature
	for _, f := range features {
		apift, err := s.fmtFeatureModel2Api(f)
		if nil != err {
			return nil, err
		}
		apiFeatures = append(apiFeatures, apift)
	}
	return apiFeatures, nil
}

func (s *Service) GetFeature(featureName string) (*api.Feature, error) {

	f := &model.Feature{}

	f.Name = featureName

	dbModel := s.app.Services().Storage().GetDB()
	result := dbModel.Preload("Plugins").First(f)
	if result.RecordNotFound() {
		return nil, nil
	} else if result.Error != nil {
		return nil, result.Error
	}

	apiFeature, err := s.fmtFeatureModel2Api(f)
	if nil != err {
		return nil, err
	}
	return apiFeature, nil
}

func (s *Service) Upsert(feature *api.Feature) error {
	mFeature, err := s.fmtFeatureApi2Model(feature)
	if nil != err {
		return err
	}
	dbModel := s.app.Services().Storage().GetDB()
	historyFeature := &model.Feature{
		Name: feature.Name,
	}
	if result := dbModel.Preload("Plugins").First(historyFeature); result.Error != nil && !result.RecordNotFound() {
		return result.Error
	} else {
		tx := dbModel.Begin()
		defer func() {
			if r := recover(); r != nil {
				tx.Rollback()
			}
		}()

		if result.RecordNotFound() {
			// create
			if err := s.newFeature(tx, mFeature); err != nil {
				tx.Rollback()
				return err
			}
			return tx.Commit().Error
		}
		// update
		if err := s.updateFeature(tx, historyFeature, mFeature); err != nil {
			tx.Rollback()
			return err
		}
		return tx.Commit().Error
	}
}

func (s *Service) Disable(featureName string) (isSucceeded bool, err error) {
	if featureName == "" {
		err = fmt.Errorf("featureName is null")
		return
	}

	f := &model.Feature{Name: featureName}
	dbModel := s.app.Services().Storage().GetDB()
	result := dbModel.Model(f).Update("Enabled", false)
	if result.RowsAffected == 0 {
		return
	} else if result.Error != nil {
		err = result.Error
	}
	isSucceeded = true
	return
}

func (s *Service) Enable(featureName string) (isSucceeded bool, err error) {
	if featureName == "" {
		err = fmt.Errorf("featureName is null")
		return
	}

	f := &model.Feature{Name: featureName}
	dbModel := s.app.Services().Storage().GetDB()
	result := dbModel.Model(f).Update("Enabled", true)
	if result.RowsAffected == 0 {
		return
	} else if result.Error != nil {
		err = result.Error
	}
	isSucceeded = true
	return
}

func (s *Service) Delete(featureName string) error {
	if featureName == "" {
		return fmt.Errorf("featureName is null")
	}

	dbModel := s.app.Services().Storage().GetDB()
	tx := dbModel.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	f := &model.Feature{Name: featureName}
	fresult := tx.Unscoped().Delete(f)
	if fresult.Error != nil {
		tx.Rollback()
		return fresult.Error
	}

	presult := tx.Unscoped().Where("feature = ?", featureName).Delete(&model.Plugin{})
	if presult.Error != nil {
		tx.Rollback()
		return presult.Error
	}

	return tx.Commit().Error
}

func (s *Service) ChangePluginExecutionSequence(pluginA, pluginB *api.Plugin) error {
	if pluginA.PluginType != pluginB.PluginType {
		return fmt.Errorf("plugins must be in same phase")
	}
	if pluginA.Key == "" || pluginB.Key == "" {
		return fmt.Errorf("plugin key cannot be null")
	}
	if pluginA.ExecutionSequence == pluginB.ExecutionSequence {
		return nil
	}
	pa := &model.Plugin{Key: pluginA.Key, ExecutionSequence: pluginA.ExecutionSequence}
	pb := &model.Plugin{Key: pluginB.Key, ExecutionSequence: pluginB.ExecutionSequence}

	dbModel := s.app.Services().Storage().GetDB()
	tx := dbModel.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()
	if err := tx.Model(pa).Update("ExecutionSequence", pluginB.ExecutionSequence).Error; err != nil {
		tx.Rollback()
		return err
	}
	if err := tx.Model(pb).Update("ExecutionSequence", pluginA.ExecutionSequence).Error; err != nil {
		tx.Rollback()
		return err
	}

	return tx.Commit().Error
}

func (s *Service) RecordPluginOperation(jobID, pluginKey, operationType, operationResult string) error {
	operation := &model.PluginOperation{
		JobID:         jobID,
		Plugin:        pluginKey,
		OperationType: operationType,
		Operation:     operationResult,
	}
	session := s.app.Services().Storage().GetDB().Create(operation)
	return session.Error
}

func (s *Service) GetPlugin(key string) (*api.Plugin, error) {
	var plugin model.Plugin

	dbModel := s.app.Services().Storage().GetDB()
	if result := dbModel.Where("key = ?", key).First(&plugin); result.RecordNotFound() {
		return nil, nil
	} else if result.Error != nil {
		return nil, result.Error
	}

	apiPlugin, err := s.fmtPluginModel2Api(&plugin)
	if nil != err {
		return nil, err
	}

	return apiPlugin, nil
}

func (s *Service) GetPluginList(where map[string]interface{}) ([]*api.Plugin, error) {
	var plugins []*model.Plugin
	dbModel := s.app.Services().Storage().GetDB()
	if result := dbModel.Where(where).Find(&plugins); result.RecordNotFound() {
		return []*api.Plugin{}, nil
	} else if nil != result.Error {
		return nil, result.Error
	}

	apiPlugins := []*api.Plugin{}
	for _, p := range plugins {
		apiPlugin, err := s.fmtPluginModel2Api(p)
		if nil != err {
			return nil, err
		}
		apiPlugins = append(apiPlugins, apiPlugin)
	}
	return apiPlugins, nil
}
