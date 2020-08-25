package v1

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

import (
	"fmt"
	"net/http"
	apiCommon "scheduler/pkg/pipeline/apis/common"
	v1 "scheduler/pkg/pipeline/apis/http/v1"
	"scheduler/pkg/pipeline/app"
	featureConst "scheduler/pkg/pipeline/constants/feature"
	status "scheduler/pkg/pipeline/constants/statusphrase"
	"strings"

	"github.com/gin-gonic/gin"
)

func UpsertFeature(app *app.App, c *gin.Context) error {
	var param v1.UpsertFeatureParam

	if err := c.ShouldBindJSON(&param); err != nil {
		return err
	}

	if "" == param.FeatureName || "" == param.Author {
		c.JSON(http.StatusOK, gin.H{
			"code": status.LACK_OF_PARAM,
			"msg":  "Missing parameter 'featureName' or 'author'",
		})
		return nil
	}

	if strings.ToLower(param.Author) == "all" {
		c.JSON(http.StatusOK, gin.H{
			"code": status.WRONG_PARAM,
			"msg":  "the parameter author could not be 'all/All'",
		})
		return nil
	}

	apiFeature := &apiCommon.Feature{
		Name:        param.FeatureName,
		Author:      param.Author,
		Description: param.Description,
		JobSelector: param.JobSelector,
		Plugins:     param.Plugins,
		Enabled:     param.Enabled,
	}

	apiFeature.Init()

	if nil == apiFeature.JobSelector {
		c.JSON(http.StatusOK, gin.H{
			"code": status.LACK_OF_PARAM,
			"msg":  "Missing parameter 'jobSelector'",
		})
		return nil
	}

	for _, p := range apiFeature.Plugins {
		switch p.PluginType {
		case featureConst.PLUGIN_TYPE_LIFEHOOK:
		case featureConst.PLUGIN_TYPE_TEMPLATE_TRANSLATOR:
		case featureConst.PLUGIN_TYPE_ACCESS_GATE:
		case featureConst.PLUGIN_TYPE_TEMPLATE_DECORATOR:
		case featureConst.PLUGIN_TYPE_FACTOR_GENERATOR:
		case featureConst.PLUGIN_TYPE_SCHEDULER_BINDER:
			continue
		default:
			c.JSON(http.StatusOK, gin.H{
				"code": status.UNSUPPORTED_PLUGIN_TYPE,
				"msg":  fmt.Sprintf("unsupported pluginType %s", p.PluginType),
			})
			return nil
		}
	}

	err := app.Services().Core().UpsertFeature(apiFeature)

	if err != nil {
		return err
	}

	c.JSON(http.StatusOK, gin.H{
		"code": status.OPERATION_SUCCEEDED,
		"msg":  "success",
	})
	return nil
}

func DeleteFeature(app *app.App, c *gin.Context) error {
	featureName := c.Param("name")

	feature, err := app.Services().Feature().GetFeature(featureName)

	if err != nil {
		return err
	}

	if nil == feature {
		c.JSON(http.StatusOK, gin.H{
			"code": status.OPEERATION_TARGET_NOT_FOUND,
			"msg":  "success",
		})
		return nil
	}

	err = app.Services().Core().DeleteFeature(feature)
	if err != nil {
		return err
	}

	c.JSON(http.StatusOK, gin.H{
		"code": status.OPERATION_SUCCEEDED,
		"msg":  "success",
	})

	return nil
}

func DisableFeature(app *app.App, c *gin.Context) error {
	featureName := c.Param("name")
	isSucceeded, err := app.Services().Core().DisableFeature(featureName)
	if err != nil {
		return err
	}

	if isSucceeded {
		c.JSON(http.StatusOK, gin.H{
			"code": status.OPERATION_SUCCEEDED,
			"msg":  "success",
		})
	} else {
		c.JSON(http.StatusOK, gin.H{
			"code": status.OPEERATION_TARGET_NOT_FOUND,
			"msg":  "failure",
		})
	}

	return nil
}

func EnableFeature(app *app.App, c *gin.Context) error {
	featureName := c.Param("name")
	isSucceeded, err := app.Services().Core().EnableFeature(featureName)
	if err != nil {
		return err
	}
	if isSucceeded {
		c.JSON(http.StatusOK, gin.H{
			"code": status.OPERATION_SUCCEEDED,
			"msg":  "success",
		})
	} else {
		c.JSON(http.StatusOK, gin.H{
			"code": status.OPEERATION_TARGET_NOT_FOUND,
			"msg":  "failure",
		})
	}
	return nil
}

func ChangePluginSequence(app *app.App, c *gin.Context) error {
	var param v1.ChangePluginSequenceParam

	if err := c.ShouldBindJSON(&param); err != nil {
		return err
	}
	err := app.Services().Core().ChangePluginExecutionSequence(param.PluginType, param.BeforeKey, param.AfterKey)
	if err != nil {
		return err
	}

	c.JSON(http.StatusOK, gin.H{
		"code": status.OPERATION_SUCCEEDED,
		"msg":  "success",
	})
	return nil
}

func GetPlugin(app *app.App, c *gin.Context) error {
	pluginKey := c.Param("name")
	plugin, err := app.Services().Feature().GetPlugin(pluginKey)
	if err != nil {
		return err
	}

	c.JSON(http.StatusOK, gin.H{
		"code":    status.OPERATION_SUCCEEDED,
		"msg":     "success",
		"payload": plugin,
	})
	return nil
}

func GetPluginList(app *app.App, c *gin.Context) error {
	pluginType := c.Param("type")

	switch pluginType {
	case featureConst.PLUGIN_TYPE_LIFEHOOK:
	case featureConst.PLUGIN_TYPE_TEMPLATE_TRANSLATOR:
	case featureConst.PLUGIN_TYPE_ACCESS_GATE:
	case featureConst.PLUGIN_TYPE_TEMPLATE_DECORATOR:
	case featureConst.PLUGIN_TYPE_FACTOR_GENERATOR:
	case featureConst.PLUGIN_TYPE_SCHEDULER_BINDER:

	default:
		c.JSON(http.StatusOK, gin.H{
			"code": status.UNSUPPORTED_PLUGIN_TYPE,
			"msg":  fmt.Sprintf("unsupported pluginType %s", pluginType),
		})
		return nil
	}

	where := map[string]interface{}{"type": pluginType}
	apiPlugins, err := app.Services().Feature().GetPluginList(where)
	if err != nil {
		return err
	}

	c.JSON(http.StatusOK, gin.H{
		"code":    status.OPERATION_SUCCEEDED,
		"msg":     "success",
		"payload": apiPlugins,
	})
	return nil
}

func GetFeature(app *app.App, c *gin.Context) error {
	featureName := c.Param("name")
	feature, err := app.Services().Feature().GetFeature(featureName)
	if err != nil {
		return err
	}

	c.JSON(http.StatusOK, gin.H{
		"code":    status.OPERATION_SUCCEEDED,
		"msg":     "success",
		"payload": feature,
	})
	return nil
}

func GetFeatureList(app *app.App, c *gin.Context) error {
	author := c.Param("author")
	where := map[string]interface{}{}
	if strings.ToLower(author) != "all" {
		where["author"] = author
	}

	apiFeatures, err := app.Services().Feature().GetFeatureList(where)
	if err != nil {
		return err
	}

	c.JSON(http.StatusOK, gin.H{
		"code":    status.OPERATION_SUCCEEDED,
		"msg":     "success",
		"payload": apiFeatures,
	})
	return nil
}
