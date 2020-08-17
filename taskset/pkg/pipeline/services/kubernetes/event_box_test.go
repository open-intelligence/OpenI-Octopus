package kubernetes

import (
	api "scheduler/pkg/pipeline/apis/module"
	"sync"
	"testing"
	"time"
)

func TestEventBox(t *testing.T) {
	eventAmount := 5
	wg := sync.WaitGroup{}
	wg.Add(1)
	var mutex sync.Mutex
	count := 0
	box := newEventBox("test", 2, func(event *api.JobEvent) {
		mutex.Lock()
		count++
		mutex.Unlock()
	})

	box.run()

	go func() {
		for i := 0; i < eventAmount; i++ {
			event := &api.JobEvent{}
			time.Sleep(1 * time.Second)
			box.add(event)
		}
		wg.Done()
	}()

	wg.Wait()

	c := time.After(5 * time.Second)

	<-c
	box.shutdown()
	mutex.Lock()
	defer mutex.Unlock()

	if count != eventAmount {
		t.Error("Missing event")
	}

}
