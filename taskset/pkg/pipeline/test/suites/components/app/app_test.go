package app

import (
	"fmt"
	api "scheduler/pkg/pipeline/apis/common"
	libApp "scheduler/pkg/pipeline/app"
	pluginTypes "scheduler/pkg/pipeline/constants/feature"
	"scheduler/pkg/pipeline/constants/jobstate"
	"scheduler/pkg/pipeline/constants/statusphrase"
	mockFeature "scheduler/pkg/pipeline/test/mock/feature"
	pipelineTest "scheduler/pkg/pipeline/test/suites/components/pipeline"
	helper "scheduler/pkg/pipeline/test/suites/helper"
	"testing"
	"time"

	jsoniter "github.com/json-iterator/go"
	. "github.com/smartystreets/goconvey/convey"
)

func buildFactorHandler(name string) func([]byte) ([]byte, error) {
	return func(buf []byte) ([]byte, error) {
		time.Sleep(1 * time.Second)

		fatcor := `{
			"topic":"factortrack",
			"advice":"` + name + `",
			"reason":"no"
		}`
		return []byte(fatcor), nil
	}
}

func submitJob(jobName string, app *libApp.App) ([]byte, error) {
	job := `{
		"userID":"yyrdl",
		"jobKind":"UserDefinedRuntime",
		"jobName":"` + jobName + `",
		"header":{
			"user":{
				"type":"test"
			}
		},
		  "job":{
			"apiVersion":"octopus.openi.pcl.cn/v1alpha1",
			"kind":"TaskSet",
			"metadata":{"name":"` + jobName + `","namespace":"default"},
			"spec":{
				"retryPolicy":{
					"maxRetryCount":0,
					"retry":false
					},
				"roles":[
					{
						"completionPolicy":{
							"maxFailed":1,
							"minSucceeded":1
						},
						"eventPolicy":[],
						"name":"default",
						"replicas":1,
						"retryPolicy":{
							"maxRetryCount":0,
							"retry":false
						},
						"template":{
							"spec":{
								"containers":[
									{
										"command":["sh","-c","echo hello;sleep 20;exit 0"],
										"image":"busybox",
										"name":"busybox"
									}],
									"restartPolicy":"Never"
								}
							}
						}
					]
				}
		}
	}`

	return helper.Request(app, "POST", "/v1/job/", job)
}

func getFeature(name string, app *libApp.App) ([]byte, error) {
	url := fmt.Sprintf("/v1/features/detail/%s", name)
	return helper.Request(app, "GET", url, "")
}

func waitJobsStatus(key string, ctx *appTestCtx, counter *jobCounter, states []string) error {
	host := fmt.Sprintf("%s.app.test", key)

	f, err := pipelineTest.CreateFeature(key, host, []string{
		pluginTypes.PLUGIN_TYPE_LIFEHOOK,
	})

	if nil != err {
		return err
	}

	err = ctx.BindFeature(host, f, &mockFeature.HandlerFuncs{
		LifeHook: func(buf []byte) ([]byte, error) {

			id := jsoniter.Get(buf, "id").ToString()

			cstate := jsoniter.Get(buf, "currentState").ToString()

			for _, v := range states {
				if v == cstate {
					counter.ReportJob(id)
					break
				}
			}
			return []byte("ok"), nil
		},
	})

	return err
}

func TestRestart(t *testing.T) {
	removeOldDB()
	Convey("Recover when app restart", t, func() {

		jobAmount := 10

		counter := newJobCounter(jobAmount, 100)

		ctx := newAppTestCtx()

		err := ctx.Run()

		So(err, ShouldBeNil)

		featureAmount := 10

		featureStore := map[string]*api.Feature{}

		for i := 0; i < featureAmount; i++ {
			name := fmt.Sprintf("f%d", i)
			host := fmt.Sprintf("%s.app.test", name)
			f, err := pipelineTest.CreateFeature(name, host, []string{
				pluginTypes.PLUGIN_TYPE_FACTOR_GENERATOR,
			})
			So(err, ShouldBeNil)
			featureStore[name] = f
			err = ctx.BindFeature(host, f, &mockFeature.HandlerFuncs{
				Factor: buildFactorHandler(name),
			})
			f.Enabled = true
		}

		err = waitJobsStatus("w1", ctx, counter, []string{
			jobstate.SUCCEEDED,
			jobstate.FAILED,
		})

		So(err, ShouldBeNil)

		for i := 0; i < jobAmount; i++ {

			name := fmt.Sprintf("apptestjob%d", i)

			buf, err := submitJob(name, ctx.App)
			So(err, ShouldBeNil)

			code := jsoniter.Get(buf, "code").ToString()

			So(code, ShouldEqual, statusphrase.OPERATION_SUCCEEDED)

			jobID := jsoniter.Get(buf, "payload").Get("jobID").ToString()

			So(jobID, ShouldNotBeBlank)
		}

		time.Sleep(2 * time.Second)

		ctx.App.Shutdown()

		time.Sleep(10 * time.Second)

		ctx = newAppTestCtx()

		err = ctx.Run()

		So(err, ShouldBeNil)

		for k := range featureStore {

			buf, err := getFeature(k, ctx.App)

			So(err, ShouldBeNil)

			code := jsoniter.Get(buf, "code").ToString()

			So(code, ShouldEqual, statusphrase.OPERATION_SUCCEEDED)

			enabled := jsoniter.Get(buf, "payload").Get("enabled").ToBool()

			So(enabled, ShouldEqual, true)
		}

		result := <-counter.Done()

		So(result, ShouldEqual, "success")

		ctx.Clean()

	})
}
