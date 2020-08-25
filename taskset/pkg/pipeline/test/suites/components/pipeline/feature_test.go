package pipeline

import (
	"fmt"
	api "scheduler/pkg/pipeline/apis/common"
	apiModule "scheduler/pkg/pipeline/apis/module"
	libPipeline "scheduler/pkg/pipeline/components/pipeline"
	pluginTypes "scheduler/pkg/pipeline/constants/feature"
	mockFeature "scheduler/pkg/pipeline/test/mock/feature"
	mockHttp "scheduler/pkg/pipeline/test/mock/http"
	"sync"
	"testing"

	jsoniter "github.com/json-iterator/go"
	. "github.com/smartystreets/goconvey/convey"
)

func TestFeatureOperations(t *testing.T) {
	wg := sync.WaitGroup{}

	pipeline := createPipeline(nil)

	wg.Add(1)

	go func() {
		pipeline.Run()
		wg.Done()
	}()

	selector := `{
		"conditions":[
			{
				"name":"usertype",
				"key":"user.type",
				"expect":"admin"
			}
		],
		"expression":"usertype"
	}`

	f := `{
		"jobSelector":` + selector + `,
		"plugins":[ 
			{
				"pluginType":"` + pluginTypes.PLUGIN_TYPE_ACCESS_GATE + `", 
				"callAddress":"chan1", 
				"description":"hello"
			}
		],
		"name":"user", 
		"author":"yyrdl",
		"Authorization":"123"
	}`

	Convey("Test feature operations", t, func() {

		feature, err := compileFeature(f)

		feature.Enabled = false

		So(err, ShouldBeNil)

		Convey("Add feature", func() {
			err = pipeline.UpsertFeature(feature)
			So(err, ShouldBeNil)
			for i := 0; i < len(feature.Plugins); i++ {
				plugin := pipeline.GetPlugin(feature.Plugins[i].PluginType, feature.Plugins[i].Key)
				So(plugin, ShouldNotBeNil)
				So(plugin.GetFeature(), ShouldEqual, feature.Name)
				So(plugin.GetAuthorization(), ShouldEqual, feature.Authorization)
				So(plugin.GetCallback(), ShouldEqual, feature.Plugins[i].CallAddress)
				st, err := compileSelector(selector)
				So(err, ShouldBeNil)
				So(plugin.GetSelector().ToJSONString(), ShouldEqual, st.ToJSONString())
				So(plugin.GetExecutionSequence(), ShouldEqual, 0)
			}

		})

		Convey("Enable feature", func() {
			err = pipeline.EnableFeature(feature.Name)
			So(err, ShouldBeNil)
			fCopy := &api.Feature{}
			err = jsoniter.UnmarshalFromString(f, fCopy)
			So(err, ShouldBeNil)
			fCopy.Init()
			err = pipeline.SyncFeatureStatus(fCopy)
			So(err, ShouldBeNil)
			So(fCopy.Enabled, ShouldEqual, true)
		})

		Convey("Disable feature", func() {
			err = pipeline.DisableFeature(feature.Name)
			So(err, ShouldBeNil)
			fCopy := &api.Feature{}
			err = jsoniter.UnmarshalFromString(f, fCopy)
			So(err, ShouldBeNil)
			fCopy.Init()
			fCopy.Enabled = true
			err = pipeline.SyncFeatureStatus(fCopy)
			So(err, ShouldBeNil)
			So(fCopy.Enabled, ShouldEqual, false)
		})

		Convey("Update feature", func() {
			featureStr := `{
				"jobSelector":` + selector + `,
				"plugins":[ 
					{
						"pluginType":"` + pluginTypes.PLUGIN_TYPE_ACCESS_GATE + `", 
						"callAddress":"chan1", 
						"description":"hello"
					},{
						"pluginType":"` + pluginTypes.PLUGIN_TYPE_TEMPLATE_TRANSLATOR + `",
						"callAddress":"chan2",
						"description":"hello"
					}
				],
				"name":"user", 
				"author":"yyrdl",
				"Authorization":"123"
			}`
			newF, err := compileFeature(featureStr)
			So(err, ShouldBeNil)
			err = pipeline.UpsertFeature(newF)
			So(err, ShouldBeNil)
			st, err := compileSelector(selector)
			So(err, ShouldBeNil)
			So(len(newF.Plugins), ShouldEqual, 2)
			for i := 0; i < len(newF.Plugins); i++ {
				plugin := pipeline.GetPlugin(newF.Plugins[i].PluginType, newF.Plugins[i].Key)
				So(plugin, ShouldNotBeNil)
				So(plugin.GetFeature(), ShouldEqual, newF.Name)
				So(plugin.GetAuthorization(), ShouldEqual, newF.Authorization)
				So(plugin.GetCallback(), ShouldEqual, newF.Plugins[i].CallAddress)
				So(plugin.GetSelector().ToJSONString(), ShouldEqual, st.ToJSONString())
				So(plugin.GetExecutionSequence(), ShouldEqual, 0)
			}
		})

	})

	pipeline.Shutdown()
	wg.Wait()
}

