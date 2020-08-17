package v1

import (
	"fmt"
	api "scheduler/pkg/pipeline/apis/common"
	libLifeHook "scheduler/pkg/pipeline/components/lifehook"
	featureConst "scheduler/pkg/pipeline/constants/feature"
	"scheduler/pkg/pipeline/constants/jobstate"
	mockFeature "scheduler/pkg/pipeline/test/mock/feature"
	mockHttp "scheduler/pkg/pipeline/test/mock/http"
	"scheduler/pkg/pipeline/test/suites/helper"
	v1 "scheduler/pkg/pipeline/test/suites/helper/v1"
	"scheduler/pkg/pipeline/utils"
	stringUtils "scheduler/pkg/pipeline/utils/slice"
	"testing"
	"time"

	jsoniter "github.com/json-iterator/go"
	. "github.com/smartystreets/goconvey/convey"
)

func TestHookSucceededEventWithAckOk(t *testing.T) {
	Convey("Hook events has succeeded with ACK OK", t, func() {
		jobMocker := helper.CreateRandomJobMocker()
		jobMocker.Job = `{
				"userID":"tester",
				"jobKind":"` + jobMocker.JobKind + `",
				"jobName":"TestLifeHookReceiveEvents_` + jobMocker.Version + `",
				"header":{
					"mockCommand":"mustSucceeded",
					"jobKind":"` + jobMocker.JobKind + `"
				},
				"job":{"kind":"` + jobMocker.JobKind + `"}
			}`

		var jobProgress libLifeHook.TaskStatesProgressValue
		var currentProgress = libLifeHook.TaskStatesProgressPending
		var hookCb helper.TestHookCallback = func(host string, events []byte, feature *api.Feature, stopChan chan int) (bytes []byte, err error) {
			eventName := jsoniter.Get(events, "currentState").ToString()
			Convey("Receive Events", t, func() {
				So(eventName, ShouldBeIn, libLifeHook.TaskStates)
				So(libLifeHook.TaskStatesProgresses[eventName], ShouldEqual, currentProgress)
				currentProgress = currentProgress << 1
				jobProgress |= libLifeHook.TaskStatesProgresses[eventName]

				// job event must be full when it is completed
				if stringUtils.HasString(libLifeHook.TaskStatesCompleted, eventName) {
					So(eventName, ShouldEqual, jobstate.SUCCEEDED)
					So(jobProgress&libLifeHook.TaskStatesProgressCompleted, ShouldEqual, libLifeHook.TaskStatesProgressCompleted)
				}
			})
			return []byte(libLifeHook.LifeHookPairAckOK), nil
		}

		var cb helper.TestSceneCallback = func(jobId string, job string, feature *api.Feature) {
			feature.Init()
			isActiveJobHook := helper.GetApp().Services().LifeHook().IsActiveJobHook(jobId, feature.Plugins[len(feature.Plugins)-1])
			So(isActiveJobHook, ShouldEqual, false)
		}

		err := helper.MockHookScene(jobMocker, time.After(time.Duration(10*time.Second)), hookCb, cb)
		So(err, ShouldBeNil)
	})
}

