package v1

import (
	"fmt"
	"net/http"
	api "scheduler/pkg/pipeline/apis/common"
	featureConst "scheduler/pkg/pipeline/constants/feature"
	status "scheduler/pkg/pipeline/constants/statusphrase"
	"scheduler/pkg/pipeline/test/suites/helper"
	v1 "scheduler/pkg/pipeline/test/suites/helper/v1"
	"scheduler/pkg/pipeline/utils"
	"testing"

	jsoniter "github.com/json-iterator/go"
	. "github.com/smartystreets/goconvey/convey"
)

func TestCreateNormalFeature(t *testing.T) {
	Convey(fmt.Sprintf("V1 Create Normal Feature for POST %s", v1.APICreateFeature), t, func() {
		feature := helper.CreateRandomFeature()
		for _, p := range feature.Plugins {
			p.JobSelector = feature.JobSelector
			if p.PluginType == featureConst.PLUGIN_TYPE_LIFEHOOK {
				p.JobSelector.States = []string{"*"}
			}
		}
		resp, code, err := helper.UpsertFeature(feature)
		So(err, ShouldBeNil)
		So(code, ShouldEqual, http.StatusOK)
		So(jsoniter.Get(resp, "code").ToString(), ShouldEqual, status.OPERATION_SUCCEEDED)
	})
}

func TestCreateFeatureWithAuthorAll(t *testing.T) {
	Convey(fmt.Sprintf("V1 Create Feature with Author is all for POST %s", v1.APICreateFeature), t, func() {
		feature := helper.CreateRandomFeature()
		feature.Author = "all"

		resp, code, err := helper.UpsertFeature(feature)
		So(err, ShouldBeNil)
		So(code, ShouldEqual, http.StatusOK)
		So(jsoniter.Get(resp, "code").ToString(), ShouldEqual, status.WRONG_PARAM)
	})
}

func TestCreateFeatureWithNoExistedPluginType(t *testing.T) {
	Convey(fmt.Sprintf("V1 Create Feature with Noexisted pluginType for POST %s", v1.APICreateFeature), t, func() {
		feature := helper.CreateRandomFeature()
		for index, p := range feature.Plugins {
			p.JobSelector = feature.JobSelector
			if p.PluginType == featureConst.PLUGIN_TYPE_LIFEHOOK {
				p.JobSelector.States = []string{"*"}
			}
			p.PluginType = "no_existed_plugin_type_" + string(index)
		}
		resp, code, err := helper.UpsertFeature(feature)
		So(err, ShouldBeNil)
		So(code, ShouldEqual, http.StatusOK)
		So(jsoniter.Get(resp, "code").ToString(), ShouldEqual, status.UNSUPPORTED_PLUGIN_TYPE)
	})
}

func TestCreateFeatureWithoutJobSelector(t *testing.T) {
	Convey(fmt.Sprintf("V1 Create Feature without JobSelector for POST %s", v1.APICreateFeature), t, func() {
		feature := helper.CreateRandomFeature()
		feature.JobSelector = nil
		for _, p := range feature.Plugins {
			p.JobSelector = nil
		}
		resp, code, err := helper.UpsertFeature(feature)
		So(err, ShouldBeNil)
		So(code, ShouldEqual, http.StatusOK)
		So(jsoniter.Get(resp, "code").ToString(), ShouldEqual, status.LACK_OF_PARAM)
	})
}

func TestCreateFeatureWithoutGlobalJobSelector(t *testing.T) {
	Convey(fmt.Sprintf("V1 Create Feature without Global JobSelector for POST %s", v1.APICreateFeature), t, func() {
		feature := helper.CreateRandomFeature()
		for _, p := range feature.Plugins {
			p.JobSelector = feature.JobSelector
			if p.PluginType == featureConst.PLUGIN_TYPE_LIFEHOOK {
				p.JobSelector.States = []string{"*"}
			}
		}
		feature.JobSelector = &api.JobSelector{}
		resp, code, err := helper.UpsertFeature(feature)
		So(err, ShouldBeNil)
		So(code, ShouldEqual, http.StatusOK)
		So(jsoniter.Get(resp, "code").ToString(), ShouldEqual, status.OPERATION_SUCCEEDED)
	})
}

