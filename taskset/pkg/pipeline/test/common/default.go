package common

import (
	api "scheduler/pkg/pipeline/apis/common"
	pluginTypes "scheduler/pkg/pipeline/constants/feature"
)

func DefaultFeature() *api.Feature {
	feature := &api.Feature{
		Name:        "test",
		Author:      "yyrdl",
		Description: "default feature for test",
		JobSelector: &api.JobSelector{
			Conditions: []*api.Condition{
				&api.Condition{
					Name:   "JobKind",
					Key:    "jobKind",
					Expect: "^UserDefinedJobKind$",
				},
			},
			Expression: "JobKind",
		},
		Plugins: []*api.Plugin{
			&api.Plugin{
				Key:         "p1",
				PluginType:  pluginTypes.PLUGIN_TYPE_TEMPLATE_TRANSLATOR,
				CallAddress: "directFunction",
			},
			&api.Plugin{
				Key:         "p2",
				PluginType:  pluginTypes.PLUGIN_TYPE_FACTOR_GENERATOR,
				CallAddress: "directFunction",
			},
			&api.Plugin{
				Key:         "p3",
				PluginType:  pluginTypes.PLUGIN_TYPE_ACCESS_GATE,
				CallAddress: "directFunction",
			},
			&api.Plugin{
				Key:         "p4",
				PluginType:  pluginTypes.PLUGIN_TYPE_TEMPLATE_DECORATOR,
				CallAddress: "directFunction",
			},
			&api.Plugin{
				Key:         "p5",
				PluginType:  pluginTypes.PLUGIN_TYPE_SCHEDULER_BINDER,
				CallAddress: "directFunction",
			},
			&api.Plugin{
				Key:         "p6",
				PluginType:  pluginTypes.PLUGIN_TYPE_LIFEHOOK,
				CallAddress: "directFunction",
				JobSelector: &api.JobSelector{
					States: []string{"*"},
				},
			},
		},
	}

	feature.Init()

	return feature
}
