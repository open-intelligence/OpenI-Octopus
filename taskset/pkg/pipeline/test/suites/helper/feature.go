package helper

import (
	"fmt"
	"net/http"
	api "scheduler/pkg/pipeline/apis/common"
	pluginTypes "scheduler/pkg/pipeline/constants/feature"
	mockFeature "scheduler/pkg/pipeline/test/mock/feature"
	mockHttp "scheduler/pkg/pipeline/test/mock/http"
	v1 "scheduler/pkg/pipeline/test/suites/helper/v1"
	"scheduler/pkg/pipeline/utils"

	jsoniter "github.com/json-iterator/go"
)

func UpsertFeature(feature *api.Feature) ([]byte, int, error) {
	fByte, err := jsoniter.Marshal(feature)
	if err != nil {
		return nil, 0, err
	}
	return DoRequest(GetApp(), "POST", v1.APICreateFeature, string(fByte))
}

func GetFeature(featureName string) ([]byte, int, error) {
	url := fmt.Sprintf(v1.APIGetFeature, featureName)
	return DoRequest(GetApp(), "GET", url, "")
}

func ListFeatures(feature *api.Feature) ([]byte, int, error) {
	url := fmt.Sprintf(v1.APIListFeature, feature.Author)
	return DoRequest(GetApp(), "GET", url, "")
}

func TurnFeature(featureName string, onOff bool) ([]byte, int, error) {
	url := fmt.Sprintf(v1.APITurnOffFeature, featureName)
	if onOff {
		url = fmt.Sprintf(v1.APITurnOnFeature, featureName)
	}

	return DoRequest(GetApp(), "PUT", url, "")
}

func DeleteFeature(featureName string) ([]byte, int, error) {
	url := fmt.Sprintf(v1.APIDeleteFeature, featureName)
	return DoRequest(GetApp(), "DELETE", url, "")
}

func GetPlugin(pluginName string) ([]byte, int, error) {
	url := fmt.Sprintf(v1.APIGetPlugin, pluginName)
	return DoRequest(GetApp(), "GET", url, "")
}

func ListPlugins(plugin *api.Plugin) ([]byte, int, error) {
	url := fmt.Sprintf(v1.APIListPlugins, plugin.PluginType)
	return DoRequest(GetApp(), "GET", url, "")
}

func ChangePluginSequence(pluginType, beforeKey, afterKey string) ([]byte, int, error) {
	bodyTpl := "{\"pluginType\":\"%s\",\"beforeKey\":\"%s\",\"afterKey\":\"%s\"}"
	return DoRequest(GetApp(), "PUT", v1.APIChangePluginSequence, fmt.Sprintf(bodyTpl, pluginType, beforeKey, afterKey))
}

func RegisterFeature(host string, feature *api.Feature, handlers *mockFeature.HandlerFuncs) error {
	featureImp := &mockFeature.FeatureImp{
		Host:         host,
		Feature:      feature,
		HandlerFuncs: handlers,
	}
	featureImp.BindEndpoints()

	body, code, err := UpsertFeature(feature)
	if code != http.StatusOK {
		return fmt.Errorf("fail to create feature: %v %s", code, string(body))
	}
	if err != nil {
		return err
	}

	remoteService := mockHttp.Inject()
	remoteService.AddService(featureImp.BuildHttpService())
	return nil
}

func CancelFeature(host string, feature *api.Feature) error {
	body, code, err := DeleteFeature(feature.Name)
	if code != http.StatusOK {
		return fmt.Errorf("fail to delete feature: %v %s", code, string(body))
	}
	if err != nil {
		return err
	}
	remoteService := mockHttp.Inject()
	remoteService.RemoveService(host)
	return nil
}

func CreateRandomFeature() *api.Feature {
	randVer := utils.GetRandomString(8)
	return &api.Feature{
		Name:        "feature_demo_" + randVer,
		Author:      randVer,
		Enabled:     false,
		Description: randVer + "_demo feature for test",
		JobSelector: &api.JobSelector{
			Conditions: []*api.Condition{
				&api.Condition{
					Name:   "JobKind",
					Key:    "jobKind",
					Expect: "^DemoDefinedJobKind_" + randVer + "$",
				},
			},
			Expression: "JobKind",
		},
		Plugins: []*api.Plugin{
			&api.Plugin{
				PluginType:  pluginTypes.PLUGIN_TYPE_TEMPLATE_TRANSLATOR,
				CallAddress: "directFunction",
			},
			&api.Plugin{
				PluginType:  pluginTypes.PLUGIN_TYPE_FACTOR_GENERATOR,
				CallAddress: "directFunction",
			},
			&api.Plugin{
				PluginType:  pluginTypes.PLUGIN_TYPE_ACCESS_GATE,
				CallAddress: "directFunction",
			},
			&api.Plugin{
				PluginType:  pluginTypes.PLUGIN_TYPE_TEMPLATE_DECORATOR,
				CallAddress: "directFunction",
			},
			&api.Plugin{
				PluginType:  pluginTypes.PLUGIN_TYPE_SCHEDULER_BINDER,
				CallAddress: "directFunction",
			},
			&api.Plugin{
				PluginType:  pluginTypes.PLUGIN_TYPE_LIFEHOOK,
				CallAddress: "directFunction",
				JobSelector: &api.JobSelector{
					States: []string{"*"},
				},
			},
		},
	}
}