func TestCreateExistedFeature(t *testing.T) {
	Convey(fmt.Sprintf("V1 Create Feature for POST %s", v1.APICreateFeature), t, func() {
		feature := helper.CreateRandomFeature()
		resp, code, err := helper.UpsertFeature(feature)
		So(err, ShouldBeNil)
		So(code, ShouldEqual, http.StatusOK)
		So(jsoniter.Get(resp, "code").ToString(), ShouldEqual, status.OPERATION_SUCCEEDED)

		resp, code, err = helper.UpsertFeature(feature)
		So(err, ShouldBeNil)
		So(code, ShouldEqual, http.StatusOK)
		So(jsoniter.Get(resp, "code").ToString(), ShouldEqual, status.OPERATION_SUCCEEDED)
	})
}

func TestUpdateFeature(t *testing.T) {
	Convey(fmt.Sprintf("V1 Create Feature for POST %s", v1.APICreateFeature), t, func() {
		feature := helper.CreateRandomFeature()
		resp, code, err := helper.UpsertFeature(feature)
		So(err, ShouldBeNil)
		So(code, ShouldEqual, http.StatusOK)
		So(jsoniter.Get(resp, "code").ToString(), ShouldEqual, status.OPERATION_SUCCEEDED)

		feature.Author = "cocoshit"
		feature.Description = "code code shit"
		resp, code, err = helper.UpsertFeature(feature)
		So(err, ShouldBeNil)
		So(code, ShouldEqual, http.StatusOK)
		So(jsoniter.Get(resp, "code").ToString(), ShouldEqual, status.OPERATION_SUCCEEDED)

		resp, code, err = helper.GetFeature(feature.Name)
		So(err, ShouldBeNil)
		So(code, ShouldEqual, http.StatusOK)
		So(jsoniter.Get(resp, "code").ToString(), ShouldEqual, status.OPERATION_SUCCEEDED)
		So(jsoniter.Get(resp, "payload", "author").ToString(), ShouldEqual, feature.Author)
		So(jsoniter.Get(resp, "payload", "description").ToString(), ShouldEqual, feature.Description)
	})
}

func TestCreateLackParamFeature(t *testing.T) {
	Convey(fmt.Sprintf("V1 Create Feature for POST %s", v1.APICreateFeature), t, func() {
		feature1 := helper.CreateRandomFeature()
		feature1.Name = ""

		resp, code, err := helper.UpsertFeature(feature1)
		So(err, ShouldBeNil)
		So(code, ShouldEqual, http.StatusOK)
		So(jsoniter.Get(resp, "code").ToString(), ShouldEqual, status.LACK_OF_PARAM)

		feature2 := helper.CreateRandomFeature()
		feature2.Author = ""

		resp, code, err = helper.UpsertFeature(feature2)
		So(err, ShouldBeNil)
		So(code, ShouldEqual, http.StatusOK)
		So(jsoniter.Get(resp, "code").ToString(), ShouldEqual, status.LACK_OF_PARAM)
	})
}

func TestGetExistedFeature(t *testing.T) {
	Convey(fmt.Sprintf("V1 Get Existed Feature for GET %s", v1.APIGetFeature), t, func() {
		feature := helper.CreateRandomFeature()
		resp, code, err := helper.UpsertFeature(feature)
		So(err, ShouldBeNil)
		So(code, ShouldEqual, http.StatusOK)
		So(jsoniter.Get(resp, "code").ToString(), ShouldEqual, status.OPERATION_SUCCEEDED)

		resp, code, err = helper.GetFeature(feature.Name)
		So(err, ShouldBeNil)
		So(code, ShouldEqual, http.StatusOK)
		So(jsoniter.Get(resp, "code").ToString(), ShouldEqual, status.OPERATION_SUCCEEDED)
		So(jsoniter.Get(resp, "payload", "name").ToString(), ShouldEqual, feature.Name)
	})
}

