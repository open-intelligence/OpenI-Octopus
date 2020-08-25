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

package app

import (
	"fmt"
	typeTaskset "scheduler/pkg/crd/apis/taskset/v1alpha1"
	v1 "scheduler/pkg/pipeline/apis/http/v1"
	api "scheduler/pkg/pipeline/apis/module"
	"scheduler/pkg/pipeline/components/pipeline"
	"scheduler/pkg/pipeline/constants/header"
	"scheduler/pkg/pipeline/constants/jobstate"
	"scheduler/pkg/pipeline/constants/operation"
	"scheduler/pkg/pipeline/phases/accessgate"
	"scheduler/pkg/pipeline/utils/json"
	tasksetFormat "scheduler/pkg/pipeline/utils/taskset"

	apiErrors "k8s.io/apimachinery/pkg/api/errors"

	jsoniter "github.com/json-iterator/go"
	"go.uber.org/zap"
)

func (a *App) onSuspendInPipeline(work *pipeline.Workpiece) error {

	err := a.Services().Job().UpdateJobStatus(
		work.GetJobID(),
		jobstate.SUSPENDED,
		work.GetReason(),
		nil,
	)

	if err != nil {
		return err
	}

	event := &api.JobEvent{
		JobID:     work.GetJobID(),
		Header:    work.GetHeader(),
		Namespace: "",
		EventName: jobstate.SUSPENDED,
		TaskSet:   nil,
	}

	a.Services().LifeHook().Emit(event)

	return nil
}

func (a *App) onStopInPipeline(work *pipeline.Workpiece) error {

	err := a.Services().Job().UpdateJobStatus(
		work.GetJobID(),
		jobstate.STOPPED,
		work.GetReason(),
		nil,
	)

	if err != nil {
		return err
	}

	event := &api.JobEvent{
		JobID:     work.GetJobID(),
		Header:    work.GetHeader(),
		Namespace: "",
		EventName: jobstate.STOPPED,
		TaskSet:   nil,
	}

	a.Services().LifeHook().Emit(event)

	return nil
}

func (a *App) onPrepareDoneInPipeline(work *pipeline.Workpiece) error {

	job := work.GetJob()

	kind := jsoniter.Get(job, "kind").ToString()

	if kind != "TaskSet" {
		reason := fmt.Sprintf("Unsupported Job Kind:%s", kind)
		work.Terminate(reason)
		return fmt.Errorf(reason)
	}

	var taskset typeTaskset.TaskSet

	err := jsoniter.Unmarshal(job, &taskset)

	if nil != err {
		reason := fmt.Sprintf("Wrong format of TaskSet:%s", err)
		work.Terminate(reason)
		return err
	}

	taskset.Name = work.GetJobID()

	taskset.Annotations = map[string]string{
		"header": string(work.GetHeader()),
	}

	if "" == taskset.Namespace {
		taskset.Namespace = "default"
	}

	err = a.Services().Kubernetes().SubmitJob(&taskset)

	if nil != err && !apiErrors.IsAlreadyExists(err) {
		return err
	}

	cursor, err := a.Services().Job().GetJobCursor(work.GetJobID())

	if err != nil {
		a.logger.Error(
			"Failed to update job cursor as submited",
			zap.Error(err),
		)
		return nil
	}

	cursor.Submited = true

	err = a.Services().Job().UpdateJobCursor(cursor)

	if err != nil {
		a.logger.Error(
			"Failed to update job cursor as submited",
			zap.Error(err),
		)
	}

	return nil
}

func (a *App) onUnexpect(work *pipeline.Workpiece) error {

	err := a.Services().Job().UpdateJobStatus(
		work.GetJobID(),
		jobstate.FAILED,
		work.GetReason(),
		nil,
	)

	if err != nil {
		a.logger.Error(
			"Failed to update job state",
			zap.Error(err),
		)
	}

	if !work.IsTerminated() {
		return nil
	}

	event := &api.JobEvent{
		JobID:     work.GetJobID(),
		Header:    work.GetHeader(),
		Namespace: "",
		EventName: jobstate.FAILED,
		TaskSet:   nil,
	}

	a.Services().LifeHook().Emit(event)

	var phaseMessage *typeTaskset.TaskMessage = &typeTaskset.TaskMessage{}
	phaseMessage.State = "Failed"
	phaseMessage.StateMessage = work.GetReason()
	a.Services().Job().UpdateJobSummary(work.GetJobID(), phaseMessage)

	cursor, err := a.Services().Job().GetJobCursor(work.GetJobID())

	if err != nil {
		a.logger.Error(
			"Failed to update job cursor as submited",
			zap.Error(err),
		)
		return nil
	}

	cursor.Submited = true

	err = a.Services().Job().UpdateJobCursor(cursor)

	if err != nil {
		a.logger.Error(
			"Failed to update job cursor as submited",
			zap.Error(err),
		)
	}
	
	return nil
}

