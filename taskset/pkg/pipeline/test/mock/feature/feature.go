package feature

import (
	"fmt"
	"io/ioutil"
	libHttp "net/http"
	"net/http/httptest"
	api "scheduler/pkg/pipeline/apis/common"
	"scheduler/pkg/pipeline/components/pipeline"
	"scheduler/pkg/pipeline/test/mock/http"
)

type pluginProcessFunc func(*pipeline.Workpiece, *pipeline.Plugin) ([]byte, error)

type HandlerFuncs struct {
	Translator      func([]byte) ([]byte, error)
	Factor          func([]byte) ([]byte, error)
	Gate            func([]byte) ([]byte, error)
	Decorator       func([]byte) ([]byte, error)
	SchedulerBinder func([]byte) ([]byte, error)
	LifeHook        func([]byte) ([]byte, error)
}

type FeatureImp struct {
	Host         string
	Feature      *api.Feature
	HandlerFuncs *HandlerFuncs
}

func (f *FeatureImp) BindEndpoints() {
	if nil == f.Feature {
		return
	}
	if nil == f.Feature.Plugins {
		return
	}

	for i := 0; i < len(f.Feature.Plugins); i++ {
		p := f.Feature.Plugins[i]
		if nil == p {
			continue
		}
		p.CallAddress = fmt.Sprintf("http://%s/%s", f.Host, p.PluginType)

	}
}

func (f *FeatureImp) BuildHttpService() *http.Service {

	serve := func(req *libHttp.Request) (*libHttp.Response, error) {

		rw := httptest.NewRecorder()
		reader, err := req.GetBody()

		if nil != err {
			rw.WriteHeader(libHttp.StatusInternalServerError)
			rw.Write([]byte(fmt.Sprintf("Internal Error:%s", err.Error())))
			return rw.Result(), nil
		}

		body, err := ioutil.ReadAll(reader)

		if nil != err {
			rw.WriteHeader(libHttp.StatusInternalServerError)
			rw.Write([]byte(fmt.Sprintf("Internal Error:%s", err.Error())))
			return rw.Result(), nil
		}

		buf, err := f.request(body, req.URL.Path)

		if nil != err {
			rw.WriteHeader(libHttp.StatusInternalServerError)
			rw.Write([]byte(fmt.Sprintf("Internal Error:%s", err.Error())))
			return rw.Result(), nil
		}

		rw.Write(buf)
		rw.WriteHeader(libHttp.StatusOK)

		return rw.Result(), nil
	}

	service := &http.Service{
		Host:  f.Host,
		Serve: serve,
	}

	return service
}