func TestGetNoExistedFeature(t *testing.T) {
	Convey(fmt.Sprintf("V1 Get Feature for GET %s", v1.APIGetFeature), t, func() {
		resp, code, err := helper.GetFeature("no_exist_name")
		So(err, ShouldBeNil)
		So(code, ShouldEqual, http.StatusOK)
		So(jsoniter.Get(resp, "code").ToString(), ShouldEqual, status.OPERATION_SUCCEEDED)
		So(jsoniter.Get(resp, "payload").ToString(), ShouldEqual, "")
	})
}

func TestListFeaturesWithExistedAuthor(t *testing.T) {
	Convey(fmt.Sprintf("V1 List Features With Existed Author for GET %s", v1.APIListFeature), t, func() {
		author := "shamartor_" + utils.GetRandomString(8)
		for i := 0; i < 8; i++ {
			feature := helper.CreateRandomFeature()
			feature.Author = author

			resp, code, err := helper.UpsertFeature(feature)
			So(err, ShouldBeNil)
			So(code, ShouldEqual, http.StatusOK)
			So(jsoniter.Get(resp, "code").ToString(), ShouldEqual, status.OPERATION_SUCCEEDED)
		}

		resp, statusCode, err := helper.ListFeatures(&api.Feature{Author: author})
		So(err, ShouldBeNil)
		So(statusCode, ShouldEqual, http.StatusOK)
		So(jsoniter.Get(resp, "code").ToString(), ShouldEqual, status.OPERATION_SUCCEEDED)

		var features []*api.Feature
		jsoniter.Unmarshal([]byte(jsoniter.Get(resp, "payload").ToString()), &features)
		So(len(features), ShouldEqual, 8)
		for _, f := range features {
			So(f.Author, ShouldEqual, author)
		}
	})
}

func TestListFeaturesWithNoExistedAuthor(t *testing.T) {
	Convey(fmt.Sprintf("V1 List Features With NoExisted Author for GET %s", v1.APIListFeature), t, func() {
		resp, statusCode, err := helper.ListFeatures(&api.Feature{Author: "no_existed_author"})
		So(err, ShouldBeNil)
		So(statusCode, ShouldEqual, http.StatusOK)
		So(jsoniter.Get(resp, "code").ToString(), ShouldEqual, status.OPERATION_SUCCEEDED)
		So(jsoniter.Get(resp, "payload").ToString(), ShouldEqual, "")
	})
}

func TestListFeaturesWithAllAuthor(t *testing.T) {
	Convey(fmt.Sprintf("V1 List Features With All Author for GET %s", v1.APIListFeature), t, func() {
		resp, statusCode, err := helper.ListFeatures(&api.Feature{Author: "all"})
		So(err, ShouldBeNil)
		So(statusCode, ShouldEqual, http.StatusOK)
		So(jsoniter.Get(resp, "code").ToString(), ShouldEqual, status.OPERATION_SUCCEEDED)
	})
}

func TestTurnOffDisabledFeature(t *testing.T) {
	Convey(fmt.Sprintf("V1 Turn off Disabled Feature for PUT %s", v1.APITurnOffFeature), t, func() {
		feature := helper.CreateRandomFeature()
		feature.Enabled = false

		resp, code, err := helper.UpsertFeature(feature)
		So(err, ShouldBeNil)
		So(code, ShouldEqual, http.StatusOK)
		So(jsoniter.Get(resp, "code").ToString(), ShouldEqual, status.OPERATION_SUCCEEDED)

		resp, code, err = helper.TurnFeature(feature.Name, false)
		So(err, ShouldBeNil)
		So(code, ShouldEqual, http.StatusOK)
		So(jsoniter.Get(resp, "code").ToString(), ShouldEqual, status.OPERATION_SUCCEEDED)

		resp, code, err = helper.GetFeature(feature.Name)
		So(err, ShouldBeNil)
		So(code, ShouldEqual, http.StatusOK)
		So(jsoniter.Get(resp, "code").ToString(), ShouldEqual, status.OPERATION_SUCCEEDED)
		So(jsoniter.Get(resp, "payload", "enabled").ToBool(), ShouldEqual, false)
	})
}

