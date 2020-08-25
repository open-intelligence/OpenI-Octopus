package router

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
	"scheduler/pkg/pipeline/app"
	v1C "scheduler/pkg/pipeline/controllers/v1"

	"scheduler/pkg/pipeline/constants/authority"

	"github.com/gin-gonic/gin"
)

func Router(app *app.App) *gin.Engine {

	d := genDecorateFunc(app)

	router := gin.Default()

	v1 := router.Group("/v1")
	{
		token := v1.Group("/tokens")
		{
			token.POST("/", d(authority.ADMIN, v1C.CreateToken))
			token.DELETE("/", d(authority.ADMIN, v1C.DeleteToken))
			token.PUT("/admin", d(authority.ADMIN, v1C.ChangeAdminToken))
			token.PUT("/normal", d(authority.ADMIN, v1C.UpdateTokenPrivilege))
		}

		feature := v1.Group("/features")
		{
			feature.POST("/", d(authority.WRITE_FEATURE, v1C.UpsertFeature))
			feature.DELETE("/:name", d(authority.WRITE_FEATURE, v1C.DeleteFeature))
			feature.GET("/detail/:name", d(authority.READ_FEATURE, v1C.GetFeature))
			feature.GET("/list/:author", d(authority.READ_FEATURE, v1C.GetFeatureList))
			feature.PUT("/turn-off/:name", d(authority.WRITE_FEATURE, v1C.DisableFeature))
			feature.PUT("/turn-on/:name", d(authority.WRITE_FEATURE, v1C.EnableFeature))
		}

		plugin := v1.Group("/plugins")
		{
			plugin.GET("/detail/:name", d(authority.READ_FEATURE, v1C.GetPlugin))
			plugin.GET("/list/:type", d(authority.READ_FEATURE, v1C.GetPluginList))
			plugin.PUT("/sequence", d(authority.WRITE_FEATURE, v1C.ChangePluginSequence))
		}

		job := v1.Group("/job")
		{
			job.POST("/", d(authority.WRITE_JOB, v1C.SubmitJob))

			job.PUT("/stop/:job", d(authority.WRITE_JOB, v1C.StopJob))
			job.PUT("/resume/:job", d(authority.WRITE_JOB, v1C.ResumeJob))

			job.GET("/config/:job", d(authority.READ_JOB, v1C.GetJobConfig))
			job.GET("/taskset/:job", d(authority.READ_JOB, v1C.GetJobTaskSet))
			job.GET("/detail/:job", d(authority.READ_JOB, v1C.GetJobDetail))

			job.GET("/list", d(authority.READ_JOB, v1C.GetJobList))
			job.GET("/count", d(authority.READ_JOB, v1C.GetJobCount))
		}

	}

	return router
}
