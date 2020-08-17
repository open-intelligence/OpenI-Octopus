package v1

import (
	"time"

	corev1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

type SubmitJobParam struct {
	UserID  string                 `json:"userID"`
	JobKind string                 `json:"jobKind"`
	JobName string                 `json:"jobName"`
	Header  map[string]interface{} `json:"header"`
	Job     map[string]interface{} `json:"job"`
	JobNamespace            string `json:"jobNameSpace"`
	Cluster                 string `json:"cluster"`
}

type UpdateJobParam struct {
	JobID  string `json:"jobID"`
	Reason string `json:"reason"`
}

type QueryParams struct {
	UserID     string
	JobName    string
	JobKind    string
	State      string
	Order      string
	Cluster    string
	PageNumber int64
	PageSize   int64
	StartTime  *time.Time
	EndTime    *time.Time
}

type JobSummary struct {
	ID                string       `json:"id"`
	Name              string       `json:"name"`
	Type              string       `json:"type"`
	State             string       `json:"state"`
	UserID            string       `json:"userID"`
	StartAt           *metav1.Time `json:"startAt"`
	FinishedAt        *metav1.Time `json:"finishedAt"`
	TotalRetriedCount uint         `json:"totalRetriedCount"`
	ExitCode          int32        `json:"exitCode"`
	ExitDiagnostics   string       `json:"exitDiagnostics"`
}

type ClusterInfo struct {
	Identity string `json:"identity"`
}

type ReplicaInfo struct {
	Index           uint         `json:"index"`
	State           string       `json:"state"`
	RetriedCount    uint         `json:"retriedCount"`
	StartAt         *metav1.Time `json:"startAt"`
	FinishedAt      *metav1.Time `json:"finishedAt"`
	ContainerID     string       `json:"containerID"`
	ContainerHostIP string       `json:"containerHostIP"`
	ExitCode        int32        `json:"exitCode"`
	ExitDiagnostics string       `json:"exitDiagnostics"`
}

type TaskInfo struct {
	Name                  string         `json:"name"`
	Image                 string         `json:"image"`
	State                 string         `json:"state"`
	Command               []string       `json:"command"`
	ReplicaAmount         uint           `json:"replicaAmount"`
	MaxFailedTaskCount    int32          `json:"maxFailedTaskCount"`
	MinSucceededTaskCount int32          `json:"minSucceededTaskCount"`
	Resource              string         `json:"resource"`
	Replicas              []*ReplicaInfo `json:"replicas"`
}

type TaskRuntimeReplicaInfo struct {
	Index     uint   `json:"index"`
	PodIP     string `json:"podIP"`
	PodUID    string `json:"podUID"`
	PodName   string `json:"podName"`
	PodHostIP string `json:"podHostIP"`
	PodReason string `json:"podReason"`
}
type TaskRuntimeInfo struct {
	Name         string                    `json:"name"`
	NodeSelector map[string]string         `json:"nodeSelector"`
	Replicas     []*TaskRuntimeReplicaInfo `json:"replicas"`
	VolumeMounts []corev1.Volume           `json:"volumeMounts"`
}

type PlatformSpecificInfo struct {
	Platform        string             `json:"platform"`
	ApiVersion      string             `json:"apiVersion"`
	Namespace       string             `json:"namespace"`
	InstanceUID     string             `json:"instanceUID"`
	ConfigMapUID    string             `json:"configMapUID"`
	ConfigMapName   string             `json:"configMapName"`
	TaskRuntimeInfo []*TaskRuntimeInfo `json:"taskRuntimeInfo"`
}

type JobStatusDetail struct {
	Version              string                `json:"version"`
	Job                  *JobSummary           `json:"job"`
	Cluster              *ClusterInfo          `json:"cluster"`
	Tasks                []*TaskInfo           `json:"tasks"`
	PlatformSpecificInfo *PlatformSpecificInfo `json:"platformSpecificInfo"`
}

type JobItem struct {
	JobID      string     `json:"jobID"`
	JobName    string     `json:"jobName"`
	JobKind    string     `json:"jobKind"`
	Namespace  string     `json:"namespace"`
	UserID     string     `json:"userID"`
	State      string     `json:"state"`
	CreatedAt  time.Time  `json:"createdAt"`
	FinishedAt *time.Time `json:"finishedAt"`
	//Platform   string     `json:"platform"`
	//ExitCode   int32      `json:"exitCode"`
	//ExitDiagnostics   string `json:"exitDiagnostics"`
    //TotalRetriedCount uint   `json:"totalRetriedCount"`
	Detail     *JobStatusDetail `json:"jobDetail"`
	Config     string     `json:"jobConfig"`
}