func TestTurnOffEnabledFeature(t *testing.T) {
	Convey(fmt.Sprintf("V1 Turn off Enabled Feature for PUT %s", v1.APITurnOffFeature), t, func() {
		feature := helper.CreateRandomFeature()
		feature.Enabled = true

		resp, code, err := helper.UpsertFeature(feature)
		So(err, ShouldBeNil)
		So(code, ShouldEqual, http.StatusOK)
		So(jsoniter.Get(resp, "code").ToString(), ShouldEqual, status.OPERATION_SUCCEEDED)

		resp, code, err = helper.TurnFeature(feature.Name, false)
		So(err, ShouldBeNil)
		So(code, ShouldEqual, http.StatusOK)
		So(jsoniter.Get(resp, "code").ToString(), ShouldEqual, status.OPERATION_SUCCEEDED)

		resp, code, err = helper.GetFeature(feature.Name)
		So(err, ShouldBeNil)
		So(code, ShouldEqual, http.StatusOK)
		So(jsoniter.Get(resp, "code").ToString(), ShouldEqual, status.OPERATION_SUCCEEDED)
		So(jsoniter.Get(resp, "payload", "enabled").ToBool(), ShouldEqual, false)
	})
}

func TestTurnOffNoExistedFeature(t *testing.T) {
	Convey(fmt.Sprintf("V1 Turn off No Existed Feature for PUT %s", v1.APITurnOffFeature), t, func() {
		noExistedName := "no_existed_name_" + utils.GetRandomString(8)
		resp, code, err := helper.TurnFeature(noExistedName, false)
		So(err, ShouldBeNil)
		So(code, ShouldEqual, http.StatusOK)
		So(jsoniter.Get(resp, "code").ToString(), ShouldEqual, status.OPEERATION_TARGET_NOT_FOUND)
	})
}

func TestTurnOnDisabledFeature(t *testing.T) {
	Convey(fmt.Sprintf("V1 Turn on Disabled Feature for PUT %s", v1.APITurnOnFeature), t, func() {
		feature := helper.CreateRandomFeature()
		feature.Enabled = false

		resp, code, err := helper.UpsertFeature(feature)
		So(err, ShouldBeNil)
		So(code, ShouldEqual, http.StatusOK)
		So(jsoniter.Get(resp, "code").ToString(), ShouldEqual, status.OPERATION_SUCCEEDED)

		resp, code, err = helper.TurnFeature(feature.Name, true)
		So(err, ShouldBeNil)
		So(code, ShouldEqual, http.StatusOK)
		So(jsoniter.Get(resp, "code").ToString(), ShouldEqual, status.OPERATION_SUCCEEDED)

		resp, code, err = helper.GetFeature(feature.Name)
		So(err, ShouldBeNil)
		So(code, ShouldEqual, http.StatusOK)
		So(jsoniter.Get(resp, "code").ToString(), ShouldEqual, status.OPERATION_SUCCEEDED)
		So(jsoniter.Get(resp, "payload", "enabled").ToBool(), ShouldEqual, true)
	})
}

func TestTurnOnEnabledFeature(t *testing.T) {
	Convey(fmt.Sprintf("V1 Turn on Enabled Feature for PUT %s", v1.APITurnOnFeature), t, func() {
		feature := helper.CreateRandomFeature()
		feature.Enabled = true

		resp, code, err := helper.UpsertFeature(feature)
		So(err, ShouldBeNil)
		So(code, ShouldEqual, http.StatusOK)
		So(jsoniter.Get(resp, "code").ToString(), ShouldEqual, status.OPERATION_SUCCEEDED)

		resp, code, err = helper.TurnFeature(feature.Name, true)
		So(err, ShouldBeNil)
		So(code, ShouldEqual, http.StatusOK)
		So(jsoniter.Get(resp, "code").ToString(), ShouldEqual, status.OPERATION_SUCCEEDED)

		resp, code, err = helper.GetFeature(feature.Name)
		So(err, ShouldBeNil)
		So(code, ShouldEqual, http.StatusOK)
		So(jsoniter.Get(resp, "code").ToString(), ShouldEqual, status.OPERATION_SUCCEEDED)
		So(jsoniter.Get(resp, "payload", "enabled").ToBool(), ShouldEqual, true)
	})
}