func TestHookFailedEventWithAckOk(t *testing.T) {
	Convey("Hook events has failed with ACK OK", t, func() {
		jobMocker := helper.CreateRandomJobMocker()
		jobMocker.Job = `{
				"userID":"tester",
				"jobKind":"` + jobMocker.JobKind + `",
				"jobName":"TestLifeHookReceiveEvents_` + jobMocker.Version + `",
				"header":{
					"mockCommand":"mustFailed",
					"jobKind":"` + jobMocker.JobKind + `"
				},
				"job":{"kind":"` + jobMocker.JobKind + `"}
			}`

		var jobProgress libLifeHook.TaskStatesProgressValue
		var currentProgress = libLifeHook.TaskStatesProgressPending
		var hookCb helper.TestHookCallback = func(host string, events []byte, feature *api.Feature, stopChan chan int) (bytes []byte, err error) {
			eventName := jsoniter.Get(events, "currentState").ToString()
			Convey("Receive Events", t, func() {
				So(eventName, ShouldBeIn, libLifeHook.TaskStates)
				So(libLifeHook.TaskStatesProgresses[eventName], ShouldEqual, currentProgress)
				currentProgress = currentProgress << 1
				jobProgress |= libLifeHook.TaskStatesProgresses[eventName]

				// job event must be full when it is completed
				if stringUtils.HasString(libLifeHook.TaskStatesCompleted, eventName) {
					So(eventName, ShouldEqual, jobstate.FAILED)
					So(jobProgress&libLifeHook.TaskStatesProgressCompleted, ShouldEqual, libLifeHook.TaskStatesProgressCompleted)
				}
			})
			return []byte(libLifeHook.LifeHookPairAckOK), nil
		}

		var cb helper.TestSceneCallback = func(jobId string, job string, feature *api.Feature) {
			feature.Init()
			isActiveJobHook := helper.GetApp().Services().LifeHook().IsActiveJobHook(jobId, feature.Plugins[len(feature.Plugins)-1])
			So(isActiveJobHook, ShouldEqual, false)
		}

		err := helper.MockHookScene(jobMocker, time.After(time.Duration(5*time.Second)), hookCb, cb)
		So(err, ShouldBeNil)
	})
}

func TestHookFocusOneEventWithAckOk(t *testing.T) {
	Convey("Hook focus one events with ACK OK", t, func() {
		var jobProgress libLifeHook.TaskStatesProgressValue
		var receiveCount int
		var focusStates = []string{jobstate.SUCCEEDED}         // jobstate.PENDING, jobstate.RUNNING ,
		focusResult := libLifeHook.TaskStatesProgressSucceeded // libLifeHook.TaskStatesProgressRunning | libLifeHook.TaskStatesProgressPending |
		var hookCb helper.TestHookCallback = func(host string, events []byte, feature *api.Feature, stopChan chan int) (bytes []byte, err error) {
			eventName := jsoniter.Get(events, "currentState").ToString()
			Convey("Receive focus Events", t, func() {
				So(eventName, ShouldBeIn, focusStates)
				receiveCount += 1
				jobProgress |= libLifeHook.TaskStatesProgresses[eventName]

				if len(focusStates) == receiveCount {
					So(jobProgress, ShouldEqual, focusResult)
					if focusResult&libLifeHook.TaskStatesProgressSucceeded < 1 {
						close(stopChan)
					}
				}
			})
			return []byte(libLifeHook.LifeHookPairAckOK), nil
		}

		var cb helper.TestSceneCallback = func(jobId string, job string, feature *api.Feature) {
			feature.Init()
			isActiveJobHook := helper.GetApp().Services().LifeHook().IsActiveJobHook(jobId, feature.Plugins[len(feature.Plugins)-1])
			So(isActiveJobHook, ShouldEqual, false)
		}

		jobMocker := helper.CreateRandomJobMocker()
		jobMocker.Job = `{
				"userID":"tester",
				"jobKind":"` + jobMocker.JobKind + `",
				"jobName":"TestLifeHookReceiveEvents_` + jobMocker.Version + `",
				"header":{
					"mockCommand":"mustSucceeded",
					"jobKind":"` + jobMocker.JobKind + `"
				},
				"job":{"kind":"` + jobMocker.JobKind + `"}
			}`
		jobMocker.JobSelector.States = focusStates
		err := helper.MockHookScene(jobMocker, time.After(time.Duration(50*time.Second)), hookCb, cb)
		So(err, ShouldBeNil)
	})
}

