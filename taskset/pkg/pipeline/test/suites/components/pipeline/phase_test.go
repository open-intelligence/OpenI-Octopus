package pipeline

import (
	apiModule "scheduler/pkg/pipeline/apis/module"
	pluginTypes "scheduler/pkg/pipeline/constants/feature"
	mockFeature "scheduler/pkg/pipeline/test/mock/feature"
	"testing"

	jsoniter "github.com/json-iterator/go"
	. "github.com/smartystreets/goconvey/convey"
)

func TestNoTranslatorMatched(t *testing.T) {
	Convey("No translator matched", t, func() {
		done := make(chan string, 0)

		defer close(done)

		ctx := newPhaseTestCtx(nil, done)

		err := ctx.SubmitOneJob(nil)

		So(err, ShouldBeNil)

		reason := <-done

		So(reason, ShouldEqual, PIPELINE_FAILED)

		ctx.Clean()
	})
}

func TestOneTranslatorMatched(t *testing.T) {
	Convey("Match one translator", t, func() {
		done := make(chan string, 0)

		defer close(done)

		ctx := newPhaseTestCtx(nil, done)

		host := "template.phase.pipeline.test"

		feature, err := CreateFeature("onetranslator", host, []string{
			pluginTypes.PLUGIN_TYPE_TEMPLATE_TRANSLATOR,
		})

		So(err, ShouldBeNil)

		err = ctx.BindFeature(host, feature, nil)

		So(err, ShouldBeNil)

		err = ctx.SubmitOneJob(nil)

		So(err, ShouldBeNil)

		reason := <-done

		So(reason, ShouldEqual, PIPELINE_SUCCEEDED)

		ctx.Clean()
	})
}

func TestTranslatedButGotOtherType(t *testing.T) {
	Convey("Translated but got other type", t, func() {

		done := make(chan string, 0)

		defer close(done)

		ctx := newPhaseTestCtx(nil, done)

		//准备两个feature
		host1 := "host1.phase.pipeline.com"

		host2 := "host2.phase.pipeline.com"

		feature1, err := CreateFeature("phasetest1", host1, []string{
			pluginTypes.PLUGIN_TYPE_TEMPLATE_TRANSLATOR,
		})

		So(err, ShouldBeNil)

		err = ctx.BindFeature(host1, feature1, &mockFeature.HandlerFuncs{
			Translator: func(buf []byte) ([]byte, error) {
				job := `{
					"kind":"UserDefinedRuntime2"
				}`
				return []byte(job), nil
			},
		})

		So(err, ShouldBeNil)

		feature2, err := CreateFeature("phasetest2", host2, []string{
			pluginTypes.PLUGIN_TYPE_TEMPLATE_TRANSLATOR,
		})

		So(err, ShouldBeNil)

		feature2.JobSelector.Conditions[0].Expect = "^UserDefinedRuntime2$"

		feature2.Init()

		err = ctx.BindFeature(host2, feature2, nil)

		So(err, ShouldBeNil)

		err = ctx.SubmitOneJob(nil)

		So(err, ShouldBeNil)

		reason := <-done

		So(reason, ShouldEqual, PIPELINE_FAILED)

		ctx.Clean()
	})
}

func TestTooManyTranslatorMatched(t *testing.T) {
	Convey("Too many translator matched", t, func() {
		done := make(chan string, 0)

		defer close(done)

		ctx := newPhaseTestCtx(nil, done)

		//准备两个feature
		host1 := "mt1.phase.pipeline.com"

		host2 := "mt2.phase.pipeline.com"

		feature1, err := CreateFeature("phasetestmt1", host1, []string{
			pluginTypes.PLUGIN_TYPE_TEMPLATE_TRANSLATOR,
		})

		So(err, ShouldBeNil)

		err = ctx.BindFeature(host1, feature1, nil)

		So(err, ShouldBeNil)

		feature2, err := CreateFeature("phasetestmt2", host2, []string{
			pluginTypes.PLUGIN_TYPE_TEMPLATE_TRANSLATOR,
		})

		So(err, ShouldBeNil)

		err = ctx.BindFeature(host2, feature2, nil)

		So(err, ShouldBeNil)

		err = ctx.SubmitOneJob(nil)

		So(err, ShouldBeNil)

		reason := <-done

		So(reason, ShouldEqual, PIPELINE_FAILED)

		ctx.Clean()
	})
}

