package feature

import (
	"fmt"
	model "scheduler/pkg/pipeline/models/feature"

	"github.com/jinzhu/gorm"
)

func (s *Service) newFeature(tx *gorm.DB, feature *model.Feature) error {
	if result := tx.Create(feature); result.Error != nil {
		return result.Error
	}
	if err := s.createFeaturePlugins(tx, feature.Plugins); err != nil {
		return err
	}

	return nil
}

func (s *Service) updateFeature(tx *gorm.DB, dst *model.Feature, src *model.Feature) error {
	if dst.Name != src.Name {
		return fmt.Errorf("featureName diff when updating")
	}
	if result := tx.
		Model(&model.Feature{Name: dst.Name}).
		Update(src); result.Error != nil {
		return result.Error
	}
	return s.syncFeaturePlugins(tx, dst, src)
}

func (s *Service) syncFeaturePlugins(tx *gorm.DB, originFeature *model.Feature, sourceFeature *model.Feature) error {
	if (originFeature.Plugins == nil || len(originFeature.Plugins) < 1) &&
		(sourceFeature.Plugins == nil || len(sourceFeature.Plugins) < 1) {
		return nil
	}
	if sourceFeature.Plugins == nil || len(sourceFeature.Plugins) < 1 {
		result := tx.Where("feature = ?", originFeature.Name).Delete(model.Plugin{})
		if result.Error != nil && !result.RecordNotFound() {
			return result.Error
		}
		return nil
	}

	toDeletePlugins := s.differencePluginsByKey(originFeature.Plugins, sourceFeature.Plugins)
	if err := s.deleteFeaturePlugins(tx, toDeletePlugins); err != nil {
		return err
	}

	toCreatePlugins := s.differencePluginsByKey(sourceFeature.Plugins, originFeature.Plugins)
	if err := s.createFeaturePlugins(tx, toCreatePlugins); err != nil {
		return err
	}

	toUpdatePlugins := s.unionDestPluginsByKey(sourceFeature.Plugins, originFeature.Plugins)
	if err := s.updateFeaturePlugins(tx, toUpdatePlugins); err != nil {
		return err
	}

	return nil
}

func (s *Service) deleteFeaturePlugins(tx *gorm.DB, plugins []*model.Plugin) error {
	for _, dp := range plugins {
		if result := tx.Unscoped().Delete(dp); result.Error != nil {
			return result.Error
		}
	}
	return nil
}

func (s *Service) createFeaturePlugins(tx *gorm.DB, plugins []*model.Plugin) error {
	for _, cp := range plugins {
		if result := tx.Create(cp); result.Error != nil {
			return result.Error
		}
	}
	return nil
}

func (s *Service) updateFeaturePlugins(tx *gorm.DB, plugins []*model.Plugin) error {
	for _, up := range plugins {
		if result := tx.Model(up).Updates(up); result.Error != nil {
			return result.Error
		}
	}
	return nil
}
