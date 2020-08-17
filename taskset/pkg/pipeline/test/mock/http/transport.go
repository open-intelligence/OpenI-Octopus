package http

import (
	"net/http"
)

type _Transport struct {
	service *RemoteService
}

func (m *_Transport) RoundTrip(req *http.Request) (*http.Response, error) {
	return m.service.Serve(req)
}