func TestTurnOnNoExistedFeature(t *testing.T) {
	Convey(fmt.Sprintf("V1 Turn on No Existed Feature for PUT %s", v1.APITurnOffFeature), t, func() {
		noExistedName := "no_existed_name_" + utils.GetRandomString(8)
		resp, code, err := helper.TurnFeature(noExistedName, true)
		So(err, ShouldBeNil)
		So(code, ShouldEqual, http.StatusOK)
		So(jsoniter.Get(resp, "code").ToString(), ShouldEqual, status.OPEERATION_TARGET_NOT_FOUND)
	})
}

func TestGetExistedPlugin(t *testing.T) {
	Convey(fmt.Sprintf("V1 Get existed Plugin for GET %s", v1.APIGetPlugin), t, func() {
		feature := helper.CreateRandomFeature()

		resp, code, err := helper.UpsertFeature(feature)
		So(err, ShouldBeNil)
		So(code, ShouldEqual, http.StatusOK)
		So(jsoniter.Get(resp, "code").ToString(), ShouldEqual, status.OPERATION_SUCCEEDED)

		pluginKey := fmt.Sprintf("%s.%s.%s", feature.Plugins[0].PluginType, feature.Name, feature.Author)
		resp, statusCode, err := helper.GetPlugin(pluginKey)
		So(err, ShouldBeNil)
		So(statusCode, ShouldEqual, http.StatusOK)
		So(jsoniter.Get(resp, "code").ToString(), ShouldEqual, status.OPERATION_SUCCEEDED)

		var plugin *api.Plugin
		jsoniter.Unmarshal([]byte(jsoniter.Get(resp, "payload").ToString()), &plugin)
		So(plugin.Key, ShouldEqual, pluginKey)
	})
}

func TestGetNoExistedPlugin(t *testing.T) {
	Convey(fmt.Sprintf("V1 Get No existed Plugin for GET %s", v1.APIGetPlugin), t, func() {
		pluginKey := "no_existed_key_" + utils.GetRandomString(8)
		resp, statusCode, err := helper.GetPlugin(pluginKey)
		So(err, ShouldBeNil)
		So(statusCode, ShouldEqual, http.StatusOK)
		So(jsoniter.Get(resp, "code").ToString(), ShouldEqual, status.OPERATION_SUCCEEDED)
		So(jsoniter.Get(resp, "payload").ToString(), ShouldEqual, "")
	})
}

func TestListPluginsWithExistedPluginType(t *testing.T) {
	Convey(fmt.Sprintf("V1 List Plugins With Existed PluginType for GET %s", v1.APIListPlugins), t, func() {
		feature := helper.CreateRandomFeature()

		resp, code, err := helper.UpsertFeature(feature)
		So(err, ShouldBeNil)
		So(code, ShouldEqual, http.StatusOK)
		So(jsoniter.Get(resp, "code").ToString(), ShouldEqual, status.OPERATION_SUCCEEDED)

		resp, statusCode, err := helper.ListPlugins(feature.Plugins[0])
		So(err, ShouldBeNil)
		So(statusCode, ShouldEqual, http.StatusOK)
		So(jsoniter.Get(resp, "code").ToString(), ShouldEqual, status.OPERATION_SUCCEEDED)

		var plugins []*api.Plugin
		jsoniter.Unmarshal([]byte(jsoniter.Get(resp, "payload").ToString()), &plugins)
		So(len(plugins), ShouldBeGreaterThan, 1)
	})
}

func TestListPluginsWithNoExistedPluginType(t *testing.T) {
	Convey(fmt.Sprintf("V1 List Plugins With NoExisted PluginType for GET %s", v1.APIListPlugins), t, func() {
		resp, statusCode, err := helper.ListPlugins(&api.Plugin{
			PluginType: "no_existed_plugin_type",
		})
		So(err, ShouldBeNil)
		So(statusCode, ShouldEqual, http.StatusOK)
		So(jsoniter.Get(resp, "code").ToString(), ShouldEqual, status.UNSUPPORTED_PLUGIN_TYPE)
		So(jsoniter.Get(resp, "payload").ToString(), ShouldEqual, "")
	})
}

