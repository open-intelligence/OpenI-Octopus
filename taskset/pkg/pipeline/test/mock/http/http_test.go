package http

import (
	"bytes"
	"fmt"
	"io/ioutil"
	"net/http"
	"net/http/httptest"
	"sync"
	"testing"
)

func init() {
	remoteService := Inject()
	service := &Service{
		Host: "tst.core200",
		Serve: func(req *http.Request) (*http.Response, error) {
			rw := httptest.NewRecorder()
			reader, err := req.GetBody()
			if nil != err {
				rw.WriteHeader(http.StatusInternalServerError)
				rw.Write([]byte(fmt.Sprintf("Internal Error:%s", err.Error())))
				return rw.Result(), nil
			}

			body, err := ioutil.ReadAll(reader)

			if nil != err {
				rw.WriteHeader(http.StatusInternalServerError)
				rw.Write([]byte(fmt.Sprintf("Internal Error:%s", err.Error())))
				return rw.Result(), nil
			}
			rw.Write(body)
			rw.WriteHeader(http.StatusOK)
			return rw.Result(), nil
		},
	}
	remoteService.AddService(service)

	service = &Service{
		Host: "tst.core500",
		Serve: func(req *http.Request) (*http.Response, error) {
			rw := httptest.NewRecorder()
			rw.WriteHeader(http.StatusInternalServerError)
			rw.Write([]byte(fmt.Sprintf("Internal Error:%s", "Manual Error")))
			return rw.Result(), nil
		},
	}
	remoteService.AddService(service)
}
func Test200(t *testing.T) {

	payload := `{"foo":"bar"}`
	body := bytes.NewBuffer([]byte(payload))
	res, err := http.Post("http://tst.core200/bar", "application/json", body)

	if err != nil {
		t.Error(err)
		return
	}
	buf, err := ioutil.ReadAll(res.Body)
	if err != nil {
		t.Error(err)
		return
	}

	if payload != string(buf) {
		t.Error(string(buf))
	}
}

func Test500(t *testing.T) {

	payload := `{"foo":"bar"}`
	body := bytes.NewBuffer([]byte(payload))
	res, err := http.Post("http://tst.core500/bar", "application/json", body)
	if err != nil {
		t.Error(err)
		return
	}
	buf, err := ioutil.ReadAll(res.Body)
	if err != nil {
		t.Error(err)
		return
	}

	if payload == string(buf) {
		t.Error(string(buf))
	}
}

func TestNoService(t *testing.T) {

	body := bytes.NewBuffer([]byte(`{"foo":"bar"}`))
	_, err := http.Post("http://tst.core.no/bar", "application/json", body)

	if err == nil {
		t.Error(fmt.Errorf("Error Not Occurred"))
		return
	}
}

func TestMultiGoroutine(t *testing.T) {
	wg := sync.WaitGroup{}
	wg.Add(1)
	var buf []byte
	var err0 error
	payload := `{"foo":"bar"}`

	go func() {
		defer wg.Done()
		body := bytes.NewBuffer([]byte(payload))
		res, err := http.Post("http://tst.core200/bar", "application/json", body)

		if err != nil {
			err0 = err
			return
		}
		buf, err0 = ioutil.ReadAll(res.Body)

	}()

	wg.Wait()
	if err0 != nil {
		t.Error(err0)
		return
	}

	if payload != string(buf) {
		t.Error(string(buf))
	}
}
