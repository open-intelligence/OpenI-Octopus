// MIT License
//
// Copyright (c) PCL. All rights reserved.
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE
//

package pipeline

import (
	"bytes"
	"fmt"
	"io/ioutil"
	"net/http"
	"scheduler/pkg/pipeline/components/selector"
	"scheduler/pkg/pipeline/constants/feature"
	"strings"
	"time"

	jsoniter "github.com/json-iterator/go"
)

type _plugins []*Plugin

func (p _plugins) Len() int      { return len(p) }
func (p _plugins) Swap(i, j int) { p[i], p[j] = p[j], p[i] }
func (p _plugins) Less(i, j int) bool {
	return p[i].GetExecutionSequence() < p[j].GetExecutionSequence()
}

type condProvider struct {
	header []byte
}

func (c *condProvider) GetValue(cond *selector.Cond) (bool, error) {

	keys := strings.Split(cond.GetKey(), ".")

	paths := make([]interface{}, len(keys))

	for i := 0; i < len(keys); i++ {
		paths[i] = keys[i]
	}

	value := jsoniter.Get(c.header, paths...).ToString()

	return cond.Test(value), nil
}

func defaultPluginProcessFunc(work *Workpiece, plugin *Plugin) ([]byte, error) {

	var factors []byte = []byte(`{}`)

	if nil != work.params && nil != work.params[feature.PLUGIN_TYPE_FACTOR_GENERATOR] {
		param, err := jsoniter.Marshal(work.params[feature.PLUGIN_TYPE_FACTOR_GENERATOR])

		if err != nil {
			return nil, err
		}
		factors = param
	}

	packet := `{
		"factors":` + string(factors) + `,
		"header":` + string(work.header) + `,
		"job":` + string(work.job) + `
	}`

	request, err := http.NewRequest("POST", plugin.GetCallback(), bytes.NewReader([]byte(packet)))

	if nil != err {
		return nil, err
	}

	request.Header.Add("Content-Type", "application/json")

	if "" != plugin.GetAuthorization() {
		request.Header.Add("Authorization", "Basic "+plugin.GetAuthorization())
	}

	client := &http.Client{Timeout: 30 * time.Second}

	var result []byte
	var rsp *http.Response

	for i := 0; i < 3; i++ {
		rsp, err = client.Do(request)

		if err != nil {
			time.Sleep(1 * time.Second)
			continue
		}

		break
	}

	if err != nil {
		return nil, fmt.Errorf("Failed to call plugin,Error:%s", err.Error())
	}

	defer rsp.Body.Close()

	result, err = ioutil.ReadAll(rsp.Body)


	if nil != err {
		return nil, fmt.Errorf("Failed to read plugin result,Error:%s", err.Error())
	}

	if rsp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("Failed to call plugin,http code: %d, message: %v", rsp.StatusCode, string(result))
	}

	return result, err

}