func TestChangePluginSequence(t *testing.T) {
	Convey(fmt.Sprintf("V1 Change Plugin Sequence for PUT %s", v1.APIChangePluginSequence), t, func() {
		featureDemo1 := helper.CreateRandomFeature()
		featureDemo2 := helper.CreateRandomFeature()

		So(featureDemo1.Plugins[0].PluginType, ShouldEqual, featureDemo2.Plugins[0].PluginType)
		beforePluginKey := fmt.Sprintf("%s.%s.%s", featureDemo1.Plugins[0].PluginType, featureDemo1.Name, featureDemo1.Author)
		afterPluginKey := fmt.Sprintf("%s.%s.%s", featureDemo2.Plugins[0].PluginType, featureDemo2.Name, featureDemo2.Author)

		// create
		resp, code, err := helper.UpsertFeature(featureDemo1)
		So(err, ShouldBeNil)
		So(code, ShouldEqual, http.StatusOK)
		So(jsoniter.Get(resp, "code").ToString(), ShouldEqual, status.OPERATION_SUCCEEDED)
		resp, code, err = helper.UpsertFeature(featureDemo2)
		So(err, ShouldBeNil)
		So(code, ShouldEqual, http.StatusOK)
		So(jsoniter.Get(resp, "code").ToString(), ShouldEqual, status.OPERATION_SUCCEEDED)

		// do change
		resp, code, err = helper.ChangePluginSequence(featureDemo1.Plugins[0].PluginType, beforePluginKey, afterPluginKey)
		So(err, ShouldBeNil)
		So(code, ShouldEqual, http.StatusOK)
		So(jsoniter.Get(resp, "code").ToString(), ShouldEqual, status.OPERATION_SUCCEEDED)

		//// list plugin detail
		//resp, code, err = listPlugins(featureDemo1.Plugins[0])
		//So(err, ShouldBeNil)
		//So(code, ShouldEqual, http.StatusOK)
		//So(jsoniter.Get(resp, "code").ToString(), ShouldEqual, status.OPERATION_SUCCEEDED)
		//
		//var plugins []*api.Plugin
		//jsoniter.Unmarshal([]byte(jsoniter.Get(resp, "payload").ToString()), &plugins)
		//
		//var chResult int
		//for _, p := range plugins {
		//	if p.Key == beforePluginKey && p.ExecutionSequence == afterPluginSequence {
		//		chResult |= 1
		//	}
		//	if p.Key == afterPluginKey && p.ExecutionSequence == beforePluginSequence {
		//		chResult |= 2
		//	}
		//}
		//So(chResult, ShouldEqual, 3)
	})
}

func TestDeleteExistedFeature(t *testing.T) {
	Convey(fmt.Sprintf("V1 Delete Existed Feature for DELETE %s", v1.APIDeleteFeature), t, func() {
		feature := helper.CreateRandomFeature()

		resp, code, err := helper.UpsertFeature(feature)
		So(err, ShouldBeNil)
		So(code, ShouldEqual, http.StatusOK)
		So(jsoniter.Get(resp, "code").ToString(), ShouldEqual, status.OPERATION_SUCCEEDED)

		resp, statusCode, err := helper.DeleteFeature(feature.Name)
		So(err, ShouldBeNil)
		So(statusCode, ShouldEqual, http.StatusOK)
		So(jsoniter.Get(resp, "code").ToString(), ShouldEqual, status.OPERATION_SUCCEEDED)

		resp, statusCode, err = helper.GetFeature(feature.Name)
		So(err, ShouldBeNil)
		So(statusCode, ShouldEqual, http.StatusOK)
		So(jsoniter.Get(resp, "code").ToString(), ShouldEqual, status.OPERATION_SUCCEEDED)
		So(jsoniter.Get(resp, "payload").ToString(), ShouldEqual, "")
	})
}

func TestDeleteNoExistedFeature(t *testing.T) {
	Convey(fmt.Sprintf("V1 Delete No Existed Feature for DELETE %s", v1.APIDeleteFeature), t, func() {
		featureName := "no_existed_name_" + utils.GetRandomString(8)

		resp, statusCode, err := helper.DeleteFeature(featureName)
		So(err, ShouldBeNil)
		So(statusCode, ShouldEqual, http.StatusOK)
		So(jsoniter.Get(resp, "code").ToString(), ShouldEqual, status.OPEERATION_TARGET_NOT_FOUND)
	})
}