func TestCantDetectTheKindOfJobWhenTranslate(t *testing.T) {
	Convey("Can't detect the kind of job when translate", t, func() {
		done := make(chan string, 0)

		defer close(done)

		ctx := newPhaseTestCtx(nil, done)

		host := "cd.phase.pipeline.com"

		feature, err := CreateFeature("phasetestcd", host, []string{
			pluginTypes.PLUGIN_TYPE_TEMPLATE_TRANSLATOR,
		})

		So(err, ShouldBeNil)

		err = ctx.BindFeature(host, feature, nil)

		cursor := &apiModule.JobCursor{
			UserID:     "test",
			JobID:      "123",
			Phase:      "",
			PluginDone: map[string]bool{},
			Job:        `{}`,
			Header: `{
				"userID":"test",
				"jobName":"pluginSeq",
				"jobKind":"UserDefinedRuntime",
				"user":{
					"type":"test"
				}
			}`,
			Params:   "{}",
			Submited: false,
		}

		err = ctx.SubmitOneJob(cursor)

		So(err, ShouldBeNil)

		reason := <-done
		//can't detect the kind of job

		So(reason, ShouldEqual, PIPELINE_FAILED)

		ctx.Clean()

	})
}

func TestNoTranslatorButTheJobIsTaskSet(t *testing.T) {
	Convey("No translator ,but the job is taskset", t, func() {
		done := make(chan string, 0)

		defer close(done)

		ctx := newPhaseTestCtx(nil, done)

		cursor := &apiModule.JobCursor{
			UserID:     "test",
			JobID:      "123",
			Phase:      "",
			PluginDone: map[string]bool{},
			Job:        mockFeature.DefaultTaskSet,
			Header: `{
				"userID":"test",
				"jobName":"pluginSeq",
				"jobKind":"UserDefinedRuntime",
				"user":{
					"type":"test"
				}
			}`,
			Params:   "{}",
			Submited: false,
		}

		err := ctx.SubmitOneJob(cursor)

		So(err, ShouldBeNil)

		reason := <-done

		So(reason, ShouldEqual, PIPELINE_SUCCEEDED)

		ctx.Clean()
	})
}

func TestFactorGenerate(t *testing.T) {

	Convey("Factor generate", t, func() {
		done := make(chan string, 0)

		ctx := newPhaseTestCtx(nil, done)

		host := "factor.phase.test"

		feature, err := CreateFeature("phasetestfactor", host, []string{
			pluginTypes.PLUGIN_TYPE_FACTOR_GENERATOR,
			pluginTypes.PLUGIN_TYPE_TEMPLATE_TRANSLATOR,
		})

		So(err, ShouldBeNil)

		err = ctx.BindFeature(host, feature, &mockFeature.HandlerFuncs{
			Factor: func(buf []byte) ([]byte, error) {
				fatcor := `{
					"topic":"factortest",
					"advice":"ok",
					"reason":"recieved"
				}`
				return []byte(fatcor), nil
			},
		})

		So(err, ShouldBeNil)

		host2 := "factor.phase.test2"

		feature2, err := CreateFeature("phasetestfactor2", host2, []string{
			pluginTypes.PLUGIN_TYPE_FACTOR_GENERATOR,
		})

		So(err, ShouldBeNil)

		err = ctx.BindFeature(host2, feature2, &mockFeature.HandlerFuncs{
			Factor: func(buf []byte) ([]byte, error) {
				fatcor := `{
					"topic":"weight",
					"advice":"10",
					"reason":"job of administrator"
				}`
				return []byte(fatcor), nil
			},
		})

		So(err, ShouldBeNil)

		host3 := "factor.phase.test3"

		feature3, err := CreateFeature("phasetestfactor3", host3, []string{
			pluginTypes.PLUGIN_TYPE_ACCESS_GATE,
		})

		So(err, ShouldBeNil)

		var factors string

		err = ctx.BindFeature(host3, feature3, &mockFeature.HandlerFuncs{
			Gate: func(buf []byte) ([]byte, error) {
				factors = jsoniter.Get(buf, "factors").ToString()
				return []byte(`{
					"decision":"pass",
					"reason"："no"
				}`), nil
			},
		})

		So(err, ShouldBeNil)

		err = ctx.SubmitOneJob(nil)

		So(err, ShouldBeNil)

		reason := <-done

		So(reason, ShouldEqual, PIPELINE_SUCCEEDED)

		So(factors, ShouldNotEqual, "")

		So(jsoniter.Get([]byte(factors), "factortest").Size(), ShouldEqual, 1)

		So(jsoniter.Get(
			[]byte(factors), "factortest").Get(0).Get("topic").ToString(),
			ShouldEqual,
			"factortest",
		)

		So(jsoniter.Get(
			[]byte(factors), "factortest").Get(0).Get("advice").ToString(),
			ShouldEqual,
			"ok",
		)
		So(jsoniter.Get(
			[]byte(factors), "factortest").Get(0).Get("reason").ToString(),
			ShouldEqual,
			"recieved",
		)

		So(jsoniter.Get([]byte(factors), "weight").Size(), ShouldEqual, 1)

		So(jsoniter.Get(
			[]byte(factors), "weight").Get(0).Get("topic").ToString(),
			ShouldEqual,
			"weight",
		)

		So(jsoniter.Get(
			[]byte(factors), "weight").Get(0).Get("advice").ToString(),
			ShouldEqual,
			"10",
		)

		ctx.Clean()

	})
}

