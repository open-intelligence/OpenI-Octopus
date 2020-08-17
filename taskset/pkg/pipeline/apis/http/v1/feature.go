package v1

import (
	apiCommon "scheduler/pkg/pipeline/apis/common"
)

type UpsertFeatureParam struct {
	FeatureName string                 `json:"name"`
	Author      string                 `json:"author"`
	Description string                 `json:"description"`
	Enabled     bool                   `json:"enabled"`
	JobSelector *apiCommon.JobSelector `json:"jobSelector"`
	Plugins     []*apiCommon.Plugin    `json:"plugins"`
}

type ChangePluginSequenceParam struct {
	BeforeKey  string `json:"beforeKey"`
	AfterKey   string `json:"afterKey"`
	PluginType string `json:"pluginType"`
}
