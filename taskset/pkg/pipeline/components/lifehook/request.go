package lifehook

func (lhr *HookTaskRequest) GetPluginKey() string {
	return lhr.pluginKey
}

func (lhr *HookTaskRequest) GetUrl() string {
	return lhr.url
}

func (lhr *HookTaskRequest) IsOver() bool {
	if lhr.response == nil {
		return false
	}

	if lhr.GetResponse().AckOK() {
		return true
	}
	return false
}

func (lhr *HookTaskRequest) GetJobId() string {
	return lhr.jobId
}

func (lhr *HookTaskRequest) GetJobState() string {
	return lhr.jobState
}

func (lhr *HookTaskRequest) GetMessage() *HookTaskMessage {
	return lhr.message
}

func (lhr *HookTaskRequest) GetMessageJson() (string, error) {
	if lhr.messageJson != "" {
		return lhr.messageJson, nil
	}
	messageJson, err := lhr.message.ToString()
	if err != nil {
		return messageJson, err
	}
	lhr.messageJson = messageJson
	return messageJson, nil
}

func (lhr *HookTaskRequest) GetRetryCount() int {
	return lhr.retryCount
}

func (lhr *HookTaskRequest) IncRetryCount() {
	lhr.retryCount += 1
}

func (lhr *HookTaskRequest) GetResponse() *HookTaskResponse {
	return lhr.response
}

func (lhr *HookTaskRequest) SetResponse(response *HookTaskResponse) {
	lhr.response = response
}

func NewHookTaskRequest(pluginKey, url string, message *HookTaskMessage) *HookTaskRequest {
	return &HookTaskRequest{
		url:       url,
		pluginKey: pluginKey,
		jobId:     message.Id,
		jobState:  message.CurrentState,
		message:   message,
	}
}