func TestDecisionPass(t *testing.T) {
	Convey("Decison: pass", t, func() {
		done := make(chan string, 0)

		defer close(done)

		ctx := newPhaseTestCtx(nil, done)

		host := "decisionpass.phase.pipeline.com"

		feature, err := CreateFeature("decisionpass", host, []string{
			pluginTypes.PLUGIN_TYPE_TEMPLATE_TRANSLATOR,
			pluginTypes.PLUGIN_TYPE_ACCESS_GATE,
		})

		So(err, ShouldBeNil)

		err = ctx.BindFeature(host, feature, &mockFeature.HandlerFuncs{
			Gate: func(buf []byte) ([]byte, error) {
				return []byte(`{
					"decision":"pass",
					"reason":"for test"
				}`), nil
			},
		})

		err = ctx.SubmitOneJob(nil)

		So(err, ShouldBeNil)

		reason := <-done

		So(reason, ShouldEqual, PIPELINE_SUCCEEDED)

		ctx.Clean()
	})
}

func TestDecisionSuspend(t *testing.T) {
	Convey("Decison: suspend", t, func() {
		done := make(chan string, 0)

		defer close(done)

		ctx := newPhaseTestCtx(nil, done)

		host := "decisionsuspend.phase.pipeline.com"

		feature, err := CreateFeature("decisionsuspend", host, []string{
			pluginTypes.PLUGIN_TYPE_TEMPLATE_TRANSLATOR,
			pluginTypes.PLUGIN_TYPE_ACCESS_GATE,
		})

		So(err, ShouldBeNil)

		err = ctx.BindFeature(host, feature, &mockFeature.HandlerFuncs{
			Gate: func(buf []byte) ([]byte, error) {
				return []byte(`{
					"decision":"suspend",
					"reason":"for test"
				}`), nil
			},
		})

		err = ctx.SubmitOneJob(nil)

		So(err, ShouldBeNil)

		reason := <-done

		So(reason, ShouldEqual, PIPELINE_SUSPENDED)

		ctx.Clean()
	})
}

