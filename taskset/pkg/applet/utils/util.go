package utils

import (
	"io/ioutil"
	"net/http"
	"strings"
	"time"
	"net/url"
)

func DoRequest(method, url, body string, headers map[string]string) ([]byte, int, error) {
	req, err := http.NewRequest(method, url, nil)
	if err != nil {
		return nil, 0, err
	}
	if "" != body {
		req.Body = ioutil.NopCloser(strings.NewReader(body))
	}

	if headers != nil {
		for k, v := range headers {
			req.Header.Set(k, v)
		}
	}
	req.Header.Add("Content-Type", "application/json")

	client := &http.Client{Timeout: 30 * time.Second}
	var result []byte
	var rsp *http.Response

	rsp, err = client.Do(req)
	if err != nil {
		return nil, 0, err
	}
	defer rsp.Body.Close()
	result, err = ioutil.ReadAll(rsp.Body)
	return result, rsp.StatusCode, err
}

func PostForm(addr string, form map[string]string) ([]byte, int, error) {

	value := url.Values{}

	if form != nil {
		for k, v := range form {
			value.Add(k, v)
		}
	}

	rsp, err := http.PostForm(addr, value)

	if err != nil {
		return nil, 0, err
	}

	defer rsp.Body.Close()

	result, err := ioutil.ReadAll(rsp.Body)
	
	if err != nil {
		return nil, 0, err
	}

	return result, rsp.StatusCode, err

}
