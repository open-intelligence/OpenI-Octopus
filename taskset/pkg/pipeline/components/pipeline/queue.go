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
	"scheduler/pkg/common/list"
	"sync"
)

type action struct {
	job    string
	action int
	reason string
	done   chan *action
}

type queue struct {
	mutex sync.Mutex
	pool  sync.Pool
	jobs  map[string]*list.List
}

func (q *queue) add(act *action) {
	if act.job == "" {
		return
	}
	q.mutex.Lock()
	if nil == q.jobs[act.job] {
		st := q.pool.Get().(*list.List)
		st.Reset()
		q.jobs[act.job] = st
	}

	q.jobs[act.job].Push(act)

	q.mutex.Unlock()
}
func (q *queue) delete(job string) {
	q.mutex.Lock()
	list := q.jobs[job]
	q.recycle(list)
	delete(q.jobs, job)
	q.mutex.Unlock()
}

func (q *queue) reAdd(job string, list *list.List) {
	q.mutex.Lock()
	nList := q.jobs[job]
	if nil != nList {
		for i := 0; i < nList.Len(); i++ {
			list.Push(nList.Get(i))
		}
	}
	q.jobs[job] = list
	q.mutex.Unlock()
}

func (q *queue) get(job string) *list.List {
	var list *list.List
	q.mutex.Lock()
	list = q.jobs[job]
	delete(q.jobs, job)
	q.mutex.Unlock()
	return list
}

func (q *queue) recycle(st *list.List) {
	if nil != st {
		q.pool.Put(st)
	}
}

func makeQueue() *queue {

	c := &queue{}

	c.pool.New = func() interface{} {
		return new(list.List)
	}

	c.jobs = make(map[string]*list.List, 1000)

	return c
}