func TestDecisionStop(t *testing.T) {
	Convey("Decison: stop", t, func() {
		done := make(chan string, 0)

		defer close(done)

		ctx := newPhaseTestCtx(nil, done)

		host := "decisionstop.phase.pipeline.com"

		feature, err := CreateFeature("decisionstop", host, []string{
			pluginTypes.PLUGIN_TYPE_TEMPLATE_TRANSLATOR,
			pluginTypes.PLUGIN_TYPE_ACCESS_GATE,
		})

		So(err, ShouldBeNil)

		err = ctx.BindFeature(host, feature, &mockFeature.HandlerFuncs{
			Gate: func(buf []byte) ([]byte, error) {
				return []byte(`{
					"decision":"stop",
					"reason":"for test"
				}`), nil
			},
		})

		err = ctx.SubmitOneJob(nil)

		So(err, ShouldBeNil)

		reason := <-done

		So(reason, ShouldEqual, PIPELINE_STOPPED)

		ctx.Clean()
	})
}

func TestNormalDecorate(t *testing.T) {
	Convey("Decorate successfully", t, func() {
		done := make(chan string, 0)

		defer close(done)

		ctx := newPhaseTestCtx(nil, done)

		host := "decoratesuccess.phase.pipeline.com"

		feature, err := CreateFeature("decoratesuccess", host, []string{
			pluginTypes.PLUGIN_TYPE_TEMPLATE_TRANSLATOR,
			pluginTypes.PLUGIN_TYPE_TEMPLATE_DECORATOR,
		})

		So(err, ShouldBeNil)

		err = ctx.BindFeature(host, feature, &mockFeature.HandlerFuncs{
			Decorator: func(buf []byte) ([]byte, error) {
				taskset := `{"apiVersion":"octopus.openi.pcl.cn/v1alpha1","kind":"TaskSet","metadata":{"name":"test","namespace":"default","annotations":{"key1":"value1","key2":"value2"}},"spec":{"retryPolicy":{"maxRetryCount":0,"retry":false},"roles":[{"completionPolicy":{"maxFailed":1,"minSucceeded":1},"eventPolicy":[],"name":"default","replicas":1,"retryPolicy":{"maxRetryCount":0,"retry":false},"template":{"spec":{"containers":[{"command":["sh","-c","sleep 20;exit 0"],"image":"busybox","name":"busybox"}],"restartPolicy":"Never"}}}]}}`
				return []byte(taskset), nil
			},
		})

		err = ctx.SubmitOneJob(nil)

		So(err, ShouldBeNil)

		reason := <-done

		So(reason, ShouldEqual, PIPELINE_SUCCEEDED)

		ctx.Clean()
	})
}

func TestDecorateButChangedExistedKey(t *testing.T) {
	Convey("Decorate taskset and do some change on old existed key", t, func() {
		done := make(chan string, 0)

		defer close(done)

		ctx := newPhaseTestCtx(nil, done)

		host := "decoratechange.phase.pipeline.com"

		feature, err := CreateFeature("decoratechange", host, []string{
			pluginTypes.PLUGIN_TYPE_TEMPLATE_TRANSLATOR,
			pluginTypes.PLUGIN_TYPE_TEMPLATE_DECORATOR,
		})

		So(err, ShouldBeNil)

		err = ctx.BindFeature(host, feature, &mockFeature.HandlerFuncs{
			Decorator: func(buf []byte) ([]byte, error) {
				taskset := `{"apiVersion":"octopus.openi.pcl.cn/v1alpha1","kind":"TaskSet","metadata":{"name":"test","namespace":"kube-system","annotations":{"key1":"value1","key2":"value2"}},"spec":{"retryPolicy":{"maxRetryCount":0,"retry":false},"roles":[{"completionPolicy":{"maxFailed":1,"minSucceeded":1},"eventPolicy":[],"name":"default","replicas":1,"retryPolicy":{"maxRetryCount":0,"retry":false},"template":{"spec":{"containers":[{"command":["sh","-c","sleep 20;exit 0"],"image":"busybox","name":"busybox"}],"restartPolicy":"Never"}}}]}}`
				return []byte(taskset), nil
			},
		})

		err = ctx.SubmitOneJob(nil)

		So(err, ShouldBeNil)

		reason := <-done

		So(reason, ShouldEqual, PIPELINE_FAILED)

		ctx.Clean()
	})
}