func TestPluginSequence(t *testing.T) {
	wg := sync.WaitGroup{}

	pipeline := createPipeline(nil)

	wg.Add(1)

	go func() {
		pipeline.Run()
		wg.Done()
	}()

	Convey("Plugin sequence", t, func() {
		host := "test.pipeline.com"
		features, err := generateFeatures(10, host, "test")
		So(err, ShouldBeNil)

		for i := 0; i < len(features); i++ {
			err = pipeline.UpsertFeature(features[i])
			So(err, ShouldBeNil)
		}

		Convey("Change plugin sequence", func() {
			p1 := features[3].Plugins[3]
			p2 := features[7].Plugins[3]
			So(p1.PluginType, ShouldEqual, p2.PluginType)
			p1S := pipeline.GetPlugin(p1.PluginType, p1.Key).GetExecutionSequence()
			p2S := pipeline.GetPlugin(p2.PluginType, p2.Key).GetExecutionSequence()

			err = pipeline.ChangePluginExecutionSequence(p1.PluginType, p2.Key, p1.Key)

			So(err, ShouldBeNil)
			p1SS := pipeline.GetPlugin(p1.PluginType, p1.Key).GetExecutionSequence()
			p2SS := pipeline.GetPlugin(p2.PluginType, p2.Key).GetExecutionSequence()

			So(p1S, ShouldEqual, p2SS)
			So(p2S, ShouldEqual, p1SS)
		})

		Convey("Change plugin sequence with different plugin", func() {
			p1 := features[3].Plugins[3]
			p2 := features[7].Plugins[4]
			So(p1.PluginType, ShouldNotEqual, p2.PluginType)

			err = pipeline.ChangePluginExecutionSequence(p1.PluginType, p2.Key, p1.Key)

			So(err, ShouldNotBeNil)
		})

		Convey("Confirm plugin sequence", func() {
			amount := 10

			services := mockHttp.Inject()

			featureList := make([]*api.Feature, amount)

			featureImps := make([]*mockFeature.FeatureImp, amount)

			results := make(chan string, 0)

			defer close(results)

			accessGateBuilder := func(host string) func([]byte) ([]byte, error) {
				return func(buf []byte) ([]byte, error) {
					results <- host
					decision := `{
						"decision":"pass",
						"reason":"no special rule",
					}`
					return []byte(decision), nil
				}
			}

			for i := 0; i < amount; i++ {

				host := fmt.Sprintf("test%d.seq.pipeline.com", i)

				f, err := generateFeatures(1, host, "seqtest")

				So(err, ShouldBeNil)

				if 0 != i {
					f[0].Plugins = f[0].Plugins[1:2]
				}

				f[0].JobSelector.Conditions[1].Expect = "^seqtest$"
				f[0].Name = fmt.Sprintf("seqtest%d", i)
				f[0].Init()

				featureList[i] = f[0]

				imp := &mockFeature.FeatureImp{
					Host:    host,
					Feature: f[0],
					HandlerFuncs: &mockFeature.HandlerFuncs{
						Gate: accessGateBuilder(host),
					},
				}

				imp.BindEndpoints()

				err = pipeline.UpsertFeature(f[0])

				So(err, ShouldBeNil)

				err = pipeline.EnableFeature(f[0].Name)

				So(err, ShouldBeNil)

				services.AddService(imp.BuildHttpService())

				featureImps[i] = imp
			}

			cursor := &apiModule.JobCursor{
				UserID:     "test",
				JobID:      "123",
				Phase:      "",
				PluginDone: map[string]bool{},
				Job: `{
					"kind":"UserDefinedRuntime"
				}`,
				Header: `{
					"userID":"test",
					"jobName":"pluginSeq",
					"jobKind":"UserDefinedRuntime",
					"user":{
						"type":"seqtest"
					}
				}`,
				Params:   "{}",
				Submited: false,
			}

			workpiece, err := libPipeline.NewWorkpieceFromJobCursor(cursor)

			So(err, ShouldBeNil)

			p1 := featureList[3].Plugins[0]
			p2 := featureList[7].Plugins[0]
			So(p1.PluginType, ShouldEqual, p2.PluginType)

			err = pipeline.ChangePluginExecutionSequence(p1.PluginType, p1.Key, p2.Key)

			So(err, ShouldBeNil)

			featureImps[3], featureImps[7] = featureImps[7], featureImps[3]

			done := make(chan bool, 0)

			defer close(done)

			pipeline.AddWorkpiece(workpiece)

			go func() {
				index := 0
				flag := true
				for {
					if false == flag || index >= amount {
						break
					}

					host := <-results

					if host != featureImps[index].Host {
						flag = false
						break
					} else {
						index++
					}
				}
				done <- flag
			}()

			flag := <-done

			So(flag, ShouldEqual, true)
		})
	})

	pipeline.Shutdown()
	wg.Wait()
}
