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
	"fmt"
	v1 "scheduler/pkg/pipeline/apis/http/v1"
	typeTaskset "scheduler/pkg/crd/apis/taskset/v1alpha1"
	api "scheduler/pkg/pipeline/apis/module"
	"scheduler/pkg/pipeline/constants/jobstate"
	models "scheduler/pkg/pipeline/models/job"
	"strings"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"github.com/jinzhu/gorm"
	jsoniter "github.com/json-iterator/go"
	json "encoding/json"
	"time"
)

func (s *Service) GetJobRecord(jobID string) (*api.JobRecord, error) {

	job := &models.Job{}

	var session *gorm.DB

	session = s.app.Services().Storage().GetDB().Where("id = ?", jobID).First(job)

	if session.Error != nil && !session.RecordNotFound() {
		return nil, session.Error
	}

	if session.RecordNotFound() {
		return nil, nil
	}

	record := &api.JobRecord{
		ID:          job.ID,
		Name:        job.Name,
		UserID:      job.UserID,
		Kind:        job.Kind,
		Cluster:     job.Cluster,
		Namespace:   job.Namespace,
		Header:      job.Header,
		Config:      job.Config,
		Detail:      job.Detail,
		State:       job.State,
		StateReason: job.StateReason,
		StateSummary: job.StateSummary,
		CreatedAt:   job.CreatedAt,
		UpdatedAt:   job.UpdatedAt,
		CompletedAt: job.CompletedAt,
	}

	return record, nil
}

func (s *Service) CreateJobRecord(jobRecord *api.JobRecord, job []byte) error {

	record := &models.Job{
		ID:          jobRecord.ID,
		UserID:      jobRecord.UserID,
		Kind:        jobRecord.Kind,
		Name:        jobRecord.Name,
		Cluster:     jobRecord.Cluster,
		Namespace:   jobRecord.Namespace,
		Header:      jobRecord.Header,
		Config:      string(job),
		Detail:      "{}",
		State:       jobstate.PREPARING,
		StateReason: "new job",
		StateSummary: "[]",
	}

	session := s.app.Services().Storage().GetDB().Create(record)

	return session.Error

}

func (s *Service) UpdateJobStatus(jobID, state, reason string, status *v1.JobStatusDetail) error {

	if "" == jobID || "" == state {
		return fmt.Errorf("update job status but id or state is nil { jobID: %s, state: %s }", jobID, state)
	}

	legalStates := currentLegalStates(state)

	if len(legalStates) == 0 {
		return fmt.Errorf("Unrecognized state:%s", state)
	}

	job := &models.Job{
		State:       state,
		StateReason: reason,
	}

	if isCompletedStates(state) {
		now := time.Now()
		job.CompletedAt = &now
	}

	if nil != status {
		buf, err := jsoniter.Marshal(status)

		if err != nil {
			return err
		}

		job.Detail = string(buf)
	}

	session := s.app.Services().Storage().GetDB().Model(job).Where("id = ? AND state IN(?)", jobID, legalStates).Update(job)

	return session.Error
}

func (s *Service) UpdateJobSummary(jobID string, stateSummary *typeTaskset.TaskMessage) error{

	job := &models.Job{}

	var session *gorm.DB

	session = s.app.Services().Storage().GetDB().Where("id = ?", jobID).First(job)

	if session.Error != nil && !session.RecordNotFound() {
		return session.Error
	}

	if session.RecordNotFound() {
		return nil
	}

	var message []typeTaskset.TaskMessage = []typeTaskset.TaskMessage{}

	err := json.Unmarshal([]byte(job.StateSummary), &message)

	if nil != err {
		fmt.Println(err)
		return err
	}

	message = append(message, *stateSummary)
	
	buf, err := json.Marshal(message)

	if err != nil {
		return err
	}

	newJob := &models.Job{}
	newJob.StateSummary  = string(buf)

	session = s.app.Services().Storage().GetDB().Model(newJob).Where("id = ?", jobID).Update(newJob)

	return session.Error
}

func(s *Service) ReplenishJobOnOver(jobID, state, namespace string) error {
	if state != jobstate.FAILED &&
		state != jobstate.SUCCEEDED {
		return nil
	}
	record, err := s.GetJobRecord(jobID)
	if err != nil {
		return err
	}
	if record == nil {
		return fmt.Errorf("NotFound job to replenish:" + jobID)
	}
	if record.State != state {
		return nil
	}

	var status v1.JobStatusDetail
	if record.Detail != "{}" && record.Detail != "" {
		err = jsoniter.Unmarshal([]byte(record.Detail), &status)
		if err != nil {
			return err
		}

		// see pkg/pipeline/utils/taskset/format.go
		// convert state from taskset to record
		var needReplenish bool = false
		if status.Job != nil {
			for _, role := range status.Tasks {
				if role.State != jobstate.SUCCEEDED &&
					role.State != jobstate.FAILED &&
					role.State != jobstate.STOPPED {
					role.State = jobstate.STOPPED
					needReplenish = true
				}
				if role.Replicas == nil {
					continue
				}
				for _, roleReplica :=range role.Replicas {
					if roleReplica.State != jobstate.SUCCEEDED &&
						roleReplica.State != jobstate.FAILED &&
						roleReplica.State != jobstate.STOPPED {
						roleReplica.State = jobstate.STOPPED
						needReplenish = true
					}

					if roleReplica.FinishedAt == nil {
						roleReplica.FinishedAt = status.Job.FinishedAt
						needReplenish = true
					}
				}
			}
		}
		if needReplenish {
			buf, err := jsoniter.Marshal(status)
			if err != nil {
				return err
			}


			job := &models.Job{
				ID:       jobID,
			}
			job.Detail = string(buf)
			err = s.app.Services().Storage().GetDB().Model(job).Where("id = ? AND state = ?", jobID, state).Update(job).Error
		}
	}

	if err != nil {
		return err
	}
	return nil
}


