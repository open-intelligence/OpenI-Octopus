package kubernetes

import (
	typeTaskSet "scheduler/pkg/crd/apis/taskset/v1alpha1"
	api "scheduler/pkg/pipeline/apis/module"
	"scheduler/pkg/pipeline/constants/jobstate"
	"testing"
)

func Test(t *testing.T) {
	service := New(nil, nil)
	done := make(chan int, 0)
	states := make([]string, 0)
	service.AddEventListener("listen", func(event *api.JobEvent) {
		states = append(states, event.EventName)
		if event.EventName == jobstate.FAILED || event.EventName == jobstate.SUCCEEDED {
			done <- 1
		}
	})
	go service.Run()
	ts := &typeTaskSet.TaskSet{}
	ts.Name = "for test"
	ts.Namespace = "default"
	service.SubmitJob(ts)
	<-done
	service.Shutdown()
	if 3 != len(states) {
		t.Error("Missing states")
	}
}
