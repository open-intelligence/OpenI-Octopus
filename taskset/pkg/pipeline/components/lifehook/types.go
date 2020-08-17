package lifehook

import (
	"scheduler/pkg/pipeline/constants/jobstate"
	"sync"
	"time"
)

const (
	LifeHookPairStateInit      = "IN"
	LifeHookPairStateException = "EX"
	LifeHookPairStateOK        = "OK"
	LifeHookPairStateCodeOK    = 200

	LifeHookPairAckOK = "OK"
	LifeHookPairAckRe = "RE"
)

type TaskStatesProgressValue uint32

var (
	TaskStatesProgressPreparing TaskStatesProgressValue = 8
	TaskStatesProgressPending   TaskStatesProgressValue = 16
	TaskStatesProgressRunning   TaskStatesProgressValue = 32
	TaskStatesProgressFailed    TaskStatesProgressValue = 64
	TaskStatesProgressSucceeded TaskStatesProgressValue = 64
	TaskStatesProgressSuspended TaskStatesProgressValue = 1
	TaskStatesProgressUnknown   TaskStatesProgressValue = 2
	TaskStatesProgressStopped   TaskStatesProgressValue = 4

	TaskStates = []string{
		jobstate.PREPARING,
		jobstate.PENDING,
		jobstate.UNKNOWN,
		jobstate.RUNNING,
		jobstate.SUSPENDED,
		jobstate.FAILED,
		jobstate.SUCCEEDED,
		jobstate.STOPPED,
	}
	TaskStatesCompleted = []string{
		jobstate.FAILED,
		jobstate.SUCCEEDED,
		jobstate.STOPPED,
	}
	TaskStatesProgresses = map[string]TaskStatesProgressValue{
		jobstate.UNKNOWN:   TaskStatesProgressUnknown,
		jobstate.PREPARING: TaskStatesProgressPreparing,
		jobstate.PENDING:   TaskStatesProgressPending,
		jobstate.RUNNING:   TaskStatesProgressRunning,
		jobstate.FAILED:    TaskStatesProgressFailed,
		jobstate.SUCCEEDED: TaskStatesProgressSucceeded,
		jobstate.STOPPED:   TaskStatesProgressStopped,
		jobstate.SUSPENDED: TaskStatesProgressSuspended,
	}
	TaskStatesProgressCompleted = TaskStatesProgressPending | TaskStatesProgressRunning |
		TaskStatesProgressSucceeded | TaskStatesProgressFailed
	TaskStatesProgressNormalCompleted = TaskStatesProgressStopped | TaskStatesProgressSucceeded | TaskStatesProgressFailed
	TaskStatesProgressAbnormal        = TaskStatesProgressSuspended | TaskStatesProgressUnknown
	TaskStatesProgressEnded           = TaskStatesProgressAbnormal | TaskStatesProgressStopped | TaskStatesProgressSucceeded | TaskStatesProgressFailed
)

type HookTaskMessage struct {
	Id           string    `json:"id"`
	UserID		 string    `json:"userID"`
	Namespace	 string    `json:"namespace"`
	CurrentState string    `json:"currentState"`
	CurrentTime  time.Time `json:"currentTime"`
}

type HookTaskRequest struct {
	pluginKey   string
	jobId       string
	jobState    string
	url         string
	retryCount  int
	message     *HookTaskMessage
	messageJson string
	response    *HookTaskResponse
}

type HookTaskResponse struct {
	stateCode int
	body      string
	request   *HookTaskRequest
}

type HookTaskStateRequestLinker struct {
	disabled    bool
	stateMutex  sync.RWMutex
	pluginKey   string
	jobId       string
	requests    sync.Map
	progress    TaskStatesProgressValue
	action      func() error
	actionState uint32 // 0: ready 1: activating
}

type HookTaskRequestAction func(*HookTaskRequest) error

type LifeHookPluginProvider struct {
	headers []byte
}
