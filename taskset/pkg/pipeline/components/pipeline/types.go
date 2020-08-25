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
	libSelector "scheduler/pkg/pipeline/components/selector"
	"sync"

	"k8s.io/client-go/util/workqueue"
)

type EventHandlerFuncs struct {
	DoneFunc         func(work *Workpiece) error
	StopFunc         func(work *Workpiece) error
	SuspendFunc      func(work *Workpiece) error
	UnexpectFunc     func(work *Workpiece) error
	PluginCalledFunc func(work *Workpiece, plugin *Plugin)
}

type Pipeline struct {
	mutex             sync.RWMutex
	features          map[string]*Feature
	phases            []Phase
	plugins           map[string][]*Plugin
	workerAmount      int
	workpieces        *sync.Map
	jobChannel        chan *Workpiece
	actionChannel     chan *action
	eventQueue        *queue
	exitSigChan       chan struct{}
	waitGroup         sync.WaitGroup
	jobQueue          workqueue.RateLimitingInterface
	eventHandlers     *EventHandlerFuncs
	pluginProcessFunc func(*Workpiece, *Plugin) ([]byte, error)
}

type Feature struct {
	name        string
	author      string
	enabled     bool
	description string
	plugins     []*Plugin
}

type Plugin struct {
	key           string
	feature       string
	phase         string // the phase of plugin
	description   string
	sequence      int64
	selector      *libSelector.Selector
	callback      string
	authorization string
}

const (
	EFFECT_PIPELINE = 1 //001
	EFFECT_JOB      = 2 //010
	EFFECT_PARAM    = 4 //100
)

//Workpiece is the job on the pipeline
type Workpiece struct {
	userID        string
	jobID         string
	phase         string
	pluginDone    map[string]bool
	pluginMatched []*Plugin
	pluginEffect  int
	reason        string
	terminated    bool
	suspended     bool
	stopped       bool
	oldJob        []byte
	job           []byte
	header        []byte
	params        map[string]map[string][]interface{}
}

const (
	_ACTION_PREPARE  = 1
	_ACTION_SUSPEND  = 2
	_ACTION_STOP     = 3
	_ACTION_COMPLETE = 4
	_ACTION_CLEAN    = 5
	_ACTION_UNEXPECT = 6
)
