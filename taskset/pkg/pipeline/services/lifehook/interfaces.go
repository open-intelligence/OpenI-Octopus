package lifehook

import (
	"fmt"
	"net/http"
	api "scheduler/pkg/pipeline/apis/common"
	"scheduler/pkg/pipeline/apis/module"
	"scheduler/pkg/pipeline/app"
	libLifeHook "scheduler/pkg/pipeline/components/lifehook"
	libPipeline "scheduler/pkg/pipeline/components/pipeline"
	jsoniter "github.com/json-iterator/go"
	"scheduler/pkg/pipeline/constants/header"
	"scheduler/pkg/pipeline/config"
	"scheduler/pkg/pipeline/utils"
	"time"

	"go.uber.org/zap"
)

func New(app *app.App, config *config.LifeHookConfig) *Service {
	service := &Service{
		app:    app,
		logger: app.Logger().Named("svc-lifehook"),
		name:   "LIFEHOOK-" + utils.GetRandomString(8),
		config: config,
		httpClient: &http.Client{
			Timeout: time.Duration(time.Duration(config.RequestTimeOutSec) * time.Second),
		},
		stopChan:                 make(chan int),
		historyRequests:          make(map[string][]*libLifeHook.HookTaskRequest),
		lifeHookStateInvokersMap: make(map[string][]*PluginInvoker),
	}
	if config.MaxParallelProcessRequest < 1 {
		service.requestLimiter = make(chan int, config.MaxParallelProcessRequest)
	}
	return service
}

func (lh *Service) Run() error {
	if lh.isRunning {
		return nil
	}

	// add k8s listener
	var listener module.KubeEventListener = func(event *module.JobEvent) {
		err := lh.Emit(event)
		if err != nil {
			lh.logger.Error(err.Error(),
				zap.String("JobID", event.JobID),
				zap.String("EventName", event.EventName),
				zap.String("Namespace", event.Namespace),
			)
		}
	}
	err := lh.app.Services().Kubernetes().AddEventListener(lh.name, listener)
	if err != nil {
		return err
	}

	lh.isRunning = true
	return nil
}

func (lh *Service) Shutdown() {
	if !lh.isRunning {
		return
	}
	defer lh.logger.Sync()

	lh.app.Services().Kubernetes().RemoveEventListener(lh.name)
	lh.historyRequests = nil
	lh.lifeHookStateInvokersMap = nil

	close(lh.stopChan)
	if lh.requestLimiter != nil {
		close(lh.requestLimiter)
	}
	lh.isRunning = false
}

func (lh *Service) Emit(event *module.JobEvent) error {
	if lh.isRunning == false {
		return fmt.Errorf("lifehook state is stopped")
	}

	message := &libLifeHook.HookTaskMessage{
		Id:           event.JobID,
		UserID:       jsoniter.Get(event.Header, header.DefaultHeaderUserID).ToString(),
		Namespace:    event.Namespace,
		CurrentState: event.EventName,
		CurrentTime:  time.Now(),
	}
	mExisted, err := lh.existsMessage(message)
	if err != nil {
		return err
	}
	if mExisted {
		return nil
	}

	stateInvokers := lh.getStateInvokers(event.EventName)
	if len(stateInvokers) < 1 {
		return nil
	}

	provider := libLifeHook.NewLifePluginProvider(event.Header)
	for _, invoker := range stateInvokers {
		match, err := invoker.GetPlugin().GetSelector().Match(provider)
		if err != nil {
			return err
		}
		if !match {
			continue
		}

		plugin := invoker.GetPlugin()
		request := libLifeHook.NewHookTaskRequest(plugin.Key(), plugin.GetCallback(), message)

		// record message first
		err = lh.recordRequest(request, libLifeHook.LifeHookPairStateInit)
		if err != nil {
			lh.logger.Error(err.Error(), lh.getRequestLoggerInfos(request)...)
			continue
		}

		maybeFault := invoker.MaybeFault(request)
		if maybeFault {
			historyReqs, err := lh.probeLinkerHistoryRequests(request)
			if err != nil {
				lh.logger.Error("recover history request for linker failed: "+err.Error(), lh.getRequestLoggerInfos(request)...)
				continue
			}
			invoker.AddTasks(historyReqs)
		} else {
			invoker.AddTask(request)
		}
	}
	return nil
}

func (lh *Service) Subscribe(feature *api.Feature, plugin *api.Plugin) error {
	libPlugin, err := libPipeline.NewPlugin(feature, plugin)
	if err != nil {
		return err
	}

	var handler TaskHandler = func(request *libLifeHook.HookTaskRequest, linker *libLifeHook.HookTaskStateRequestLinker) error {
		_, e := lh.notify(request, lh.config.MaxRetryOnFail)
		if e != nil {
			// close linker
			//linker.Disable()
			// record message sec
			lh.recordRequest(request, libLifeHook.LifeHookPairStateException)
			lh.logger.Error(e.Error(), lh.getRequestLoggerInfos(request)...)
			return e
		}

		// record message sec
		err = lh.recordRequest(request, libLifeHook.LifeHookPairStateOK)
		if err != nil {
			lh.logger.Error(err.Error(), lh.getRequestLoggerInfos(request)...)
			return err
		}
		return nil
	}

	jobSelectorStates := FormatJobSelectorStates(plugin.JobSelector.States)
	pluginInvoker, err := NewPluginInvoker(lh.stopChan, lh.requestLimiter, jobSelectorStates, libPlugin, handler)
	if err != nil || pluginInvoker == nil {
		return err
	}

	err = lh.recoverInvokerHistoryFaultRequest(pluginInvoker)
	if nil != err {
		return err
	}
	for _, state := range jobSelectorStates {
		lh.setStateInvoker(state, pluginInvoker)
	}
	return nil
}

func (lh *Service) Unsubscribe(feature *api.Feature, plugin *api.Plugin) error {
	libPlugin, error := libPipeline.NewPlugin(feature, plugin)
	if error != nil {
		return error
	}

	jobSelectorStates := FormatJobSelectorStates(plugin.JobSelector.States)
	pluginInvoker, err := NewPluginInvoker(nil, nil, jobSelectorStates, libPlugin, nil)
	if err != nil {
		return err
	}

	for _, state := range jobSelectorStates {
		lh.removeStateInvoker(state, pluginInvoker)
	}
	return nil
}

func (lh *Service) IsActiveJobHook(jobId string, plugin *api.Plugin) bool {
	var invoker *PluginInvoker

	jobSelectorStates := FormatJobSelectorStates(plugin.JobSelector.States)
	for _, state := range jobSelectorStates {
		ins := lh.getStateInvokers(state)
		for _, i := range ins {
			if i.plugin.Key() == plugin.Key {
				invoker = i
				break
			}
		}
		if invoker != nil {
			break
		}
	}
	if invoker == nil {
		lh.logger.Info("IsActiveJobHook Invoker is destroyed",
			zap.String("pluginKey", plugin.Key),
			zap.String("jobId", jobId),
		)
		return false
	}
	linker, ok := invoker.taskLinkers.Load(jobId)

	if !ok || linker == nil {
		lh.logger.Info("IsActiveJobHook RequestLinker is destroyed",
			zap.String("pluginKey", plugin.Key),
			zap.String("jobId", jobId),
		)
		return false
	}

	isDisabled := linker.(*libLifeHook.HookTaskStateRequestLinker).IsDisabled()
	lh.logger.Info("IsActiveJobHook RequestLinker is lived",
		zap.String("pluginKey", plugin.Key),
		zap.String("jobId", jobId),
		zap.Bool("Disabled", isDisabled),
	)
	return !isDisabled
}
