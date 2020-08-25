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

package core

import (
	api "scheduler/pkg/pipeline/apis/common"
	apiMoudule "scheduler/pkg/pipeline/apis/module"
)

type Service interface {
	SubmitJob(jobRecord *apiMoudule.JobRecord, job []byte) error
	StopJob(jobID, namespace, reason string) error
	ResumeJob(cursor *apiMoudule.JobCursor, reason string) error
	UpsertFeature(feature *api.Feature) error
	EnableFeature(featureName string) (bool, error)
	DisableFeature(featureName string) (bool, error)
	DeleteFeature(feature *api.Feature) error
	ChangePluginExecutionSequence(pluginType string, beforePlugin, afterPlugin string) error
	SyncLifeHookByFeature(feature *api.Feature) error
	SyncLifeHookByFeatureName(featureName string) error
}