func TestAppendCommand(t *testing.T) {
	Convey("Decorate: append command", t, func() {
		Convey("Inline append", func() {
			done := make(chan string, 0)

			defer close(done)

			ctx := newPhaseTestCtx(nil, done)

			host := "decoratechange.phase.pipeline.com"

			feature, err := CreateFeature("decoratechange", host, []string{
				pluginTypes.PLUGIN_TYPE_TEMPLATE_TRANSLATOR,
				pluginTypes.PLUGIN_TYPE_TEMPLATE_DECORATOR,
			})

			So(err, ShouldBeNil)

			err = ctx.BindFeature(host, feature, &mockFeature.HandlerFuncs{
				Decorator: func(buf []byte) ([]byte, error) {
					taskset := `{
							"apiVersion":"octopus.openi.pcl.cn/v1alpha1",
							"kind":"TaskSet",
							"metadata":{"name":"test","namespace":"default"},
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
							}`
					return []byte(taskset), nil
				},
			})

			err = ctx.SubmitOneJob(nil)

			So(err, ShouldBeNil)

			reason := <-done

			So(reason, ShouldEqual, PIPELINE_SUCCEEDED)

			ctx.Clean()
		})

		Convey("Insert command", func() {
			done := make(chan string, 0)

			defer close(done)

			ctx := newPhaseTestCtx(nil, done)

			host := "decoratechange.phase.pipeline.com"

			feature, err := CreateFeature("decoratechange", host, []string{
				pluginTypes.PLUGIN_TYPE_TEMPLATE_TRANSLATOR,
				pluginTypes.PLUGIN_TYPE_TEMPLATE_DECORATOR,
			})

			So(err, ShouldBeNil)

			err = ctx.BindFeature(host, feature, &mockFeature.HandlerFuncs{
				Decorator: func(buf []byte) ([]byte, error) {
					taskset := `{
							"apiVersion":"octopus.openi.pcl.cn/v1alpha1",
							"kind":"TaskSet",
							"metadata":{"name":"test","namespace":"default"},
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
														"command":["sh","-c","echo hello","sleep 20;exit 0"],
														"image":"busybox",
														"name":"busybox"
													}],
													"restartPolicy":"Never"
												}
											}
										}
									]
								}
							}`
					return []byte(taskset), nil
				},
			})

			err = ctx.SubmitOneJob(nil)

			So(err, ShouldBeNil)

			reason := <-done

			So(reason, ShouldEqual, PIPELINE_SUCCEEDED)

			ctx.Clean()
		})

		Convey("Old command removed", func() {
			done := make(chan string, 0)

			defer close(done)

			ctx := newPhaseTestCtx(nil, done)

			host := "decoratechange.phase.pipeline.com"

			feature, err := CreateFeature("decoratechange", host, []string{
				pluginTypes.PLUGIN_TYPE_TEMPLATE_TRANSLATOR,
				pluginTypes.PLUGIN_TYPE_TEMPLATE_DECORATOR,
			})

			So(err, ShouldBeNil)

			err = ctx.BindFeature(host, feature, &mockFeature.HandlerFuncs{
				Decorator: func(buf []byte) ([]byte, error) {
					taskset := `{
							"apiVersion":"octopus.openi.pcl.cn/v1alpha1",
							"kind":"TaskSet",
							"metadata":{"name":"test","namespace":"default"},
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
														"command":["sh","-c","echo hello;exit 0"],
														"image":"busybox",
														"name":"busybox"
													}],
													"restartPolicy":"Never"
												}
											}
										}
									]
								}
							}`
					return []byte(taskset), nil
				},
			})

			err = ctx.SubmitOneJob(nil)

			So(err, ShouldBeNil)

			reason := <-done

			So(reason, ShouldEqual, PIPELINE_FAILED)

			ctx.Clean()
		})
	})
}

