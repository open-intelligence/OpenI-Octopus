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

package job

import (
	v1 "scheduler/pkg/pipeline/apis/http/v1"
	api "scheduler/pkg/pipeline/apis/module"
	typeTaskset "scheduler/pkg/crd/apis/taskset/v1alpha1"
)

type Service interface {
	LoadJobsInPipeline() ([]*api.JobCursor, error)
	CreateJobRecord(jobRecord *api.JobRecord, job []byte) error
	CreateJobCursor(*api.JobCursor) error
	GetJobRecord(jobID string) (*api.JobRecord, error)
	GetJobCursor(jobID string) (*api.JobCursor, error)
	UpdateJobCursor(*api.JobCursor) error
	UpdateJobSummary(jobID string, stateSummary *typeTaskset.TaskMessage) error
	UpdateJobStatus(jobID, state, reason string, detail *v1.JobStatusDetail) error
	SearchJobs(*v1.QueryParams) ([]*v1.JobItem, error)
	GetJobAmount(*v1.QueryParams) (int64, error)
	StopJob(jobID, namespace, reason string) error
	ReplenishJobOnOver(jobID, state, namespace string) error
}