func (s *Service) StopJob(jobID, namespace, reason string) error {
	record, err := s.GetJobRecord(jobID)
	if err != nil {
		return err
	}
	if record == nil {
		return fmt.Errorf("NotFound job to stop:" + jobID)
	}
	if record.State == jobstate.STOPPED {
		return nil
	}

	var status v1.JobStatusDetail
	if record.Detail != "{}" && record.Detail != "" {
		err = jsoniter.Unmarshal([]byte(record.Detail), &status)
		if err != nil {
			return err
		}

		// see pkg/pipeline/utils/taskset/format.go
		// convert state from taskset to record
		if status.Job != nil {
			status.Job.State = jobstate.STOPPED
			if status.Job.FinishedAt == nil {
				status.Job.FinishedAt = &metav1.Time{Time: time.Now()}
			}

			for _, role := range status.Tasks {
				if role.State != jobstate.SUCCEEDED &&
					role.State != jobstate.FAILED &&
					role.State != jobstate.STOPPED {
					role.State = jobstate.STOPPED
				}
				if role.Replicas == nil {
					continue
				}
				for _, roleReplica :=range role.Replicas {
					if roleReplica.State != jobstate.SUCCEEDED &&
						roleReplica.State != jobstate.FAILED &&
						roleReplica.State != jobstate.STOPPED {
						roleReplica.State = jobstate.STOPPED
					}

					if roleReplica.FinishedAt == nil {
						roleReplica.FinishedAt = &metav1.Time{Time: time.Now()}
					}
				}
			}
		}
		err = s.UpdateJobStatus(jobID, jobstate.STOPPED, reason, &status)
	} else {
		err = s.UpdateJobStatus(jobID, jobstate.STOPPED, reason, nil)
	}

	if err != nil {
		return err
	}
	return nil
}

//LoadJobsInPipeline load jobs that is still in the pipeline from database
func (s *Service) LoadJobsInPipeline() ([]*api.JobCursor, error) {

	var jobs []models.Job

	session := s.app.Services().Storage().GetDB().Where("state = ?", jobstate.PREPARING).Find(&jobs)

	if session.Error != nil {
		return nil, session.Error
	}

	if nil == jobs || len(jobs) == 0 {
		return nil, nil
	}

	cursors := make([]*api.JobCursor, 0, 10)

	for i := 0; i < len(jobs); i++ {

		job := jobs[i]

		cursorRecord := &models.JobCursor{}

		session = s.app.Services().Storage().GetDB().Where("id = ?", job.ID).First(cursorRecord)

		if session.Error != nil && !session.RecordNotFound() {
			return nil, session.Error
		}

		if session.RecordNotFound() {
			cursor := &api.JobCursor{
				JobID:  job.ID,
				UserID: job.UserID,
				Header: job.Header,
				Job:    job.Config,
			}

			cursors = append(cursors, cursor)
			continue
		}

		if cursorRecord.Submited {
			continue
		}

		cursor := &api.JobCursor{
			JobID:      job.ID,
			UserID:     job.UserID,
			Header:     job.Header,
			Job:        cursorRecord.TaskSet,
			Phase:      cursorRecord.Phase,
			PluginDone: map[string]bool{},
			Params:     cursorRecord.Params,
		}
		if "" == cursorRecord.PluginExecuted {
			cursorRecord.PluginExecuted = "{}"
		}

		err := jsoniter.Unmarshal([]byte(cursorRecord.PluginExecuted), &cursor.PluginDone)

		if nil != err {
			return nil, err
		}

		cursors = append(cursors, cursor)
	}

	return cursors, nil
}

