package lifehook

import (
	libLifeHook "scheduler/pkg/pipeline/components/lifehook"
	libPipeline "scheduler/pkg/pipeline/components/pipeline"
	"sync"
	//"sync"
)

func NewPluginInvoker(stopChan chan int, limiter chan int, states []string, plugin *libPipeline.Plugin, handler TaskHandler) (*PluginInvoker, error) {
	if len(states) < 1 {
		return nil, nil
	}
	invoker := &PluginInvoker{
		plugin:         plugin,
		limiter:        limiter,
		focus:          FormatStatesToStatesProgresses(states),
		stopChan:       stopChan,
		taskLinkerChan: make(chan *libLifeHook.HookTaskStateRequestLinker),
		taskHandler:    handler,
	}
	invoker.Invoke()
	return invoker, nil
}

type TaskHandler func(*libLifeHook.HookTaskRequest, *libLifeHook.HookTaskStateRequestLinker) error

type PluginInvoker struct {
	disabled bool
	//mutex          sync.RWMutex
	limiter        chan int
	stopChan       chan int
	focus          libLifeHook.TaskStatesProgressValue
	plugin         *libPipeline.Plugin
	taskLinkers    sync.Map
	taskLinkerChan chan *libLifeHook.HookTaskStateRequestLinker
	taskHandler    TaskHandler
}

func (iv *PluginInvoker) GetPlugin() *libPipeline.Plugin {
	return iv.plugin
}

func (iv *PluginInvoker) IsDisabled() bool {
	return iv.disabled
}

func (iv *PluginInvoker) Disable() {
	iv.disabled = true
}

func (iv *PluginInvoker) Enable() {
	iv.disabled = false
	iv.Invoke()
}

func (iv *PluginInvoker) lock() {
	if iv.limiter == nil {
		return
	}
	iv.limiter <- 1
}

func (iv *PluginInvoker) unlock() {
	if iv.limiter == nil {
		return
	}
	<-iv.limiter
}

func (iv *PluginInvoker) Invoke() {
	go func() {
		for {
			if iv.IsDisabled() {
				break
			}
			select {
			case taskLinker := <-iv.taskLinkerChan:
				if taskLinker.IsDisabled() {
					iv.taskLinkers.Delete(taskLinker.GetJobId())
					continue
				}

				iv.doTask(taskLinker)
			case <-iv.stopChan:
				iv.Disable()
				close(iv.taskLinkerChan)
				break
			}
		}
	}()
}

func (iv *PluginInvoker) doTask(taskLinker *libLifeHook.HookTaskStateRequestLinker) {
	var act libLifeHook.HookTaskRequestAction = func(task *libLifeHook.HookTaskRequest) error {
		defer func() {
			if taskLinker.IsDisabled() || iv.IsDisabled() {
				// if linker is disabled or task is failure,
				// all subsequent task states are not sent
				// and clean linkers
				iv.taskLinkers.Delete(taskLinker.GetJobId())
			}
		}()

		if task == nil {
			return nil
		}

		iv.lock()
		err := iv.taskHandler(task, taskLinker)
		iv.unlock()
		if err != nil {
			taskLinker.Disable()
			return err
		}
		return nil
	}
	taskLinker.On(iv.focus, act)
	taskLinker.Emit()
}

func (iv *PluginInvoker) AddTasks(tasks []*libLifeHook.HookTaskRequest) {
	for _, t := range tasks {
		iv.AddTask(t)
	}
}

func (iv *PluginInvoker) AddTask(task *libLifeHook.HookTaskRequest) {
	if iv.IsDisabled() {
		return
	}
	newRequestLinker := libLifeHook.NewHookTaskStateRequestLinker(task.GetPluginKey(), task.GetJobId())
	linkerIf, isExisted := iv.taskLinkers.LoadOrStore(task.GetJobId(), newRequestLinker)
	linker := linkerIf.(*libLifeHook.HookTaskStateRequestLinker)
	linker.AddRequest(task)
	if !isExisted {
		iv.taskLinkerChan <- linker
	}
}

func (iv *PluginInvoker) MaybeFault(request *libLifeHook.HookTaskRequest) bool {
	if libLifeHook.TaskStatesProgresses[request.GetJobState()]&
		(libLifeHook.TaskStatesProgressPreparing|libLifeHook.TaskStatesProgressPending) > 0 {
		return false
	}
	// if jobState is not startstate and linker is disabled before
	linker, ok := iv.taskLinkers.Load(request.GetJobId())
	if !ok || linker == nil {
		return true
	}
	if linker != nil && linker.(*libLifeHook.HookTaskStateRequestLinker).IsDisabled() {
		return true
	}
	return false
}

//func (iv *PluginInvoker) RemoveTask(task *libLifeHook.HookTaskRequest) {
//
//}
