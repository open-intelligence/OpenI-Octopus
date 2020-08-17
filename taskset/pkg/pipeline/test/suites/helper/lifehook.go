package helper

import (
	"fmt"
	api "scheduler/pkg/pipeline/apis/common"
	libLifeHook "scheduler/pkg/pipeline/components/lifehook"
	featureConst "scheduler/pkg/pipeline/constants/feature"
	mockFeature "scheduler/pkg/pipeline/test/mock/feature"
	v1 "scheduler/pkg/pipeline/test/suites/helper/v1"
	"scheduler/pkg/pipeline/utils"
	stringUtils "scheduler/pkg/pipeline/utils/slice"
	"time"

	jsoniter "github.com/json-iterator/go"
)

type TestHookCallback func(host string, events []byte, feature *api.Feature, stopChan chan int) ([]byte, error)
type TestSceneCallback func(jobId string, job string, feature *api.Feature)
type JobMocker struct {
	Version     string
	JobKind     string
	Job         string
	JobSelector *api.JobSelector
}

func CreateRandomJobMocker() *JobMocker {
	randVer := utils.GetRandomString(8)
	jobKind := "DemoDefinedJobKind" + randVer
	return &JobMocker{
		Version: randVer,
		JobKind: jobKind,
		Job: `{
				"userID":"tester",
				"jobKind":"` + jobKind + `",
				"jobName":"TestLifeHookReceiveEvents_` + randVer + `",
				"header":{
					"jobKind":"` + jobKind + `"
				},
				"job":{"kind":"` + jobKind + `"}
			}`,
		JobSelector: &api.JobSelector{
			Conditions: []*api.Condition{
				&api.Condition{
					Name:   "JobKind",
					Key:    "jobKind",
					Expect: "^" + jobKind + "$",
				},
			},
			Expression: "JobKind",
			States:     []string{"*"},
		},
	}
}

func MockHookScene(jobMocker *JobMocker, timeOutChan <-chan time.Time, hookCallback TestHookCallback, callback TestSceneCallback) error {
	demoFeature := CreateRandomFeature()
	demoFeature.Enabled = true
	demoFeature.JobSelector = jobMocker.JobSelector
	demoFeature.Plugins = append(demoFeature.Plugins[:len(demoFeature.Plugins)-2], &api.Plugin{
		PluginType:  featureConst.PLUGIN_TYPE_LIFEHOOK,
		JobSelector: jobMocker.JobSelector,
	})

	// register feature and active the mock service
	stopChan := make(chan int)
	url := fmt.Sprintf("%s.submitJobWithHook.lifehook.test", utils.GetRandomString(8))
	RegisterFeature(url, demoFeature, &mockFeature.HandlerFuncs{
		LifeHook: func(events []byte) (bytes []byte, err error) {
			//fmt.Println("receive event: ", string(events))
			var result string
			defer func() {
				//if err != nil {
				//	<- time.After(time.Duration(5*time.Second))
				//	stopChan <- 1
				//	return
				//}
				if result == libLifeHook.LifeHookPairAckOK &&
					stringUtils.HasString(libLifeHook.TaskStatesCompleted, jsoniter.Get(events, "currentState").ToString()) {
					close(stopChan)
					return
				}
			}()
			bytes, err = hookCallback(url, events, demoFeature, stopChan)
			result = string(bytes)
			return
		},
	})

	var jobId string
	// exec Scene CallBack at last
	defer func() {
		// like network delay
		<-time.After(1 * time.Second)
		// runtime.Gosched()
		callback(jobId, jobMocker.Job, demoFeature)
		CancelFeature(url, demoFeature)
	}()

	// submit job
	jobBody, err := Request(GetApp(), "POST", v1.APICreateJob, jobMocker.Job)
	if err != nil {
		return err
	}
	jobId = jsoniter.Get(jobBody, "payload", "jobID").ToString()

	select {
	case <-timeOutChan:
		close(stopChan)
		return fmt.Errorf("timeout, not recevice event after any sec")
	case <-stopChan:
	}
	return nil
}
