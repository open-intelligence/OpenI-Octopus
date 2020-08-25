package lifehook

import (
	libLifeHook "scheduler/pkg/pipeline/components/lifehook"
	sliceUtils "scheduler/pkg/pipeline/utils/slice"
)

func FormatJobSelectorStates(states []string) []string {
	jobSelectorStates := sliceUtils.RemoveDuplicateString(states)
	if sliceUtils.HasString(jobSelectorStates, "*") {
		jobSelectorStates = libLifeHook.TaskStates[0:]
	} else {
		jobSelectorStates = sliceUtils.Intersection(jobSelectorStates, libLifeHook.TaskStates[0:])
	}
	return jobSelectorStates
}

func FormatStatesToStatesProgresses(states []string) libLifeHook.TaskStatesProgressValue {
	var p libLifeHook.TaskStatesProgressValue
	for _, s := range states {
		tp, ok := libLifeHook.TaskStatesProgresses[s]
		if !ok {
			continue
		}
		p |= tp
	}
	return p
}