func (s *Service) GetJobCursor(jobID string) (*api.JobCursor, error) {

	cursorRecord := &models.JobCursor{}

	session := s.app.Services().Storage().GetDB().Model(cursorRecord).Where("id = ?", jobID).First(cursorRecord)

	if session.Error != nil && !session.RecordNotFound() {
		return nil, session.Error
	}

	if session.RecordNotFound() {
		return nil, nil
	}

	cursor := &api.JobCursor{
		UserID:     cursorRecord.UserID,
		JobID:      cursorRecord.ID,
		Phase:      cursorRecord.Phase,
		PluginDone: map[string]bool{},
		Job:        cursorRecord.TaskSet,
		Header:     "",
		Params:     cursorRecord.Params,
		Submited:   cursorRecord.Submited,
	}

	if "" == cursorRecord.PluginExecuted {
		cursorRecord.PluginExecuted = "{}"
	}

	err := jsoniter.Unmarshal([]byte(cursorRecord.PluginExecuted), &cursor.PluginDone)

	return cursor, err
}

func (s *Service) CreateJobCursor(cursor *api.JobCursor) error {

	buf, err := jsoniter.Marshal(cursor.PluginDone)

	if nil != err {
		return err
	}

	cursorModel := &models.JobCursor{
		ID:             cursor.JobID,
		UserID:         cursor.UserID,
		Phase:          cursor.Phase,
		Params:         cursor.Params,
		PluginExecuted: string(buf),
		Submited:       cursor.Submited,
		TaskSet:        cursor.Job,
	}

	session := s.app.Services().Storage().GetDB().Create(cursorModel)

	return session.Error

}

func (s *Service) UpdateJobCursor(cursor *api.JobCursor) error {
	cursorModel := &models.JobCursor{
		ID:       cursor.JobID,
		UserID:   cursor.UserID,
		Phase:    cursor.Phase,
		Params:   cursor.Params,
		Submited: cursor.Submited,
		TaskSet:  cursor.Job,
	}

	fields := []interface{}{}

	if "" != cursor.Phase {
		fields = append(fields, "phase")
	}
	if "" != cursor.Params {
		fields = append(fields, "params")
	}

	if "" != cursor.Job {
		fields = append(fields, "taskset")
	}

	if nil != cursor.PluginDone {
		buf, err := jsoniter.Marshal(cursor.PluginDone)
		if nil != err {
			return err
		}

		cursorModel.PluginExecuted = string(buf)

		fields = append(fields, "plugin_executed")
	}

	session := s.app.Services().Storage().GetDB().Model(cursorModel).Select("submited", fields...).
		Where("id = ?", cursor.JobID).Updates(cursorModel)

	return session.Error
}

func (s *Service) SearchJobs(query *v1.QueryParams) ([]*v1.JobItem, error) {

	sql, options := buildQuerySql(query)

	jobs := []models.Job{}

	db := s.app.Services().Storage().GetDB().Model(&models.Job{}).Where(sql, options...)

	if "" != sql {
		db = db.Where(sql, options...)
	}

	if strings.ToLower(query.Order) == "desc" {
		db = db.Order("created_at desc")
	}

	if strings.ToLower(query.Order) == "asc" {
		db = db.Order("created_at asc")
	}

	if 0 == query.PageNumber || 0 == query.PageSize {
		return nil, fmt.Errorf("Query Parameter 'PageSize' and 'PageNumber' can't be zero")
	}

	session := db.Limit(query.PageSize).Offset(query.PageSize * (query.PageNumber - 1)).Find(&jobs)

	if session.Error != nil && !session.RecordNotFound() {
		return nil, session.Error
	}

	if session.RecordNotFound() {
		return []*v1.JobItem{}, nil
	}

	list := make([]*v1.JobItem, len(jobs))

	for i := 0; i < len(jobs); i++ {
		job := &jobs[i]

		item := &v1.JobItem{
			JobID:     job.ID,
			UserID:    job.UserID,
			JobName:   job.Name,
			JobKind:   job.Kind,
			State:     job.State,
			CreatedAt: job.CreatedAt,
			Namespace: job.Namespace,
			Config:    job.Config,
		}

		if "" != job.Detail && "{}" != job.Detail {
			var status *v1.JobStatusDetail
			err := jsoniter.Unmarshal([]byte(job.Detail), &status)
			if err != nil {
				continue
			}
			//item.Platform = status.PlatformSpecificInfo.Platform
			//item.TotalRetriedCount = status.Job.TotalRetriedCount
			//item.ExitCode = status.Job.ExitCode
			//item.ExitDiagnostics = status.Job.ExitDiagnostics
			item.Detail = status
			item.Detail.Cluster.Identity = job.Cluster
		}

		if job.CompletedAt != nil {
			item.FinishedAt = job.CompletedAt
		}
		list[i] = item
	}

	return list, nil
}

func (s *Service) GetJobAmount(query *v1.QueryParams) (int64, error) {

	var amount int64

	sql, options := buildQuerySql(query)

	db := s.app.Services().Storage().GetDB().Model(&models.Job{}).Where(sql, options...)

	if "" != sql {
		db = db.Where(sql, options...)
	}

	session := db.Count(&amount)

	if session.Error != nil && !session.RecordNotFound() {
		return 0, session.Error
	}

	if session.RecordNotFound() {
		return 0, nil
	}
	return amount, nil
}
