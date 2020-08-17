package http

import (
	"fmt"
	"net/http"
	"sync"
)

type Service struct {
	Host  string
	Serve func(req *http.Request) (*http.Response, error)
}

type RemoteService struct {
	mutex          sync.Mutex
	services       map[string]*Service
	defaultService *Service
}

func (r *RemoteService) Serve(req *http.Request) (*http.Response, error) {
	r.mutex.Lock()
	//defer r.mutex.Unlock()
	if nil == r.services {
		r.services = make(map[string]*Service)
	}

	var service *Service
	for host, ser := range r.services {
		if host == req.Host {
			service = ser
			break
		}
	}
	r.mutex.Unlock()
	if nil == service {
		// TODO
		// In some unit tests, like timeout, connection refused etc.
		// There are still some problems to be solved, like:
		// in timeout unit tests, native http.Transport call back nil resp and timeout err
		// but in BuildHttpService, err would format into resp
		if r.defaultService != nil {
			return r.defaultService.Serve(req)
		}
		return nil, fmt.Errorf("No Service For Host,%s", req.Host)
	}

	return service.Serve(req)
}

func (r *RemoteService) AddService(service *Service) {
	r.mutex.Lock()
	defer r.mutex.Unlock()

	if nil == r.services {
		r.services = make(map[string]*Service)
	}
	r.services[service.Host] = service
}

func (r *RemoteService) RemoveService(host string) {
	r.mutex.Lock()
	defer r.mutex.Unlock()

	if nil == r.services {
		return
	}
	delete(r.services, host)
}