func TestTooManySchedulerBinderMatched(t *testing.T) {
	Convey("Too many schedulerbinder matched", t, func() {
		done := make(chan string, 0)

		defer close(done)

		ctx := newPhaseTestCtx(nil, done)

		//准备两个feature
		host1 := "scb1.phase.pipeline.com"

		host2 := "scb2.phase.pipeline.com"

		feature1, err := CreateFeature("phasetestscb1", host1, []string{
			pluginTypes.PLUGIN_TYPE_SCHEDULER_BINDER,
		})

		So(err, ShouldBeNil)

		err = ctx.BindFeature(host1, feature1, nil)

		So(err, ShouldBeNil)

		feature2, err := CreateFeature("phasetestscb2", host2, []string{
			pluginTypes.PLUGIN_TYPE_SCHEDULER_BINDER,
		})

		So(err, ShouldBeNil)

		err = ctx.BindFeature(host2, feature2, nil)

		So(err, ShouldBeNil)
		cursor := &apiModule.JobCursor{
			UserID:     "test",
			JobID:      "123",
			Phase:      "",
			PluginDone: map[string]bool{},
			Job:        mockFeature.DefaultTaskSet,
			Header: `{
				"userID":"test",
				"jobName":"pluginSeq",
				"jobKind":"UserDefinedRuntime",
				"user":{
					"type":"test"
				}
			}`,
			Params:   "{}",
			Submited: false,
		}

		err = ctx.SubmitOneJob(cursor)

		So(err, ShouldBeNil)

		reason := <-done

		So(reason, ShouldEqual, PIPELINE_FAILED)

		ctx.Clean()
	})
}

func TestBindScheduler(t *testing.T) {
	Convey("Bind scheduler", t, func() {
		done := make(chan string, 0)

		defer close(done)

		ctx := newPhaseTestCtx(nil, done)

		host := "schedulerbind.phase.pipeline.com"

		feature, err := CreateFeature("schedulerbind", host, []string{
			pluginTypes.PLUGIN_TYPE_SCHEDULER_BINDER,
			pluginTypes.PLUGIN_TYPE_TEMPLATE_TRANSLATOR,
		})

		So(err, ShouldBeNil)

		err = ctx.BindFeature(host, feature, &mockFeature.HandlerFuncs{
			SchedulerBinder: func(buf []byte) ([]byte, error) {
				taskset := `{
						"apiVersion":"octopus.openi.pcl.cn/v1alpha1",
						"kind":"TaskSet",
						"metadata":{"name":"test","namespace":"default"},
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
											"schedulerName":"myscheduler",
											"containers":[
												{
													"command":["sh","-c","sleep 20;exit 0"],
													"image":"busybox",
													"name":"busybox"
												}],
												"restartPolicy":"Never"
											}
										}
									}
								]
							}
						}`
				return []byte(taskset), nil
			},
		})

		err = ctx.SubmitOneJob(nil)

		So(err, ShouldBeNil)

		reason := <-done

		So(reason, ShouldEqual, PIPELINE_SUCCEEDED)

		ctx.Clean()
	})
}

func TestBindSchedulerButModifiedExistedKey(t *testing.T) {
	Convey("Bind scheduler but modified existed key", t, func() {
		done := make(chan string, 0)

		defer close(done)

		ctx := newPhaseTestCtx(nil, done)

		host := "scbm.phase.pipeline.com"

		feature, err := CreateFeature("scbm", host, []string{
			pluginTypes.PLUGIN_TYPE_SCHEDULER_BINDER,
			pluginTypes.PLUGIN_TYPE_TEMPLATE_TRANSLATOR,
		})

		So(err, ShouldBeNil)

		err = ctx.BindFeature(host, feature, &mockFeature.HandlerFuncs{
			SchedulerBinder: func(buf []byte) ([]byte, error) {
				taskset := `{
						"apiVersion":"octopus.openi.pcl.cn/v1alpha1",
						"kind":"TaskSet",
						"metadata":{"name":"test","namespace":"default"},
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
									"name":"notdefault",
									"replicas":1,
									"retryPolicy":{
										"maxRetryCount":0,
										"retry":false
									},
									"template":{
										"spec":{
											"schedulerName":"myscheduler",
											"containers":[
												{
													"command":["sh","-c","sleep 20;exit 0"],
													"image":"busybox",
													"name":"busybox"
												}],
												"restartPolicy":"Never"
											}
										}
									}
								]
							}
						}`
				return []byte(taskset), nil
			},
		})

		err = ctx.SubmitOneJob(nil)

		So(err, ShouldBeNil)

		reason := <-done

		So(reason, ShouldEqual, PIPELINE_FAILED)

		ctx.Clean()
	})
}
