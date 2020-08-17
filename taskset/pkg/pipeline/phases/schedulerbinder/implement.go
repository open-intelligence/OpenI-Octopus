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

package schedulerbinder

import (
	"fmt"
	"scheduler/pkg/pipeline/components/pipeline"
	"scheduler/pkg/pipeline/constants/feature"
	"scheduler/pkg/pipeline/utils/json"
)

type SchedulerBinder struct {
	name        string
	description string
}

func (s *SchedulerBinder) Name() string {
	return s.name
}

func (s *SchedulerBinder) Description() string {
	return s.description
}

func (s *SchedulerBinder) SelectPlugin(work *pipeline.Workpiece, plugins []*pipeline.Plugin) *pipeline.Plugin {
	if nil == plugins || nil == work || 0 == len(plugins) {
		return nil
	}

	if work.IsTerminated() || work.IsSuspended() || work.IsStopped() {
		return nil
	}

	if len(plugins) != 1 {
		matched := ""
		for _, plugin := range plugins {
			matched += plugin.Key() + ","
		}
		matched = matched[0 : len(matched)-1]
		reason := fmt.Sprintf("Job matches too many schedulerbinder: %s", matched)
		work.Terminate(reason)
		return nil
	}

	if work.DidPluginAlreadyDone(plugins[0]) == true {
		return nil
	}

	return plugins[0]
}

func (s *SchedulerBinder) ProcessPluginResult(work *pipeline.Workpiece, result []byte) {

	legal := json.IsNewJSONIncrFromOldJSON(string(work.GetJob()), string(result))

	if legal {
		work.UpdateJob(result)
	} else {
		work.Terminate("Can't overide the old value in job template when bind scheduler!")
	}
}

func New() *SchedulerBinder {

	phase := &SchedulerBinder{
		name:        feature.PLUGIN_TYPE_SCHEDULER_BINDER,
		description: "bind scheduler",
	}

	return phase
}
