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

package lifehook

import (
	"fmt"
	"io/ioutil"
	"math"
	libLifeHook "scheduler/pkg/pipeline/components/lifehook"
	models "scheduler/pkg/pipeline/models/lifehookrecord"
	"strings"
	"time"

	"go.uber.org/zap"
)

func (lh *Service) recordRequest(request *libLifeHook.HookTaskRequest, hookPairState string) error {
	messageJson, err := request.GetMessageJson()
	if err != nil {
		return err
	}
	rec := &models.LifeHookRecord{
		PluginKey: request.GetPluginKey(),
		JobId:     request.GetJobId(),
		JobState:  request.GetJobState(),
		Retry:     request.GetRetryCount(),
		Url:       request.GetUrl(),
		Message:   messageJson,
		State:     hookPairState,
	}

	if request.GetResponse() != nil {
		rec.Result = request.GetResponse().GetBody()
		rec.Code = request.GetResponse().GetStateCode()
	}
	dbModel := lh.app.Services().Storage().GetDB()
	var hasRecord models.LifeHookRecord
	if result := dbModel.Where("plugin_key = ? AND job_id = ? AND job_state = ?", rec.PluginKey, rec.JobId, rec.JobState).
		First(&hasRecord); result.RecordNotFound() {
		// insert record
		if err := dbModel.Create(rec).Error; err != nil {
			return err
		}
		return nil
	} else if result.Error != nil {
		return result.Error
	}
	if result := dbModel.Model(&hasRecord).Updates(rec); result.Error != nil {
		return result.Error
	}
	return nil
}

func (lh *Service) notify(request *libLifeHook.HookTaskRequest, maxRetryCount int) (*libLifeHook.HookTaskResponse, error) {
	response, err := lh.notifyRequest(request)

	if err != nil {
		return nil, err
	} else if response.AckOK() {
		return response, nil
	} else if response.AckRetry() && request.GetRetryCount() < maxRetryCount {
		request.IncRetryCount()
		time.Sleep(time.Duration(int64(math.Pow(2, float64(request.GetRetryCount())))) * time.Second)
		return lh.notify(request, maxRetryCount)
	} else if request.GetRetryCount() < maxRetryCount {
		request.IncRetryCount()
		time.Sleep(time.Duration(int64(math.Pow(2, float64(request.GetRetryCount())))) * time.Second)
		return lh.notify(request, maxRetryCount)
	}

	return nil, fmt.Errorf("notify plugin failed: %s_%s_%s is failure, %s response body: %s, statueCode: %d",
		request.GetPluginKey(), request.GetJobId(), request.GetJobState(), request.GetUrl(),
		request.GetResponse().GetBody(), request.GetResponse().GetStateCode())
}

func (lh *Service) getRequestLoggerInfos(request *libLifeHook.HookTaskRequest) []zap.Field {
	loggerInfos := []zap.Field{
		zap.String("plugin", request.GetPluginKey()),
		zap.String("job", request.GetJobId()),
		zap.String("jobState", request.GetJobState()),
		zap.Int("retry", request.GetRetryCount()),
	}

	return loggerInfos
}

func (lh *Service) notifyRequest(request *libLifeHook.HookTaskRequest) (*libLifeHook.HookTaskResponse, error) {
	messageJson, err := request.GetMessageJson()
	if err != nil {
		return nil, err
	}
	mReader := strings.NewReader(messageJson)

	resp, err := lh.httpClient.Post(request.GetUrl(), "application/json", mReader)
	defer func() {
		if resp != nil {
			resp.Body.Close()
		}
	}()
	if err != nil {
		return nil, err
	}
	body, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		return libLifeHook.NewHookTaskResponse(request, resp.StatusCode, ""), err
	}
	respBody := string(body[:])
	return libLifeHook.NewHookTaskResponse(request, resp.StatusCode, respBody), nil
}

func (lh *Service) getStateInvokers(eventName string) []*PluginInvoker {
	lh.pluginMutex.RLock()
	defer lh.pluginMutex.RUnlock()
	return lh.lifeHookStateInvokersMap[strings.ToUpper(eventName)]
}

func (lh *Service) removeStateInvoker(eventName string, pluginInvoker *PluginInvoker) error {
	lh.pluginMutex.Lock()
	defer lh.pluginMutex.Unlock()

	eventName = strings.ToUpper(eventName)
	pluginInvokers, ok := lh.lifeHookStateInvokersMap[eventName]
	if !ok {
		return nil
	}
	for idx, invoker := range pluginInvokers {
		if invoker.GetPlugin().Equal(pluginInvoker.GetPlugin()) {
			invoker.Disable()
			copy(pluginInvokers[idx:], pluginInvokers[idx+1:])
			pluginInvokers = pluginInvokers[:len(pluginInvokers)-1]
			break
		}
	}
	//delete(lh.enabledPlugins, plugin.Key())
	lh.lifeHookStateInvokersMap[eventName] = pluginInvokers
	return nil
}

func (lh *Service) setStateInvoker(eventName string, pluginInvoker *PluginInvoker) error {
	lh.pluginMutex.Lock()
	defer lh.pluginMutex.Unlock()

	eventName = strings.ToUpper(eventName)
	pluginInvokers, ok := lh.lifeHookStateInvokersMap[eventName]
	if !ok {
		pluginInvokers = []*PluginInvoker{}
	}
	var hasPlugin bool = false
	for _, invoker := range pluginInvokers {
		if invoker.GetPlugin().Equal(pluginInvoker.GetPlugin()) {
			hasPlugin = true
			break
		}
	}
	if !hasPlugin {
		// TODO sort?
		lh.lifeHookStateInvokersMap[eventName] = append(pluginInvokers, pluginInvoker)
	}
	return nil
}

func (lh *Service) existsMessage(message *libLifeHook.HookTaskMessage) (bool, error) {
	record := &models.LifeHookRecord{JobId: message.Id, JobState: message.CurrentState}

	dbModel := lh.app.Services().Storage().GetDB()
	if result := dbModel.Where(record).First(record); result.Error != nil && !result.RecordNotFound() {
		return false, result.Error
	} else if result.RecordNotFound() {
		return false, nil
	}
	return true, nil
}
