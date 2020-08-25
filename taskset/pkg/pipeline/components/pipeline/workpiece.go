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

package pipeline

import (
	api "scheduler/pkg/pipeline/apis/module"

	jsoniter "github.com/json-iterator/go"
)

//GetJobID returns the job id of this workpiece
func (w *Workpiece) GetJobID() string {
	return w.jobID
}

//GetUserID returns the user's id of this workpiece
func (w *Workpiece) GetUserID() string {
	return w.userID
}

//GetPhase returns the phase that the workpiece in the pipeline at current
func (w *Workpiece) GetPhase() string {
	return w.phase
}

func (w *Workpiece) GetReason() string {
	return w.reason
}

//GetJob returns the job template
func (w *Workpiece) GetJob() []byte {
	return w.job
}

//GetHeader returns the header of the job
func (w *Workpiece) GetHeader() []byte {
	return w.header
}

//GetOldJob returns the job template before now
func (w *Workpiece) GetOldJob() []byte {
	return w.oldJob
}

//GetPluginEffect returns the effects that the plugin made
func (w *Workpiece) GetPluginEffect() int {
	return w.pluginEffect
}

//IsTerminated returns true if the workpiece is terminated
func (w *Workpiece) IsTerminated() bool {
	return w.terminated
}

//IsSuspended returns true if the workpiece is suspended
func (w *Workpiece) IsSuspended() bool {
	return w.suspended
}

func (w *Workpiece) IsStopped() bool {
	return w.stopped
}

//DidPluginAlreadyDone returns true if a given plugin has already been executed
func (w *Workpiece) DidPluginAlreadyDone(plugin *Plugin) bool {
	return w.pluginDone[plugin.Key()]
}

//PutParam set a pipe
func (w *Workpiece) PutParam(name string, value interface{}) {

	if nil == w.params {
		w.params = make(map[string]map[string][]interface{}, 0)
	}

	if nil == w.params[w.phase] {
		w.params[w.phase] = make(map[string][]interface{})
	}

	if nil == w.params[w.phase][name] {
		w.params[w.phase][name] = make([]interface{}, 0)
	}

	w.pluginEffect = w.pluginEffect | EFFECT_PARAM

	w.params[w.phase][name] = append(w.params[w.phase][name], value)
}

//DeleteParam delete the specific param
func (w *Workpiece) DeleteParam(name string) {
	if nil == w.params {
		return
	}

	phase := w.params[w.phase]
	if phase != nil {
		w.pluginEffect = w.pluginEffect | EFFECT_PARAM
		delete(phase, name)
	}
}

//GetParam returns the specific param that is setted by the phase
func (w *Workpiece) GetParam(name string) []interface{} {

	if nil == w.params {
		return nil
	}

	params := w.params[w.phase]

	if params != nil {
		return params[name]
	}

	return nil
}

//Suspend  the workpiece
func (w *Workpiece) Suspend(reason string) {

	if true == w.suspended || true == w.terminated || true == w.stopped {
		return
	}

	w.pluginEffect = w.pluginEffect | EFFECT_PIPELINE

	w.suspended = true

	w.reason = reason
}

func (w *Workpiece) Stop(reason string) {
	if true == w.suspended || true == w.terminated || true == w.stopped {
		return
	}
	w.pluginEffect = w.pluginEffect | EFFECT_PIPELINE

	w.stopped = true

	w.reason = reason
}

//Terminate the workpiece
func (w *Workpiece) Terminate(reason string) {

	if true == w.terminated {
		return
	}

	w.pluginEffect = w.pluginEffect | EFFECT_PIPELINE
	w.terminated = true
	w.reason = reason
}

//UpdateJob updates the job template
func (w *Workpiece) UpdateJob(job []byte) {
	w.oldJob = w.job
	w.job = job
	w.pluginEffect = w.pluginEffect | EFFECT_JOB
}

func (w *Workpiece) ToJobCursor() *api.JobCursor {
	cursor := &api.JobCursor{
		UserID:     w.userID,
		JobID:      w.jobID,
		Phase:      w.phase,
		Job:        string(w.job),
		Header:     string(w.header),
		PluginDone: map[string]bool{},
		Submited:   false,
	}

	buf, err := jsoniter.Marshal(w.pluginDone)

	if err != nil {
		buf = []byte("{}")
	}

	err = jsoniter.Unmarshal(buf, &cursor.PluginDone)

	buf, err = jsoniter.Marshal(w.params)

	if err == nil {
		cursor.Params = string(buf)
	} else {
		cursor.Params = "{}"
	}

	return cursor
}

//NewWorkpieceFromJobCursor creates a workpiece according to job cursor
func NewWorkpieceFromJobCursor(cursor *api.JobCursor) (*Workpiece, error) {
	if nil == cursor {
		return nil, nil
	}

	piece := &Workpiece{
		userID:        cursor.UserID,
		jobID:         cursor.JobID,
		phase:         cursor.Phase,
		pluginDone:    map[string]bool{},
		pluginMatched: nil,
		pluginEffect:  0,
		reason:        "",
		terminated:    false,
		suspended:     false,
		stopped:       false,
		job:           []byte(cursor.Job),
		header:        []byte(cursor.Header),
	}

	if "" != cursor.Params {
		params := map[string]map[string][]interface{}{}
		err := jsoniter.UnmarshalFromString(cursor.Params, &params)
		if nil != err {
			return nil, err
		}
		piece.params = params
	}

	buf, err := jsoniter.Marshal(cursor.PluginDone)

	if err != nil {
		return nil, err
	}

	err = jsoniter.Unmarshal(buf, &piece.pluginDone)

	if nil != err {
		return nil, err
	}
	return piece, nil
}
