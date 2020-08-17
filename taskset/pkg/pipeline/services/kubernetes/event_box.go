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
package kubernetes

import (
	"context"

	"scheduler/pkg/common/list"
	api "scheduler/pkg/pipeline/apis/module"
)

func newEventBox(name string, workerNum int, handler api.KubeEventListener) *eventBox {
	if workerNum < 1 {
		workerNum = 1
	}

	ctx, cancel := context.WithCancel(context.TODO())

	box := &eventBox{
		name:      name,
		workerNum: workerNum,
		ctx:       ctx,
		cancel:    cancel,
		handler:   handler,
		box:       &list.List{},
		event:     make(chan *api.JobEvent, 10),
		dispatch:  make(chan *api.JobEvent, 0),
		ack:       make(chan int, 0),
	}
	return box
}

func (e *eventBox) run() {
	e.wg.Add(1 + e.workerNum)
	go e.dispatchEvent()
	for i := 0; i < e.workerNum; i++ {
		go e.processEvent()
	}
}

func (e *eventBox) shutdown() {
	e.cancel()
	e.wg.Wait()
}

func (e *eventBox) add(event *api.JobEvent) {
	e.event <- event
}

func (e *eventBox) dispatchEvent() {
	stopped := false
	idleNum := 0
	for {
		if true == stopped {
			break
		}
		select {
		case event := <-e.event:
			{
				if idleNum > 0 {
					e.dispatch <- event
					idleNum--
				} else {
					e.box.Push(event)
				}
			}
		case <-e.ctx.Done():
			{
				stopped = true
				break
			}
		case <-e.ack:
			{
				idleNum++
				count := idleNum
				for i := 0; i < count; i++ {
					item := e.box.Shift()
					if nil == item {
						break
					}
					event := item.(*api.JobEvent)
					e.dispatch <- event
					idleNum--
				}
			}
		}
	}
	e.wg.Done()
}

func (e *eventBox) processEvent() {
	stopped := false
	e.ack <- 0
	for {
		if true == stopped {
			break
		}
		select {
		case <-e.ctx.Done():
			{
				stopped = true
				break
			}
		case event := <-e.dispatch:
			{
				if nil != event {
					e.handler(event)
				}
				e.ack <- 0
			}
		}
	}
	e.wg.Done()
}
