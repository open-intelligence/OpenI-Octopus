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

package core

import (
	api "scheduler/pkg/pipeline/apis/module"
	libPipeline "scheduler/pkg/pipeline/components/pipeline"
)

//SubmitJob accepts a job, and storage it into database ,and transfer to pipeline
func (s *Service) SubmitJob(jobRecord *api.JobRecord, job []byte) error {
	phase := ""

	if nil != s.app.Pipeline().GetPhase(0) {
		phase = s.app.Pipeline().GetPhase(0).Name()
	}

	cursor := &api.JobCursor{
		UserID:     jobRecord.UserID,
		JobID:      jobRecord.ID,
		Header:     jobRecord.Header,
		Job:        string(job),
		Phase:      phase,
		PluginDone: map[string]bool{},
		Submited:   false,
		Params:     "{}",
	}

	piece, err := libPipeline.NewWorkpieceFromJobCursor(cursor)

	if err != nil {
		return err
	}

	err = s.app.Services().Job().CreateJobCursor(cursor)

	if nil != err {
		return err
	}

	err = s.app.Services().Job().CreateJobRecord(jobRecord, job)

	if nil != err {
		return err
	}

	s.app.Pipeline().AddWorkpiece(piece)

	return nil
}

//StopJob stops the job
func (s *Service) StopJob(jobID, namespace, reason string) error {

	err := s.app.Pipeline().CancelWorkpiece(jobID, reason)

	if err != nil {
		return err
	}

	err = s.app.Services().Job().StopJob(jobID, namespace, reason)
	if err != nil {
		return err
	}

	err = s.app.Services().Kubernetes().DeleteJob(namespace, jobID)

	return err
}

//ResumeJob resumes a suspended job
func (s *Service) ResumeJob(cursor *api.JobCursor, reason string) error {

	if nil == cursor {
		return nil
	}

	workpiece, err := libPipeline.NewWorkpieceFromJobCursor(cursor)

	if err != nil {
		return err
	}

	s.app.Pipeline().AddWorkpiece(workpiece)

	return nil
}
