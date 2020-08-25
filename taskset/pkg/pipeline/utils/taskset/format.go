package taskset

import (
	typeTaskset "scheduler/pkg/crd/apis/taskset/v1alpha1"
	v1 "scheduler/pkg/pipeline/apis/http/v1"
	"scheduler/pkg/pipeline/constants/jobstate"
	libTaskSetController "scheduler/pkg/tasksetcontroller/controller"

	jsoniter "github.com/json-iterator/go"
)

func convertTaskSetState(taskset *typeTaskset.TaskSet) string {
	if nil == taskset || nil == taskset.Status {
		return jobstate.UNKNOWN
	}

	state := taskset.Status.State

	switch state {
	case libTaskSetController.WAITING:
		{
			return jobstate.PENDING
		}
	case libTaskSetController.RUNNING:
		{
			return jobstate.RUNNING
		}
	case libTaskSetController.FAILED:
		{
			return jobstate.FAILED
		}
	case libTaskSetController.SUCCEEDED:
		{
			return jobstate.SUCCEEDED
		}
	}

	return jobstate.UNKNOWN
}

func convertTaskRoleState(taskroleStatus *typeTaskset.TaskRoleStatus) string {
	if nil == taskroleStatus {
		return jobstate.UNKNOWN
	}

	state := taskroleStatus.State

	switch state {
	case libTaskSetController.WAITING:
		{
			return jobstate.PENDING
		}
	case libTaskSetController.RUNNING:
		{
			return jobstate.RUNNING
		}
	case libTaskSetController.FAILED:
		{
			return jobstate.FAILED
		}
	case libTaskSetController.SUCCEEDED:
		{
			return jobstate.SUCCEEDED
		}
	}

	return jobstate.UNKNOWN
}

func convertTaskRoleReplicaState(replica *typeTaskset.ReplicaStatus) string {
	if nil == replica {
		return jobstate.UNKNOWN
	}
	switch replica.Phase {
	case libTaskSetController.TRRAPending.GetName(),
		libTaskSetController.TRRACreationRequested.GetName(),
		libTaskSetController.TRRAPreparing.GetName(),
		libTaskSetController.TRRARetryPending.GetName(),
		libTaskSetController.TRRAAssigned.GetName():
		{
			return jobstate.PENDING
		}
	case libTaskSetController.TRRARunning.GetName(),
		libTaskSetController.TRRADeletionPending.GetName(),
		libTaskSetController.TRRADeletionRequested.GetName(),
		libTaskSetController.TRRACompleted.GetName():
		{
			return jobstate.RUNNING
		}
	case libTaskSetController.TaskRoleReplicaCompleted.GetName():
		{
			if nil == replica.TerminatedInfo {
				return jobstate.FAILED
			}
			if 0 == replica.TerminatedInfo.ExitCode {
				return jobstate.SUCCEEDED
			}
			return jobstate.FAILED
		}
	}

	return jobstate.UNKNOWN
}

