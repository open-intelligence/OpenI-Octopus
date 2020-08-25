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

package kubernetes

import (
	"fmt"
	typeTaskSet "scheduler/pkg/crd/apis/taskset/v1alpha1"
	api "scheduler/pkg/pipeline/apis/module"
)

//DeleteJob taskset in the k8s
func (s *Service) DeleteJob(namespace, jobID string) error {
	return s.kube.Delete(namespace, jobID)
}

//GetJob finds the job from k8s
func (s *Service) GetJob(namespace, jobID string) (*typeTaskSet.TaskSet, error) {
	return s.kube.Get(namespace, jobID)
}

//SubmitJob  submits the job to k8s
func (s *Service) SubmitJob(ts *typeTaskSet.TaskSet) error {

	return s.kube.Create(ts)
}

func (s *Service) AddEventListener(key string, listener api.KubeEventListener) error {
	if nil == listener {
		return nil
	}

	defer s.mutex.Unlock()
	s.mutex.Lock()

	if nil != s.mailboxes[key] {
		return fmt.Errorf("Listener(%s) already exists", key)
	}

	box := newEventBox(key, 2, listener)

	s.mailboxes[key] = box

	box.run()

	return nil
}

func (s *Service) RemoveEventListener(key string) {
	s.mutex.Lock()
	defer s.mutex.Unlock()
	box := s.mailboxes[key]
	delete(s.mailboxes, key)
	if nil == box {
		return
	}
	box.shutdown()
}