func TestHookFocusTwoEventsWithAckOk(t *testing.T) {
	Convey("Hook focus two events with ACK OK", t, func() {
		var jobProgress libLifeHook.TaskStatesProgressValue
		var receiveCount int
		var focusStates = []string{jobstate.PENDING, jobstate.SUCCEEDED}                               // jobstate.RUNNING ,
		focusResult := libLifeHook.TaskStatesProgressSucceeded | libLifeHook.TaskStatesProgressPending // libLifeHook.TaskStatesProgressRunning  |
		var hookCb helper.TestHookCallback = func(host string, events []byte, feature *api.Feature, stopChan chan int) (bytes []byte, err error) {
			eventName := jsoniter.Get(events, "currentState").ToString()
			Convey("Receive focus Events", t, func() {
				So(eventName, ShouldBeIn, focusStates)
				receiveCount += 1
				jobProgress |= libLifeHook.TaskStatesProgresses[eventName]

				if len(focusStates) == receiveCount {
					So(jobProgress, ShouldEqual, focusResult)
					if focusResult&libLifeHook.TaskStatesProgressSucceeded < 1 {
						close(stopChan)
					}
				}
			})
			return []byte(libLifeHook.LifeHookPairAckOK), nil
		}

		var cb helper.TestSceneCallback = func(jobId string, job string, feature *api.Feature) {
			feature.Init()
			isActiveJobHook := helper.GetApp().Services().LifeHook().IsActiveJobHook(jobId, feature.Plugins[len(feature.Plugins)-1])
			So(isActiveJobHook, ShouldEqual, false)
		}

		jobMocker := helper.CreateRandomJobMocker()
		jobMocker.Job = `{
				"userID":"tester",
				"jobKind":"` + jobMocker.JobKind + `",
				"jobName":"TestLifeHookReceiveEvents_` + jobMocker.Version + `",
				"header":{
					"mockCommand":"alwaysSucceeded",
					"jobKind":"` + jobMocker.JobKind + `"
				},
				"job":{"kind":"` + jobMocker.JobKind + `"}
			}`
		jobMocker.JobSelector.States = focusStates
		err := helper.MockHookScene(jobMocker, time.After(time.Duration(5*time.Second)), hookCb, cb)
		So(err, ShouldBeNil)
	})
}

func TestHookEventWithAckRetry(t *testing.T) {
	Convey("Hook events with ACK Retry", t, func() {
		var jobProgress libLifeHook.TaskStatesProgressValue
		var preEventName string
		retryCountMap := make(map[string]int)
		MaxRetryOnFail := helper.GetApp().Config().LifeHook.MaxRetryOnFail

		var hookCb helper.TestHookCallback = func(host string, events []byte, feature *api.Feature, stopChan chan int) (bytes []byte, err error) {
			eventName := jsoniter.Get(events, "currentState").ToString()
			c, ok := retryCountMap[eventName]
			Convey("Receive Events", t, func() {
				So(eventName, ShouldBeIn, libLifeHook.TaskStates)
				So(c, ShouldBeLessThanOrEqualTo, MaxRetryOnFail)
				jobProgress |= libLifeHook.TaskStatesProgresses[eventName]

				if !ok {
					if preEventName != "" {
						// event must retry in Max before an other event receive
						So(retryCountMap[preEventName], ShouldEqual, MaxRetryOnFail)
					}
					retryCountMap[eventName] = 0
				} else {
					c += 1
					retryCountMap[eventName] = c
				}

				// every events retrycount must be not greater then MaxRetryOnFail
				So(c, ShouldBeLessThanOrEqualTo, MaxRetryOnFail)
				// job event must be full when it is completed
				if c == MaxRetryOnFail && stringUtils.HasString(libLifeHook.TaskStatesCompleted, eventName) {
					So(jobProgress&libLifeHook.TaskStatesProgressCompleted, ShouldEqual, libLifeHook.TaskStatesProgressCompleted)
				}
			})

			preEventName = eventName
			if c >= MaxRetryOnFail {
				return []byte(libLifeHook.LifeHookPairAckOK), nil
			}
			return []byte(libLifeHook.LifeHookPairAckRe), nil
		}

		var cb helper.TestSceneCallback = func(jobId string, job string, feature *api.Feature) {
			feature.Init()
			isActiveJobHook := helper.GetApp().Services().LifeHook().IsActiveJobHook(jobId, feature.Plugins[len(feature.Plugins)-1])
			So(isActiveJobHook, ShouldEqual, false)
		}

		err := helper.MockHookScene(helper.CreateRandomJobMocker(), time.After(time.Duration(5*time.Minute)), hookCb, cb)
		So(err, ShouldBeNil)
	})
}