func (a *App) onPluginCalled(work *pipeline.Workpiece, plugin *pipeline.Plugin) {

	cursor := work.ToJobCursor()

	effect := work.GetPluginEffect()

	recordOper := func(opt, op string) {
		err := a.Services().Feature().RecordPluginOperation(
			work.GetJobID(),
			plugin.Key(),
			opt,
			op,
		)

		a.logger.Info(
			"PluginOperation",
			zap.String("job", work.GetJobID()),
			zap.String("plugin", plugin.Key()),
			zap.String("operationType", opt),
			zap.String("operation", op),
		)

		if err != nil {
			a.logger.Error(
				"Failed to record plugin operation",
				zap.Error(err),
			)
		}
	}

	if pipeline.EFFECT_JOB == pipeline.EFFECT_JOB&effect {
		op := json.Diff(string(work.GetOldJob()), string(work.GetJob()))
		opt := operation.EFFECT_JOB
		recordOper(opt, op)
	}

	if pipeline.EFFECT_PIPELINE == pipeline.EFFECT_PIPELINE&effect {
		decision := accessgate.DecisionPass
		if work.IsTerminated() {
			decision = accessgate.DecisionStop
		} else if work.IsSuspended() {
			decision = accessgate.DecisionSuspend
		}
		op := `{
			"decision":"` + decision + `",
			"reason":"` + work.GetReason() + `"
		}`

		opt := operation.EFFECT_PIPELINE
		recordOper(opt, op)
	}

	if pipeline.EFFECT_PARAM == pipeline.EFFECT_PARAM&effect {
		opt := operation.EFFECT_PARAM
		recordOper(opt, cursor.Params)
	}

	err := a.Services().Job().UpdateJobCursor(cursor)

	if err != nil {
		a.logger.Error(
			"Failed to update job cursor",
			zap.Error(err),
		)
	}
}

func (a *App) onJobStateChange(event *api.JobEvent) {

	if nil == event {
		return
	}

	var reason string = "Job Status changed in kubernetes"
	var status *v1.JobStatusDetail

	if nil != event.TaskSet {
		if nil != event.TaskSet.Status {
			reason = event.TaskSet.Status.StateMessage
		}
		jobName := jsoniter.Get(event.Header, header.DefaultHeaderJobName).ToString()
		userID := jsoniter.Get(event.Header, header.DefaultHeaderUserID).ToString()
		jobKind := jsoniter.Get(event.Header, header.DefaultHeaderJobKind).ToString()
		cluster := jsoniter.Get(event.Header, header.DefaultHeaderCluster).ToString()

		status = tasksetFormat.Format(jobName, jobKind, userID, cluster, "", event.TaskSet)

		a.logger.Debug("on job state change, status format:",
			zap.String("jobName", jobName),
			zap.String("userID", userID),
			zap.String("jobKind", jobKind),
			zap.String("cluster", cluster),
			zap.Any("status", status),
			)
		if nil != status {
			reason = status.Job.ExitDiagnostics
		} else {
			a.logger.Error(
				"on job state change but status format failed",
				zap.Any("event", event),
			)
			return
		}
	}

	err := a.Services().Job().UpdateJobStatus(event.JobID, status.Job.State, reason, status)

	if err != nil {
		a.logger.Error(
			"Failed to update job status",
			zap.Error(err),
		)
	}

	if event.EventName != jobstate.FAILED &&
		event.EventName != jobstate.SUCCEEDED {
		return
	}

	err = a.Services().Kubernetes().DeleteJob(event.Namespace, event.JobID)

	if err != nil {
		a.logger.Error(
			"Failed to delete job from kubernetes",
			zap.Error(err),
		)
	}
}
