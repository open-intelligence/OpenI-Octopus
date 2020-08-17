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

package factorgenerator

import (
	"scheduler/pkg/pipeline/components/pipeline"

	"scheduler/pkg/pipeline/constants/feature"

	jsoniter "github.com/json-iterator/go"
)

type Factor struct {
	name        string
	description string
}

func (f *Factor) Name() string {
	return f.name
}

func (f *Factor) Description() string {
	return f.description
}

//SelectPlugin assign a plugin to the workpiece
func (f *Factor) SelectPlugin(work *pipeline.Workpiece, plugins []*pipeline.Plugin) *pipeline.Plugin {
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

//ProcessPluginResult process the procedure plugin response
func (f *Factor) ProcessPluginResult(work *pipeline.Workpiece, result []byte) {
	topic := jsoniter.Get(result, "topic").ToString()
	advice := jsoniter.Get(result, "advice").ToString()
	reason := jsoniter.Get(result, "reason").ToString()

	if topic != "" && advice != "" {
		work.PutParam(topic, &map[string]string{
			"topic":  topic,
			"advice": advice,
			"reason": reason,
		})
	}
}

//New creates a new Factor instance
func New() *Factor {

	phase := &Factor{
		name:        feature.PLUGIN_TYPE_FACTOR_GENERATOR,
		description: "generate factors",
	}

	return phase
}