func TestHookEventWithAckRetryNoOK(t *testing.T) {
	Convey("Hook events with ACK RetryNoOk", t, func() {
		var jobProgress libLifeHook.TaskStatesProgressValue
		retryCountMap := make(map[string]int)
		MaxRetryOnFail := helper.GetApp().Config().LifeHook.MaxRetryOnFail

		var hookCb helper.TestHookCallback = func(host string, events []byte, feature *api.Feature, stopChan chan int) (bytes []byte, err error) {
			eventName := jsoniter.Get(events, "currentState").ToString()
			c, ok := retryCountMap[eventName]
			Convey("Receive Events", t, func() {
				So(eventName, ShouldBeIn, libLifeHook.TaskStates)
				So(c, ShouldBeLessThanOrEqualTo, MaxRetryOnFail)
				jobProgress |= libLifeHook.TaskStatesProgresses[eventName]

				if !ok {
					retryCountMap[eventName] = 0
				} else {
					c += 1
					retryCountMap[eventName] = c
				}

				// only pending
				So(jobProgress, ShouldEqual, libLifeHook.TaskStatesProgressPending)
				// every events retrycount must be not greater then MaxRetryOnFail
				So(c, ShouldBeLessThanOrEqualTo, MaxRetryOnFail)
				if c == MaxRetryOnFail {
					close(stopChan)
				}
			})
			return []byte(libLifeHook.LifeHookPairAckRe), nil
		}

		var cb helper.TestSceneCallback = func(jobId string, job string, feature *api.Feature) {
			// only pending
			//So(retryCountMap, ShouldHaveLength, 1)
			//So(retryCountMap, ShouldContainKey, libLifeHook.TaskStatesProgressPending)

			feature.Init()
			isActiveJobHook := helper.GetApp().Services().LifeHook().IsActiveJobHook(jobId, feature.Plugins[len(feature.Plugins)-1])
			So(isActiveJobHook, ShouldEqual, false)
		}

		err := helper.MockHookScene(helper.CreateRandomJobMocker(), time.After(time.Duration(5*time.Minute)), hookCb, cb)
		So(err, ShouldBeNil)
	})
}

func TestHookEventWithNoAck(t *testing.T) {
	Convey("Hook events with No ACK", t, func() {
		var jobProgress libLifeHook.TaskStatesProgressValue
		retryCountMap := make(map[string]int)
		MaxRetryOnFail := helper.GetApp().Config().LifeHook.MaxRetryOnFail

		var hookCb helper.TestHookCallback = func(host string, events []byte, feature *api.Feature, stopChan chan int) (bytes []byte, err error) {
			eventName := jsoniter.Get(events, "currentState").ToString()
			c, ok := retryCountMap[eventName]
			Convey("Receive Events", t, func() {
				So(eventName, ShouldBeIn, libLifeHook.TaskStates)
				So(c, ShouldBeLessThanOrEqualTo, MaxRetryOnFail)
				jobProgress |= libLifeHook.TaskStatesProgresses[eventName]

				if !ok {
					retryCountMap[eventName] = 0
				} else {
					c += 1
					retryCountMap[eventName] = c
				}

				// only pending
				So(jobProgress, ShouldEqual, libLifeHook.TaskStatesProgressPending)
				// every events retrycount must be not greater then MaxRetryOnFail
				So(c, ShouldBeLessThanOrEqualTo, MaxRetryOnFail)
				if c == MaxRetryOnFail {
					close(stopChan)
				}
			})
			return []byte(""), nil
		}

		var cb helper.TestSceneCallback = func(jobId string, job string, feature *api.Feature) {
			feature.Init()
			isActiveJobHook := helper.GetApp().Services().LifeHook().IsActiveJobHook(jobId, feature.Plugins[len(feature.Plugins)-1])
			So(isActiveJobHook, ShouldEqual, false)
		}

		err := helper.MockHookScene(helper.CreateRandomJobMocker(), time.After(time.Duration(5*time.Minute)), hookCb, cb)
		So(err, ShouldBeNil)
	})
}

