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

package controller

import (
	typeTaskSet "scheduler/pkg/crd/apis/taskset/v1alpha1"
	"testing"
)

func TestIsTaskRoleNamingConflict(t *testing.T) {

	ts := &typeTaskSet.TaskSet{
		Spec: typeTaskSet.TaskSetSpec{
			Roles: []typeTaskSet.TaskRole{
				typeTaskSet.TaskRole{
					Name: "r1",
				},
				typeTaskSet.TaskRole{
					Name: "r2",
				},
			},
		},
	}

	conflict, name := isTaskRoleNamingConflict(ts)

	if true == conflict {
		t.Error("conflict should be false")
	}

	cName := "r1"

	ts = &typeTaskSet.TaskSet{
		Spec: typeTaskSet.TaskSetSpec{
			Roles: []typeTaskSet.TaskRole{
				typeTaskSet.TaskRole{
					Name: cName,
				},
				typeTaskSet.TaskRole{
					Name: cName,
				},
			},
		},
	}

	conflict, name = isTaskRoleNamingConflict(ts)

	if false == conflict {
		t.Error("conflict should be true")
	}

	if name != cName {
		t.Errorf("The conflict name should be %s", cName)
	}
}

func TestIsTaskSetCompletionPolicyIllegal(t *testing.T) {
	var illegal bool = false
	ts := &typeTaskSet.TaskSet{
		Spec: typeTaskSet.TaskSetSpec{
			Roles: []typeTaskSet.TaskRole{
				typeTaskSet.TaskRole{
					Replicas: 1,
					CompletionPolicy: typeTaskSet.CompletionPolicy{
						MaxFailed:    0,
						MinSucceeded: 1,
					},
				},
			},
		},
	}

	illegal, _ = isTaskSetCompletionPolicyIllegal(ts)

	if true == illegal {
		t.Error("ts should be legal when MaxFailed is 0 and MinSucceeded is 1")
	}

	ts = &typeTaskSet.TaskSet{
		Spec: typeTaskSet.TaskSetSpec{
			Roles: []typeTaskSet.TaskRole{
				typeTaskSet.TaskRole{
					Replicas: 1,
					CompletionPolicy: typeTaskSet.CompletionPolicy{
						MaxFailed:    -1,
						MinSucceeded: 1,
					},
				},
			},
		},
	}

	illegal, _ = isTaskSetCompletionPolicyIllegal(ts)

	if false == illegal {
		t.Error("ts should be illegal when MaxFailed is -1 and MinSucceeded is 1")
	}

	ts = &typeTaskSet.TaskSet{
		Spec: typeTaskSet.TaskSetSpec{
			Roles: []typeTaskSet.TaskRole{
				typeTaskSet.TaskRole{
					Replicas: 1,
					CompletionPolicy: typeTaskSet.CompletionPolicy{
						MaxFailed:    0,
						MinSucceeded: 0,
					},
				},
			},
		},
	}

	illegal, _ = isTaskSetCompletionPolicyIllegal(ts)

	if false == illegal {
		t.Error("ts should be illegal when minFailed is 0 and MinSucceeded is 0")
	}

	ts = &typeTaskSet.TaskSet{
		Spec: typeTaskSet.TaskSetSpec{
			Roles: []typeTaskSet.TaskRole{
				typeTaskSet.TaskRole{
					Replicas: 1,
					CompletionPolicy: typeTaskSet.CompletionPolicy{
						MaxFailed:    0,
						MinSucceeded: 2,
					},
				},
			},
		},
	}

	illegal, _ = isTaskSetCompletionPolicyIllegal(ts)

	if false == illegal {
		t.Error("ts should be illegal when replica is 1 and MinSucceeded is 2")
	}

	ts = &typeTaskSet.TaskSet{
		Spec: typeTaskSet.TaskSetSpec{
			Roles: []typeTaskSet.TaskRole{
				typeTaskSet.TaskRole{
					Replicas: 1,
					CompletionPolicy: typeTaskSet.CompletionPolicy{
						MaxFailed:    2,
						MinSucceeded: 1,
					},
				},
			},
		},
	}

	illegal, _ = isTaskSetCompletionPolicyIllegal(ts)

	if false == illegal {
		t.Error("ts should be illegal when replica is 1 and MaxFailed is 2")
	}

}
