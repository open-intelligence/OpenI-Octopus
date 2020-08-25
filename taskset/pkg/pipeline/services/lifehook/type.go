package lifehook

import (
	"net/http"
	"scheduler/pkg/pipeline/app"
	libLifeHook "scheduler/pkg/pipeline/components/lifehook"
	"scheduler/pkg/pipeline/config"
	"sync"

	"go.uber.org/zap"
)

type Service struct {
	app                      *app.App
	name                     string
	config                   *config.LifeHookConfig
	logger                   *zap.Logger
	stopChan                 chan int
	isRunning                bool
	httpClient               *http.Client
	pluginMutex              sync.RWMutex
	historyRequests          map[string][]*libLifeHook.HookTaskRequest
	lifeHookStateInvokersMap map[string][]*PluginInvoker
	requestLimiter           chan int
}
