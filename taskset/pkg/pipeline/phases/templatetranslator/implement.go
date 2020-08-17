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

package templatetranslator

import (
	"fmt"
	"scheduler/pkg/pipeline/components/pipeline"
	"scheduler/pkg/pipeline/constants/feature"
	"strings"

	jsoniter "github.com/json-iterator/go"
)

type Translator struct {
	name        string
	description string
}

func (t *Translator) Name() string {
	return t.name
}

func (t *Translator) Description() string {
	return t.description
}

func (d *Translator) SelectPlugin(work *pipeline.Workpiece, plugins []*pipeline.Plugin) *pipeline.Plugin {

	if nil == plugins || nil == work {
		return nil
	}

	if work.IsTerminated() || work.IsSuspended() || work.IsStopped() {
		return nil
	}

	job := work.GetJob()

	kind := jsoniter.Get(job, "kind").ToString()

	if "" == kind {
		work.Terminate("Can't detect the kind of job!")
		return nil
	}

	if "taskset" == strings.ToLower(kind) {
		return nil
	}

	if len(plugins) == 0 {
		reason := fmt.Sprintf("Unsupported Job Kind:%s", kind)
		work.Terminate(reason)
		return nil
	}

	if len(plugins) != 1 {
		matched := ""
		for _, plugin := range plugins {
			matched += plugin.Key() + ","
		}

		matched = matched[0 : len(matched)-1]

		reason := fmt.Sprintf("Multiple templatetranslator matched: %s", matched)

		work.Terminate(reason)

		return nil
	}

	if work.DidPluginAlreadyDone(plugins[0]) == true {
		if "taskset" != strings.ToLower(kind) {
			reason := fmt.Sprintf("Unsupported Job Kind:%s", kind)
			work.Terminate(reason)
			return nil
		}
		return nil
	}

	return plugins[0]
}

func (d *Translator) ProcessPluginResult(work *pipeline.Workpiece, result []byte) {
	work.UpdateJob(result)
}

func New() *Translator {

	phase := &Translator{
		name:        feature.PLUGIN_TYPE_TEMPLATE_TRANSLATOR,
		description: "translate job template",
	}

	return phase
}
