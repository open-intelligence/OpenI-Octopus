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

package accessgate

import (
	"fmt"
	"scheduler/pkg/pipeline/components/pipeline"
	"scheduler/pkg/pipeline/constants/feature"

	jsoniter "github.com/json-iterator/go"
)

const (
	DecisionPass    string = "pass"
	DecisionSuspend string = "suspend"
	DecisionStop    string = "stop"
)

type Gate struct {
	name        string
	description string
}

func (g *Gate) Name() string {
	return g.name
}

func (g *Gate) Description() string {
	return g.description
}

func (g *Gate) SelectPlugin(work *pipeline.Workpiece, plugins []*pipeline.Plugin) *pipeline.Plugin {

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

func (g *Gate) ProcessPluginResult(work *pipeline.Workpiece, result []byte) {

	decision := jsoniter.Get(result, "decision").ToString()

	reason := jsoniter.Get(result, "reason").ToString()

	if decision == DecisionPass {
		return
	}

	if decision == DecisionStop {
		work.Stop(reason)
		return
	}

	if decision == DecisionSuspend {
		work.Suspend(reason)
		return
	}

	work.Terminate(fmt.Sprintf("Unrecognized Decision:%s", decision))

}

func New() *Gate {

	phase := &Gate{
		name:        feature.PLUGIN_TYPE_ACCESS_GATE,
		description: "Decide if the job should be passed  or terminated or suspended",
	}

	return phase
}
