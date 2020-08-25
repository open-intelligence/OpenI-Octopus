package http

import (
	"net/http"
	"sync"
)

var mutex sync.Mutex
var remote *RemoteService

var NativeTransport = http.DefaultTransport

func Inject() *RemoteService {
	mutex.Lock()
	defer mutex.Unlock()

	if nil == remote {
		remote = &RemoteService{
			defaultService: &Service{
				Serve: func(req *http.Request) (*http.Response, error) {
					return NativeTransport.RoundTrip(req)
				},
			},
		}
		http.DefaultTransport = &_Transport{
			service: remote,
		}
	}
	return remote
}