func TestHookEventWith500Exception(t *testing.T) {
	Convey("Hook events Return Exception", t, func() {
		var jobProgress libLifeHook.TaskStatesProgressValue
		retryCountMap := make(map[string]int)
		MaxRetryOnFail := helper.GetApp().Config().LifeHook.MaxRetryOnFail

		var hookCb helper.TestHookCallback = func(host string, events []byte, feature *api.Feature, stopChan chan int) (bytes []byte, err error) {
			eventName := jsoniter.Get(events, "currentState").ToString()
			c, ok := retryCountMap[eventName]
			Convey("Receive Events", t, func() {
				So(eventName, ShouldBeIn, libLifeHook.TaskStates)
				So(c, ShouldBeLessThanOrEqualTo, MaxRetryOnFail)

				if !ok {
					retryCountMap[eventName] = 0
				} else {
					c += 1
					retryCountMap[eventName] = c
				}

				// only pending
				jobProgress |= libLifeHook.TaskStatesProgresses[eventName]
				So(jobProgress, ShouldEqual, libLifeHook.TaskStatesProgressPending)

				// every events retrycount must be not greater then MaxRetryOnFail
				So(c, ShouldBeLessThanOrEqualTo, MaxRetryOnFail)
				if c == MaxRetryOnFail {
					close(stopChan)
				}
			})
			return nil, fmt.Errorf("server unavailabled")
		}

		var cb helper.TestSceneCallback = func(jobId string, job string, feature *api.Feature) {
			feature.Init()
			isActiveJobHook := helper.GetApp().Services().LifeHook().IsActiveJobHook(jobId, feature.Plugins[len(feature.Plugins)-1])
			So(isActiveJobHook, ShouldEqual, false)
		}

		err := helper.MockHookScene(helper.CreateRandomJobMocker(), time.After(time.Duration(5*time.Minute)), hookCb, cb)
		So(err, ShouldBeNil)
	})
}

func TestHookEventWithConnectionRefused(t *testing.T) {
	Convey("Hook events With Connection refused", t, func() {
		var jobProgress libLifeHook.TaskStatesProgressValue
		var recCount int

		var hookCb helper.TestHookCallback = func(host string, events []byte, feature *api.Feature, stopChan chan int) (bytes []byte, err error) {
			recCount += 1
			eventName := jsoniter.Get(events, "currentState").ToString()
			Convey("Receive only one event", t, func() {
				So(eventName, ShouldBeIn, libLifeHook.TaskStates)
				So(recCount, ShouldEqual, 1)

				// only pending
				jobProgress |= libLifeHook.TaskStatesProgresses[eventName]
				So(jobProgress, ShouldEqual, libLifeHook.TaskStatesProgressPending)
			})

			if recCount == 1 {
				// remote.Serve and remote.RemoveService would lock
				// this ctx is executing in remote.Serve
				// if it exec without in a new goroutine,
				// lead to lockSlow
				// refuse next tcp package
				remoteService := mockHttp.Inject()
				// host refused next connection
				remoteService.RemoveService(host)
				go func() {
					// wait next request to time out + 1 sec delay
					<-time.After(time.Duration(helper.GetApp().Config().LifeHook.RequestTimeOutSec+2) * time.Second)
					close(stopChan)
				}()

				return []byte(libLifeHook.LifeHookPairAckOK), nil
			}
			return nil, nil
		}

		var cb helper.TestSceneCallback = func(jobId string, job string, feature *api.Feature) {
			feature.Init()
			isActiveJobHook := helper.GetApp().Services().LifeHook().IsActiveJobHook(jobId, feature.Plugins[len(feature.Plugins)-1])
			So(isActiveJobHook, ShouldEqual, false)
		}

		sceneTimeout := helper.GetApp().Config().LifeHook.RequestTimeOutSec + 5
		err := helper.MockHookScene(helper.CreateRandomJobMocker(), time.After(time.Duration(sceneTimeout)*time.Second), hookCb, cb)
		So(err, ShouldBeNil)
	})
}

