package helper

import (
	"fmt"
	"io/ioutil"
	"net/http"
	"net/http/httptest"
	"os"
	apiModule "scheduler/pkg/pipeline/apis/module"
	libApp "scheduler/pkg/pipeline/app"
	"scheduler/pkg/pipeline/config"
	"scheduler/pkg/pipeline/constants/jobstate"
	"scheduler/pkg/pipeline/test/common"
	mockFeature "scheduler/pkg/pipeline/test/mock/feature"
	mockHttp "scheduler/pkg/pipeline/test/mock/http"
	"strings"
	"sync"
	"time"

	jsoniter "github.com/json-iterator/go"
)

var mutex sync.Mutex

var appInstance *libApp.App

var remoteService *mockHttp.RemoteService

func initApp() {

	tempDB := fmt.Sprintf("%s%s", os.TempDir(), "/taskset_test.db")

	os.Remove(tempDB)

	remoteService = mockHttp.Inject()

	config := &config.Config{
		Pipeline: &config.PipelineConfig{
			WorkerAmount: 10,
		},
		Mysql: &config.MysqlConfig{
			DBType:  "sqlite3",
			AuthStr: tempDB,
		},
		Kubernetes: nil,
		LifeHook: &config.LifeHookConfig{
			RequestTimeOutSec:         5,
			MaxParallelProcessRequest: 30,
			MaxRetryOnFail:            3,
		},
		Server: &config.ServerConfig{
			Port: "8080",
		},
	}

	appInstance = common.CreateApp(config)

	defaultFeature := common.DefaultFeature()

	defaultFeatureImp := &mockFeature.FeatureImp{
		Host:    "default.feature.test",
		Feature: defaultFeature,
		HandlerFuncs: &mockFeature.HandlerFuncs{
			Gate: func(payload []byte) ([]byte, error) {
				mockCommand := jsoniter.Get(payload, "header").Get("mockCommand").ToString()
				if mockCommand == "suspend" {
					decision := `{
						"decision":"suspend",
						"reason":"",
					}`
					return []byte(decision), nil
				}
				if mockCommand == "stop" {
					decision := `{
						"decision":"stop",
						"reason":"",
					}`
					return []byte(decision), nil
				}

				if mockCommand == "manualError" {
					return nil, fmt.Errorf("Manual Error")
				}

				decision := `{
					"decision":"pass",
					"reason":"no special rule",
				}`
				return []byte(decision), nil
			},
		},
	}

	defaultFeatureImp.BindEndpoints()

	remoteService.AddService(defaultFeatureImp.BuildHttpService())

	appInstance.Run()

	err := appInstance.Services().Core().UpsertFeature(defaultFeature)

	if nil != err {
		panic(err)
	}

	isSucceeded, err := appInstance.Services().Core().EnableFeature(defaultFeature.Name)

	if nil != err || !isSucceeded {
		panic(err)
	}

	err = common.CreateDefaultAdminToken(appInstance)

	if nil != err {
		panic(err)
	}
}

func GetApp() *libApp.App {
	mutex.Lock()
	defer mutex.Unlock()
	if nil == appInstance {
		initApp()
	}
	return appInstance
}

func GetRemoteService() *mockHttp.RemoteService {
	mutex.Lock()
	defer mutex.Unlock()
	if nil == remoteService {
		initApp()
	}
	return remoteService
}

func WaitJobState(app *libApp.App, jobID string, expectStates []string, timeoutSec int64) error {

	var mutex sync.Mutex
	exited := false
	wait := make(chan int, 0)

	defer func() {
		mutex.Lock()
		exited = true
		close(wait)
		mutex.Unlock()
	}()

	app.Services().Kubernetes().AddEventListener(jobID, func(event *apiModule.JobEvent) {
		if event.JobID == jobID {
			sig := -1
			if nil != expectStates {
				for _, state := range expectStates {
					if event.EventName == state {
						sig = 0
						break
					}
				}
			}
			if event.EventName == jobstate.SUCCEEDED || event.EventName == jobstate.FAILED {
				if -1 == sig {
					sig = 1
				}
			}
			mutex.Lock()
			if false == exited && -1 != sig {
				wait <- sig
			}
			mutex.Unlock()
		}
	})

	defer app.Services().Kubernetes().RemoveEventListener(jobID)

	go func() {
		//timeout
		cn := time.After(time.Duration(timeoutSec) * time.Second)
		<-cn
		mutex.Lock()
		if false == exited {
			wait <- 1
		}
		mutex.Unlock()
	}()

	sig := <-wait

	if 0 == sig {
		return nil
	}

	return fmt.Errorf("Timeout")
}

func Request(app *libApp.App, method, url, body string) ([]byte, error) {

	req, _ := http.NewRequest(method, url, nil)

	req.Header.Set("token", common.DefaultAdminToken)

	if "" != body {
		req.Body = ioutil.NopCloser(strings.NewReader(body))
	}

	rw := httptest.NewRecorder()

	app.Router().ServeHTTP(rw, req)

	return ioutil.ReadAll(rw.Body)

}

func DoRequest(app *libApp.App, method, url, body string) ([]byte, int, error) {

	req, err := http.NewRequest(method, url, nil)

	if err != nil {
		return nil, 0, err
	}

	req.Header.Set("token", common.DefaultAdminToken)

	if "" != body {
		req.Body = ioutil.NopCloser(strings.NewReader(body))
	}

	rw := httptest.NewRecorder()

	app.Router().ServeHTTP(rw, req)

	respBody, err := ioutil.ReadAll(rw.Body)
	return respBody, rw.Code, err
}
