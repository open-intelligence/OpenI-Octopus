package lifehook

import "strings"

func (lhres *HookTaskResponse) GetRequest() *HookTaskRequest {
	return lhres.request
}

func (lhres *HookTaskResponse) SetRequest(request *HookTaskRequest) {
	lhres.request = request
}

func (lhres *HookTaskResponse) GetBody() string {
	return lhres.body
}

func (lhres *HookTaskResponse) GetStateCode() int {
	return lhres.stateCode
}

func (lhres *HookTaskResponse) AckOK() bool {
	if lhres.GetStateCode() == LifeHookPairStateCodeOK && strings.ToUpper(lhres.GetBody()) == LifeHookPairAckOK {
		return true
	}
	return false
}

func (lhres *HookTaskResponse) AckRetry() bool {
	if lhres.GetStateCode() == LifeHookPairStateCodeOK && strings.ToUpper(lhres.GetBody()) == LifeHookPairAckRe {
		return true
	}
	return false
}

func NewHookTaskResponse(request *HookTaskRequest, stateCode int, body string) *HookTaskResponse {
	response := &HookTaskResponse{
		stateCode: stateCode,
		body:      body,
	}

	request.SetResponse(response)
	response.SetRequest(request)
	return response
}