func Format(jobName, jobKind, userID, cluster string, ExitDiagnostics string, taskset *typeTaskset.TaskSet) *v1.JobStatusDetail {

	if nil == taskset {
		return nil
	}

	detail := &v1.JobStatusDetail{
		Version: "v1",
		Job: &v1.JobSummary{
			ID:     taskset.Name,
			Name:   jobName,
			Type:   jobKind,
			UserID: userID,
			State:  convertTaskSetState(taskset),
		},
		Cluster: &v1.ClusterInfo{ Identity: cluster },
		PlatformSpecificInfo: &v1.PlatformSpecificInfo{
			Platform:    "k8s",
			ApiVersion:  taskset.APIVersion,
			Namespace:   taskset.Namespace,
			InstanceUID: string(taskset.UID),
		},
	}

	if taskset.Status != nil {
		detail.Job.StartAt = taskset.Status.StartAt
		detail.Job.FinishedAt = taskset.Status.FinishAt
		detail.Job.TotalRetriedCount = taskset.Status.TotalRetriedCount
	}

	detail.Tasks = make([]*v1.TaskInfo, len(taskset.Spec.Roles))

	detail.PlatformSpecificInfo.TaskRuntimeInfo = make([]*v1.TaskRuntimeInfo, len(taskset.Spec.Roles))

	for i := 0; i < len(taskset.Spec.Roles); i++ {
		role := &taskset.Spec.Roles[i]
		task := &v1.TaskInfo{
			Name:                  role.Name,
			ReplicaAmount:         role.Replicas,
			MaxFailedTaskCount:    role.CompletionPolicy.MaxFailed,
			MinSucceededTaskCount: role.CompletionPolicy.MinSucceeded,
		}

		container := role.Pod.Spec.Containers[0]

		task.Image = container.Image
		task.Command = append([]string{}, container.Command...)
		buf, _ := jsoniter.Marshal(container.Resources.Limits)
		if nil != buf {
			task.Resource = string(buf)
		}

		detail.Tasks[i] = task

		runtimeInfo := &v1.TaskRuntimeInfo{
			Name:         role.Name,
			NodeSelector: role.Pod.Spec.NodeSelector,
			VolumeMounts: role.Pod.Spec.Volumes,
		}

		detail.PlatformSpecificInfo.TaskRuntimeInfo[i] = runtimeInfo
	}

	if ExitDiagnostics != "" {
		detail.Job.ExitDiagnostics = ExitDiagnostics
	}

	if nil == taskset.Status {
		return detail
	}

	for i := 0; i < len(detail.Tasks); i++ {

		var status *typeTaskset.TaskRoleStatus

		for j := 0; j < len(taskset.Status.TaskRoleStatus); j++ {
			if taskset.Status.TaskRoleStatus[j].Name == detail.Tasks[i].Name {
				status = &taskset.Status.TaskRoleStatus[j]
				break
			}
		}

		if nil == status {
			continue
		}

		detail.Tasks[i].State = convertTaskRoleState(status)

		if nil == detail.Tasks[i].Replicas {
			detail.Tasks[i].Replicas = make([]*v1.ReplicaInfo, len(status.ReplicaStatuses))
		}

		if nil == detail.PlatformSpecificInfo.TaskRuntimeInfo[i].Replicas {
			detail.PlatformSpecificInfo.TaskRuntimeInfo[i].Replicas = make([]*v1.TaskRuntimeReplicaInfo,
				len(status.ReplicaStatuses))
		}

		for k := 0; k < len(status.ReplicaStatuses); k++ {
			status := &status.ReplicaStatuses[k]
			replica := &v1.ReplicaInfo{
				Index:           status.Index,
				State:           convertTaskRoleReplicaState(status),
				RetriedCount:    status.TotalRetriedCount,
				StartAt:         status.StartAt,
				FinishedAt:      status.FinishAt,
				ContainerID:     status.ContainerID,
				ContainerHostIP: status.PodHostIP,
			}
			if nil != status.TerminatedInfo {
				replica.ExitCode = status.TerminatedInfo.ExitCode
				replica.ExitDiagnostics = status.TerminatedInfo.ExitMessage
				if replica.ExitCode != 0 {
					if detail.Job.State == jobstate.FAILED || detail.Job.State == jobstate.SUCCEEDED {
						detail.Job.ExitCode = replica.ExitCode
						if ExitDiagnostics == "" {
							detail.Job.ExitDiagnostics = replica.ExitDiagnostics
						}
					}
				}
			}
			detail.Tasks[i].Replicas[k] = replica

			rReplica := &v1.TaskRuntimeReplicaInfo{
				Index:     status.Index,
				PodIP:     status.PodIP,
				PodName:   status.PodName,
				PodHostIP: status.PodHostIP,
				PodReason: status.PodReason,
			}
			if nil != status.PodUID {
				rReplica.PodUID = string(*status.PodUID)
			}

			detail.PlatformSpecificInfo.TaskRuntimeInfo[i].Replicas[k] = rReplica
		}
	}

	if detail.Job.State == jobstate.SUCCEEDED {
		detail.Job.ExitCode = 0
		detail.Job.ExitDiagnostics = ""
		if nil != taskset.Status  && ExitDiagnostics == ""{
			detail.Job.ExitDiagnostics = taskset.Status.StateMessage
		}
	}

	return detail
}
