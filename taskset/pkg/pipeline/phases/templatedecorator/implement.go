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

package templatedecorator

import (
	"scheduler/pkg/pipeline/components/pipeline"
	"scheduler/pkg/pipeline/constants/feature"
	"scheduler/pkg/pipeline/utils/json"
	jsoniter "github.com/json-iterator/go"
	libTaskset "scheduler/pkg/crd/apis/taskset/v1alpha1"
)

type Decorator struct {
	name        string
	description string
}

func (d *Decorator) Name() string {
	return d.name
}

func (d *Decorator) Description() string {
	return d.description
}

func (d *Decorator) SelectPlugin(work *pipeline.Workpiece, plugins []*pipeline.Plugin) *pipeline.Plugin {
	if nil == plugins || nil == work || 0 == len(plugins) {
		return nil
	}

	if work.IsTerminated() || work.IsSuspended() || work.IsStopped() {
		return nil
	}

	for i := 0; i < len(plugins); i++ {
		if work.DidPluginAlreadyDone(plugins[i]) == false {
			return plugins[i]
		}
	}

	return nil
}

func (d *Decorator) ProcessPluginResult(work *pipeline.Workpiece, result []byte) {

	oldWork := work.GetJob()

	legal := json.IsNewJSONIncrFromOldJSON(string(oldWork), string(result))

	if legal {
		work.UpdateJob(result)
	} else {

		var taskset libTaskset.TaskSet
		var oldWorkMar []byte

		err := jsoniter.Unmarshal(oldWork, &taskset)
		
		if err == nil {
			oldWorkMar, _ = jsoniter.Marshal(taskset)
		}

		legal = json.IsNewJSONIncrFromOldJSON(string(oldWorkMar), string(result))

		if legal {
			work.UpdateJob(result)
		}else{
			work.Terminate("Can't overide the old value in job template when decorate it!")
		}
		
	}

}

func New() *Decorator {

	phase := &Decorator{
		name:        feature.PLUGIN_TYPE_TEMPLATE_DECORATOR,
		description: "decorate the taskset template",
	}

	return phase
}
