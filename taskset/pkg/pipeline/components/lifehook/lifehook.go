package lifehook

import (
	libSelector "scheduler/pkg/pipeline/components/selector"
	"sync/atomic"

	jsoniter "github.com/json-iterator/go"

	//"sort"
	"strings"
)

func (m *HookTaskMessage) ToString() (string, error) {
	ms, err := jsoniter.Marshal(m)
	if err != nil {
		return "", err
	}
	return string(ms), nil
}

func (rl *HookTaskStateRequestLinker) nextProgress(progressChecker TaskStatesProgressValue) {
	for {
		if rl.progress&TaskStatesProgressEnded > 0 {
			rl.setProgress(TaskStatesProgressEnded)
			return
		}

		expectProgress := rl.progress << 1

		//if expectProgress > TaskStatesProgressNormalCompleted {
		//	rl.setProgress(TaskStatesProgressEnded)
		//	return
		//}

		rl.setProgress(expectProgress)
		if progressChecker&expectProgress > 0 {
			return
		}
	}
}

func (rl *HookTaskStateRequestLinker) setAction(act func() error) {
	if nil == act {
		return
	}
	rl.action = act
}

func (rl *HookTaskStateRequestLinker) tryDoAction() bool {
	return atomic.CompareAndSwapUint32(&rl.actionState, 0, 1)
}

func (rl *HookTaskStateRequestLinker) tryReleaseAction() bool {
	return atomic.CompareAndSwapUint32(&rl.actionState, 1, 0)
}

func (rl *HookTaskStateRequestLinker) GetProgress() TaskStatesProgressValue {
	return rl.progress
}

func (rl *HookTaskStateRequestLinker) setProgress(p TaskStatesProgressValue) {
	rl.progress = p
}

func (rl *HookTaskStateRequestLinker) GetJobId() string {
	return rl.jobId
}

func (rl *HookTaskStateRequestLinker) AddRequest(request *HookTaskRequest) {
	rl.requests.Store(TaskStatesProgresses[request.jobState], request)
	if rl.GetProgress() == TaskStatesProgressPreparing &&
		TaskStatesProgresses[request.jobState] == TaskStatesProgressPending {
		// now job event has not preparing
		rl.setProgress(TaskStatesProgressPending)
	}
	rl.Emit()
}

func (rl *HookTaskStateRequestLinker) Disable() {
	rl.stateMutex.Lock()
	defer rl.stateMutex.Unlock()
	rl.disabled = true
}

func (rl *HookTaskStateRequestLinker) IsDisabled() bool {
	rl.stateMutex.RLock()
	defer rl.stateMutex.RUnlock()
	return rl.disabled
}

func (rl *HookTaskStateRequestLinker) next(focus TaskStatesProgressValue) *HookTaskRequest {

	cp := rl.progress
	// task state has ending, close linker
	if cp == TaskStatesProgressEnded || focus < 1 {
		rl.Disable()
		return nil
	}

	defer func() {
		if rl.GetProgress() == TaskStatesProgressEnded {
			rl.Disable()
		}
	}()

	var req *HookTaskRequest

	// task state exception, return exception and close linker
	if r, ok := rl.requests.Load(TaskStatesProgressSuspended); ok {
		rl.setProgress(TaskStatesProgressSuspended)
		cp = TaskStatesProgressSuspended
		req = r.(*HookTaskRequest)
	} else if r, ok := rl.requests.Load(TaskStatesProgressUnknown); ok {
		rl.setProgress(TaskStatesProgressUnknown)
		cp = TaskStatesProgressUnknown
		req = r.(*HookTaskRequest)
	} else if r, ok := rl.requests.Load(TaskStatesProgressStopped); ok {
		rl.setProgress(TaskStatesProgressStopped)
		cp = TaskStatesProgressStopped
		req = r.(*HookTaskRequest)
	} else {
		//if cp == TaskStatesProgressPreparing {
		//	// now job event has not preparing
		//	cp = TaskStatesProgressPending
		//	rl.setProgress(TaskStatesProgressPending)
		//}
		//  handled and pass
		//	if request.IsOver() && rl.GetProgress() == TaskStatesProgresses[request.jobState] {
		//		rl.NextProgress(TaskStatesProgressCompleted | TaskStatesProgressAbnormal)
		//	}

		if (focus & cp) < 1 {
			rl.nextProgress(focus)
			return rl.next(focus)
		}

		if r, ok := rl.requests.Load(cp); !ok || r == nil {
			// event is not yet arrived
			return nil
		} else {
			req = r.(*HookTaskRequest)
		}
	}

	rl.nextProgress(focus)
	// whether or not on focus
	if !req.IsOver() && (focus&cp > 0) {
		return req
	}
	return nil
}

func (rl *HookTaskStateRequestLinker) On(focus TaskStatesProgressValue, act HookTaskRequestAction) {
	if nil == act {
		return
	}
	rl.setAction(func() error {
		for {
			req := rl.next(focus)
			if req == nil {
				return nil
			}
			err := act(req)
			if err != nil {
				return err
			}
		}
	})
}

func (rl *HookTaskStateRequestLinker) Emit() {
	go func() {
		var err error
		if rl.action != nil && rl.tryDoAction() {
			err = rl.action()
			if err != nil {
				rl.Disable()
			}
			for {
				if rl.tryReleaseAction() {
					break
				}
			}
		}
	}()
}

func NewHookTaskStateRequestLinker(pluginKey string, jobId string) *HookTaskStateRequestLinker {
	newLinker := &HookTaskStateRequestLinker{
		jobId:     jobId,
		pluginKey: pluginKey,
	}
	newLinker.setProgress(TaskStatesProgressPreparing)
	return newLinker
}

func (p *LifeHookPluginProvider) GetValue(cond *libSelector.Cond) (bool, error) {

	keys := strings.Split(cond.GetKey(), ".")

	paths := make([]interface{}, len(keys))

	for i := 0; i < len(keys); i++ {
		paths[i] = keys[i]
	}

	value := jsoniter.Get(p.headers, paths...).ToString()
	return cond.Test(value), nil

}

func NewLifePluginProvider(headers []byte) *LifeHookPluginProvider {
	return &LifeHookPluginProvider{
		headers: headers,
	}
}
