package lifehook

import (
	"fmt"
	libLifeHook "scheduler/pkg/pipeline/components/lifehook"
	models "scheduler/pkg/pipeline/models/lifehookrecord"

	jsoniter "github.com/json-iterator/go"
)

func (lh *Service) loadHistoryRequests(cond *models.LifeHookRecord, states []string) ([]*libLifeHook.HookTaskRequest, error) {
	var records []models.LifeHookRecord
	requests := []*libLifeHook.HookTaskRequest{}
	retryState := states

	dbModel := lh.app.Services().Storage().GetDB()
	act := dbModel.Order("created_at asc").Where(cond)
	if len(states) > 0 {
		act = act.Where("state in (?)", retryState)
	}
	result := act.Find(&records)
	if !result.RecordNotFound() && result.Error != nil {
		return nil, result.Error
	} else if result.RecordNotFound() {
		return requests, nil
	}
	for _, r := range records {
		var message libLifeHook.HookTaskMessage
		err := jsoniter.Unmarshal([]byte(r.Message), &message)
		if err != nil {
			lh.logger.Error(err.Error())
			continue
			return nil, err
		}
		request := libLifeHook.NewHookTaskRequest(r.PluginKey, r.Url, &message)
		if r.State != libLifeHook.LifeHookPairStateInit {
			response := libLifeHook.NewHookTaskResponse(request, r.Code, r.Result)
			request.SetResponse(response)
		}
		//lh.pushHistoryRequest(request)
		requests = append(requests, request)
	}
	return requests, nil
}

func (lh *Service) recoverInvokerHistoryFaultRequest(invoker *PluginInvoker) error {
	pluginKey := invoker.GetPlugin().Key()
	if pluginKey == "" {
		return fmt.Errorf("plugin key is null")
	}

	historyRequests, err := lh.loadHistoryRequests(&models.LifeHookRecord{PluginKey: pluginKey}, []string{})
	if err != nil {
		return err
	}
	if historyRequests == nil {
		return nil
	}
	for _, request := range historyRequests {
		invoker.AddTask(request)
	}
	return nil
}

func (lh *Service) probeLinkerHistoryRequests(request *libLifeHook.HookTaskRequest) ([]*libLifeHook.HookTaskRequest, error) {
	pluginKey := request.GetPluginKey()
	jobId := request.GetJobId()
	if pluginKey == "" || jobId == "" {
		return nil, fmt.Errorf("una pluginKey %s and jobId %s", pluginKey, jobId)
	}

	return lh.loadHistoryRequests(&models.LifeHookRecord{PluginKey: pluginKey, JobId: jobId},
		[]string{})
}