func TestHookEventWithConnectionResumed(t *testing.T) {
	Convey("Hook events With Connection resumed", t, func() {
		jobMocker := helper.CreateRandomJobMocker()
		demoFeature := helper.CreateRandomFeature()
		demoFeature.Enabled = true
		demoFeature.JobSelector = jobMocker.JobSelector
		demoFeature.Plugins = append(demoFeature.Plugins[:len(demoFeature.Plugins)-2], &api.Plugin{
			PluginType:  featureConst.PLUGIN_TYPE_LIFEHOOK,
			JobSelector: jobMocker.JobSelector,
		})

		// register feature and active the mock service
		stopChan := make(chan int)
		url := fmt.Sprintf("%s.submitJobWithHook.lifehook.test", utils.GetRandomString(8))
		var jobProgress libLifeHook.TaskStatesProgressValue
		var currentProgress = libLifeHook.TaskStatesProgressPending

		resumeFeature := func() {
			helper.RegisterFeature(url, demoFeature, &mockFeature.HandlerFuncs{
				LifeHook: func(events []byte) (bytes []byte, err error) {
					eventName := jsoniter.Get(events, "currentState").ToString()
					jobId := jsoniter.Get(events, "id").ToString()
					Convey("Receive Events", t, func() {
						So(eventName, ShouldBeIn, libLifeHook.TaskStates)
						So(libLifeHook.TaskStatesProgresses[eventName], ShouldEqual, currentProgress)

						currentProgress = currentProgress << 1
						jobProgress |= libLifeHook.TaskStatesProgresses[eventName]

						// job event must be full when it is completed
						if stringUtils.HasString(libLifeHook.TaskStatesCompleted, eventName) {
							So(eventName, ShouldEqual, jobstate.SUCCEEDED)
							So(jobProgress&libLifeHook.TaskStatesProgressCompleted, ShouldEqual, libLifeHook.TaskStatesProgressCompleted)

							helper.CancelFeature(url, demoFeature)
							demoFeature.Init()
							isActiveJobHook := helper.GetApp().Services().LifeHook().IsActiveJobHook(jobId, demoFeature.Plugins[len(demoFeature.Plugins)-1])
							So(isActiveJobHook, ShouldEqual, false)
							close(stopChan)
						}
					})
					return []byte(libLifeHook.LifeHookPairAckOK), nil
				},
			})
		}

		helper.RegisterFeature(url, demoFeature, &mockFeature.HandlerFuncs{
			LifeHook: func(events []byte) (bytes []byte, err error) {
				helper.CancelFeature(url, demoFeature)
				defer func() {
					// like network delay
					<-time.After(3 * time.Millisecond)
					resumeFeature()
				}()
				err = fmt.Errorf("service unactivied")
				return
			},
		})

		// submit job
		_, err := helper.Request(helper.GetApp(), "POST", v1.APICreateJob, jobMocker.Job)
		So(err, ShouldBeNil)
		<-stopChan
	})
}
