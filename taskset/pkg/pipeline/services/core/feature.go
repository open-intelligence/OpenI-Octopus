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

package core

import (
	"fmt"
	api "scheduler/pkg/pipeline/apis/common"
)

//DisableFeature turns off the specific feature
func (s *Service) DisableFeature(featureName string) (isSucceeded bool, err error) {

	defer s.mutex.Unlock()

	s.mutex.Lock()

	isSucceeded, err = s.app.Services().Feature().Disable(featureName)
	if err != nil {
		return
	}
	if !isSucceeded {
		return
	}

	s.app.Pipeline().DisableFeature(featureName)

	if err = s.SyncLifeHookByFeatureName(featureName); err != nil {
		return
	}

	return
}

//EnableFeature makes the feature given available
func (s *Service) EnableFeature(featureName string) (isSucceeded bool, err error) {

	defer s.mutex.Unlock()

	s.mutex.Lock()
	isSucceeded, err = s.app.Services().Feature().Enable(featureName)
	if nil != err {
		return
	}
	if !isSucceeded {
		return
	}

	s.app.Pipeline().EnableFeature(featureName)

	if err = s.SyncLifeHookByFeatureName(featureName); err != nil {
		return
	}

	return
}

//DeleteFeature deletes the specific feature
func (s *Service) DeleteFeature(feature *api.Feature) error {

	defer s.mutex.Unlock()
	s.mutex.Lock()

	err := s.app.Services().Feature().Delete(feature.Name)

	if nil != err {
		return err
	}

	s.app.Pipeline().DeleteFeature(feature.Name)

	// sync enabled to false when sync feature in delete
	feature.Enabled = false
	if err := s.SyncLifeHookByFeature(feature); err != nil {
		return err
	}
	return nil
}

//UpsertFeature updates or inserts a feature ,and sync this feature in the pipeline
func (s *Service) UpsertFeature(feature *api.Feature) error {

	defer s.mutex.Unlock()

	s.mutex.Lock()

	s.app.Pipeline().SyncFeatureStatus(feature)

	err := s.app.Services().Feature().Upsert(feature)

	if err != nil {
		return err
	}

	err = s.app.Pipeline().UpsertFeature(feature)

	if err != nil {
		return err
	}

	if err = s.SyncLifeHookByFeature(feature); err != nil {
		return err
	}
	return nil
}

//ChangePluginExecutionSequence changes the plugin execution sequence
func (s *Service) ChangePluginExecutionSequence(pluginType string, before, after string) error {

	defer s.mutex.Unlock()
	s.mutex.Lock()

	bPlugin := s.app.Pipeline().GetPlugin(pluginType, before)
	aPlugin := s.app.Pipeline().GetPlugin(pluginType, after)

	if bPlugin == nil {
		return fmt.Errorf("Missing Plugin,plugin key:%s", before)
	}

	if aPlugin == nil {
		return fmt.Errorf("Missing Plugin,plugin key:%s", after)
	}

	a := &api.Plugin{
		Key:               aPlugin.Key(),
		ExecutionSequence: aPlugin.GetExecutionSequence(),
	}

	b := &api.Plugin{
		Key:               bPlugin.Key(),
		ExecutionSequence: bPlugin.GetExecutionSequence(),
	}

	err := s.app.Services().Feature().ChangePluginExecutionSequence(a, b)

	if err != nil {
		return err
	}

	s.app.Pipeline().ChangePluginExecutionSequence(pluginType, before, after)

	return nil
}
