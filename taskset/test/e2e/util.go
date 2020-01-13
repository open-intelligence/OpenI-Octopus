/*
Copyright 2018 The Volcano Authors.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

package e2e

import (
	"fmt"
	"io/ioutil"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/golang/glog"
	jsoniter "github.com/json-iterator/go"
	"gopkg.in/yaml.v2"

	. "github.com/onsi/gomega"

	v1 "k8s.io/api/core/v1"
	schedv1 "k8s.io/api/scheduling/v1beta1"
	"k8s.io/apimachinery/pkg/api/errors"
	"k8s.io/apimachinery/pkg/api/resource"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/util/wait"
	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/tools/clientcmd"

	//api "k8s.io/kubernetes/pkg/apis/core"

	schedulingv1alpha1 "scheduler/pkg/crd/apis/podgroup/v1alpha1"
	tsv1alpha1 "scheduler/pkg/crd/apis/taskset/v1alpha1"
	vkv1 "scheduler/pkg/crd/apis/taskset/v1alpha1"
	tsclient "scheduler/pkg/crd/generated/clientset/versioned"
	tc "scheduler/pkg/tasksetcontroller/controller"

	apiErrors "k8s.io/apimachinery/pkg/api/errors"
)

type replica uint

type TaskSetPhase string

const (
	OutputFilePath string = "output/"

	TaskSetAttemptPreparing TaskSetPhase = "TaskSetAttemptPreparing"
	TaskSetAttemptRunning   TaskSetPhase = "TaskSetAttemptRunning"
	TaskSetCompleted        TaskSetPhase = "TaskSetCompleted"
)

const (
	SchedulerName string = "kube-batch"

	TestNameSpace    string = "test"
	DefaultNameSpace string = "default"
	DefaultQueue     string = "default"
	HighPriority     uint   = 10000
	MiddlePriority   uint   = 500
	LowPriority      uint   = 10

	Role_PS                string = "ps"
	Role_Wroker            string = "wroker"
	Container_Defauly_name string = "workercontainer"

	Pending   TaskSetPhase = "Pending"
	Running   TaskSetPhase = "Running"
	Completed TaskSetPhase = "Completed"
	Successed TaskSetPhase = "Successed"
	Failed    TaskSetPhase = "Failed"
	Aborted   TaskSetPhase = "Aborted"
)

var (
	oneMinute = 1 * time.Minute
	twoMinute = 2 * time.Minute
	oneCPU    = v1.ResourceList{"cpu": resource.MustParse("1000m")}
	thirtyCPU = v1.ResourceList{"cpu": resource.MustParse("30000m")}
	halfCPU   = v1.ResourceList{"cpu": resource.MustParse("500m")}

	lowResource    = buildResourceList("100m", "128Mi")
	middleResource = buildResourceList("1", "1Gi")
	oneGpu         = buildResourceListWithGPU("1", "1Gi", "1")

	NVIDIA_GPU_RESOURCE = v1.ResourceName("nvdiai.com/gpu")

	Command_Sleep_10S        = []string{"sh", "-c", "sleep 10"}
	Command_Sleep_1M         = []string{"sh", "-c", "sleep 1m"}
	Command_Sleep_1D         = []string{"sh", "-c", "sleep 1d"}
	Command_Failed           = []string{"sh", "-c", "exit 1"}
	Command_Random_Failed    = []string{"sh", "-c", "sleep $(expr $RANDOM % 40) && exit $(expr $RANDOM % 2)"}
	Command_Sleep_10S_Failed = []string{"sh", "-c", "sleep 10 && exit 1"}
)

const (
	timeOutMessage = "timed out waiting for the condition"
	workerPriority = "worker-pri"
	masterPriority = "master-pri"

	busybox           = "busybox:latest"
	defaultNginxImage = "nginx:1.14"
	defaultMLImage    = "ufoym/deepo:all-py36-cu100"

	executeAction = "ExecuteAction"

	defaultQueue1 = "q1"
	defaultQueue2 = "q2"
)

func cpuResource(request string) v1.ResourceList {
	return v1.ResourceList{v1.ResourceCPU: resource.MustParse(request)}
}

func homeDir() string {
	if h := os.Getenv("HOME"); h != "" {
		return h
	}
	return os.Getenv("USERPROFILE") // windows
}

func masterURL() string {
	if m := os.Getenv("MASTER"); m != "" {
		return m
	}
	return ""
}

func kubeconfigPath(home string) string {
	if m := os.Getenv("KUBECONFIG"); m != "" {
		return m
	}
	return filepath.Join(home, ".kube", "config") // default kubeconfig path is $HOME/.kube/config
}

type context struct {
	kubeclient *kubernetes.Clientset

	namespace string
	queues    []string
	tsclient  *tsclient.Clientset
}

func initTestContext(namespace string) *context {
	cxt := &context{
		namespace: namespace,
		queues:    []string{defaultQueue1, defaultQueue2},
	}

	home := homeDir()

	Expect(home).NotTo(Equal(""))

	configPath := kubeconfigPath(home)

	Expect(configPath).NotTo(Equal(""))

	config, err := clientcmd.BuildConfigFromFlags(masterURL(), configPath)

	Expect(err).NotTo(HaveOccurred())

	cxt.kubeclient = kubernetes.NewForConfigOrDie(config)

	cxt.tsclient = tsclient.NewForConfigOrDie(config)

	//Ensure at least one worker is ready
	err = waitClusterReady(cxt)

	Expect(err).NotTo(HaveOccurred(), "k8s cluster is required to have one ready worker node at least.")

	_, err = cxt.kubeclient.CoreV1().Namespaces().Create(&v1.Namespace{
		ObjectMeta: metav1.ObjectMeta{
			Name: cxt.namespace,
		},
	})

	if true == apiErrors.IsAlreadyExists(err) {

		foreground := metav1.DeletePropagationForeground

		cxt.kubeclient.CoreV1().Namespaces().Delete(cxt.namespace, &metav1.DeleteOptions{
			PropagationPolicy: &foreground,
		})

		wait.Poll(100*time.Millisecond, twoMinute, namespaceNotExist(cxt))

		_, err = cxt.kubeclient.CoreV1().Namespaces().Create(&v1.Namespace{
			ObjectMeta: metav1.ObjectMeta{
				Name: cxt.namespace,
			},
		})
	}

	if false == apiErrors.IsAlreadyExists(err) {
		Expect(err).NotTo(HaveOccurred())
	}

	_, err = cxt.kubeclient.SchedulingV1beta1().PriorityClasses().Create(&schedv1.PriorityClass{
		ObjectMeta: metav1.ObjectMeta{
			Name: masterPriority,
		},
		Value:         100,
		GlobalDefault: false,
	})

	if false == apiErrors.IsAlreadyExists(err) {
		Expect(err).NotTo(HaveOccurred())
	}

	_, err = cxt.kubeclient.SchedulingV1beta1().PriorityClasses().Create(&schedv1.PriorityClass{
		ObjectMeta: metav1.ObjectMeta{
			Name: workerPriority,
		},
		Value:         1,
		GlobalDefault: false,
	})

	if false == apiErrors.IsAlreadyExists(err) {
		Expect(err).NotTo(HaveOccurred())
	}

	return cxt
}

func namespaceNotExist(ctx *context) wait.ConditionFunc {
	return namespaceNotExistWithName(ctx, ctx.namespace)
}

func namespaceNotExistWithName(ctx *context, name string) wait.ConditionFunc {
	return func() (bool, error) {
		_, err := ctx.kubeclient.CoreV1().Namespaces().Get(name, metav1.GetOptions{})
		if !(err != nil && errors.IsNotFound(err)) {
			return false, err
		}
		return true, nil
	}
}

func fileExist(name string) bool {
	if _, err := os.Stat(name); err != nil {
		if os.IsNotExist(err) {
			return false
		}
	}
	return true
}

func cleanupTestContext(cxt *context) {

	glog.V(4).Infof("Starting Cleaning Context")

	foreground := metav1.DeletePropagationForeground

	err := cxt.kubeclient.CoreV1().Namespaces().Delete(cxt.namespace, &metav1.DeleteOptions{
		PropagationPolicy: &foreground,
	})

	if false == apiErrors.IsNotFound(err) {
		Expect(err).NotTo(HaveOccurred())
	}

	err = cxt.kubeclient.SchedulingV1beta1().PriorityClasses().Delete(masterPriority, &metav1.DeleteOptions{
		PropagationPolicy: &foreground,
	})
	if false == apiErrors.IsNotFound(err) {
		Expect(err).NotTo(HaveOccurred())
	}

	err = cxt.kubeclient.SchedulingV1beta1().PriorityClasses().Delete(workerPriority, &metav1.DeleteOptions{
		PropagationPolicy: &foreground,
	})

	if false == apiErrors.IsNotFound(err) {
		Expect(err).NotTo(HaveOccurred())
	}

	// Wait for namespace deleted.
	err = wait.Poll(100*time.Millisecond, twoMinute, namespaceNotExist(cxt))
	Expect(err).NotTo(HaveOccurred())

}

type taskSpec struct {
	name                  string
	min, rep              int32
	img                   string
	command               string
	workingDir            string
	hostport              int32
	req                   v1.ResourceList
	limit                 v1.ResourceList
	affinity              *v1.Affinity
	labels                map[string]string
	policies              []vkv1.EventPolicy
	restartPolicy         v1.RestartPolicy
	tolerations           []v1.Toleration
	defaultGracefulPeriod *int64
	taskpriority          string
}

type jobSpec struct {
	name      string
	namespace string
	queue     string
	tasks     []taskSpec
	policies  []vkv1.RetryPolicy
	min       int32
	plugins   map[string][]string
	// ttl seconds after job finished
	ttl *int32
}

func getNS(context *context, job *jobSpec) string {
	if len(job.namespace) != 0 {
		return job.namespace
	}

	return context.namespace
}

func createJob(context *context, jobSpec *jobSpec) *vkv1.TaskSet {

	job, err := createJobInner(context, jobSpec)
	Expect(err).NotTo(HaveOccurred(), "create job")

	return job
}

func createJobInner(context *context, jobSpec *jobSpec) (*vkv1.TaskSet, error) {
	ns := getNS(context, jobSpec)

	job := &vkv1.TaskSet{
		ObjectMeta: metav1.ObjectMeta{
			Name:      jobSpec.name,
			Namespace: ns,
		},
		Spec: vkv1.TaskSetSpec{
			Queue: jobSpec.queue,
		},
	}

	var min int32
	for i, task := range jobSpec.tasks {
		name := task.name
		if len(name) == 0 {
			name = fmt.Sprintf("%s-task-%d", jobSpec.name, i)
		}

		restartPolicy := v1.RestartPolicyOnFailure
		if len(task.restartPolicy) > 0 {
			restartPolicy = task.restartPolicy
		}

		ts := vkv1.TaskRole{
			Name:          name,
			Replicas:      uint(task.rep),
			EventPolicies: task.policies,
			Pod: v1.PodTemplateSpec{
				ObjectMeta: metav1.ObjectMeta{
					Name:   name,
					Labels: task.labels,
				},
				Spec: v1.PodSpec{
					RestartPolicy:     restartPolicy,
					Containers:        createContainers(task.img, task.command, task.workingDir, task.req, task.limit, task.hostport),
					Affinity:          task.affinity,
					Tolerations:       task.tolerations,
					PriorityClassName: task.taskpriority,
				},
			},
		}

		if task.defaultGracefulPeriod != nil {
			ts.Pod.Spec.TerminationGracePeriodSeconds = task.defaultGracefulPeriod
		} else {
			//NOTE: TerminationGracePeriodSeconds is set to 3 in default in case of timeout when restarting tasks in test.
			var defaultPeriod int64 = 3
			ts.Pod.Spec.TerminationGracePeriodSeconds = &defaultPeriod
		}

		job.Spec.Roles = append(job.Spec.Roles, ts)

		min += task.min
	}

	return context.tsclient.OctopusV1alpha1().TaskSets(job.Namespace).Create(job)
}
func createContainers(img, command, workingDir string, req, limit v1.ResourceList, hostport int32) []v1.Container {
	var imageRepo []string
	container := v1.Container{
		Image:           img,
		ImagePullPolicy: v1.PullIfNotPresent,
		Resources: v1.ResourceRequirements{
			Requests: req,
			Limits:   limit,
		},
	}
	if strings.Index(img, ":") < 0 {
		imageRepo = strings.Split(img, "/")
	} else {
		imageRepo = strings.Split(img[:strings.Index(img, ":")], "/")
	}
	container.Name = imageRepo[len(imageRepo)-1]

	if len(command) > 0 {
		container.Command = []string{"/bin/sh"}
		container.Args = []string{"-c", command}
	}

	if hostport > 0 {
		container.Ports = []v1.ContainerPort{
			{
				ContainerPort: hostport,
				HostPort:      hostport,
			},
		}
	}

	if len(workingDir) > 0 {
		container.WorkingDir = workingDir
	}

	return []v1.Container{container}
}
func waitTaskPhase(ctx *context, job *vkv1.TaskSet, phase []v1.PodPhase, taskNum int) error {
	var additionalError error
	err := wait.Poll(100*time.Millisecond, oneMinute, func() (bool, error) {
		pods, err := ctx.kubeclient.CoreV1().Pods(job.Namespace).List(metav1.ListOptions{})
		Expect(err).NotTo(HaveOccurred())

		readyTaskNum := 0
		for _, pod := range pods.Items {
			if !metav1.IsControlledBy(&pod, job) {
				continue
			}

			for _, p := range phase {
				if pod.Status.Phase == p {
					readyTaskNum++
					break
				}
			}
		}

		ready := taskNum <= readyTaskNum
		if !ready {
			additionalError = fmt.Errorf("expected job '%s' to have %d ready pods, actual got %d", job.Name,
				taskNum,
				readyTaskNum)
		}
		return ready, nil
	})
	if err != nil && strings.Contains(err.Error(), timeOutMessage) {
		return fmt.Errorf("[Wait time out]: %s", additionalError)
	}
	return err
}

func taskPhaseEx(ctx *context, job *vkv1.TaskSet, phase []v1.PodPhase, taskNum map[string]int) error {
	err := wait.Poll(100*time.Millisecond, oneMinute, func() (bool, error) {

		pods, err := ctx.kubeclient.CoreV1().Pods(job.Namespace).List(metav1.ListOptions{})
		Expect(err).NotTo(HaveOccurred())

		readyTaskNum := map[string]int{}
		for _, pod := range pods.Items {
			if !metav1.IsControlledBy(&pod, job) {
				continue
			}

			for _, p := range phase {
				if pod.Status.Phase == p {
					readyTaskNum[pod.Spec.PriorityClassName]++
					break
				}
			}
		}

		for k, v := range taskNum {
			if v > readyTaskNum[k] {
				return false, nil
			}
		}

		return true, nil
	})
	if err != nil && strings.Contains(err.Error(), timeOutMessage) {
		return fmt.Errorf("[Wait time out]")
	}
	return err

}
func jobEvicted(ctx *context, job *vkv1.TaskSet, time time.Time) wait.ConditionFunc {
	// TODO(k82cn): check Job's conditions instead of PodGroup's event.
	return func() (bool, error) {
		pg, err := ctx.tsclient.SchedulingV1alpha1().PodGroups(job.Namespace).Get(job.Name, metav1.GetOptions{})
		Expect(err).NotTo(HaveOccurred())

		events, err := ctx.kubeclient.CoreV1().Events(pg.Namespace).List(metav1.ListOptions{})
		Expect(err).NotTo(HaveOccurred())

		for _, event := range events.Items {
			target := event.InvolvedObject
			if target.Name == pg.Name && target.Namespace == pg.Namespace {
				if event.Reason == string("Evict") && event.LastTimestamp.After(time) {
					return true, nil
				}
			}
		}

		return false, nil
	}
}
func getGangMinAvailable(taskset *vkv1.TaskSet) int32 {
	var minAvailable int32 = 1

	if taskset == nil {
		return minAvailable
	}

	var gangPolicy string = "[]"

	for i := 0; i < len(taskset.Spec.Scheduler.Policies); i++ {
		policy := taskset.Spec.Scheduler.Policies[i]
		if "gang" == policy.Name {
			gangPolicy = policy.Policy
			break
		}
	}

	var json = jsoniter.ConfigCompatibleWithStandardLibrary

	list := json.Get([]byte(gangPolicy))

	size := list.Size()

	for i := 0; i < size; i++ {
		role := list.Get(i)
		minAvailable += role.Get("minAvailable", 0).ToInt32()
	}

	if minAvailable > 1 {
		minAvailable--
	}

	return minAvailable
}
func waitJobReady(ctx *context, job *vkv1.TaskSet) error {
	available := getGangMinAvailable(job)
	return waitTasksReady(ctx, job, int(available))
}

func waitJobPending(ctx *context, job *vkv1.TaskSet) error {
	available := getGangMinAvailable(job)
	return waitTaskPhase(ctx, job, []v1.PodPhase{v1.PodPending}, int(available))
}

func waitTasksReady(ctx *context, job *vkv1.TaskSet, taskNum int) error {
	return waitTaskPhase(ctx, job, []v1.PodPhase{v1.PodRunning, v1.PodSucceeded}, taskNum)
}

func waitTasksReadyEx(ctx *context, job *vkv1.TaskSet, taskNum map[string]int) error {
	return taskPhaseEx(ctx, job, []v1.PodPhase{v1.PodRunning, v1.PodSucceeded}, taskNum)
}

func waitTasksPending(ctx *context, job *vkv1.TaskSet, taskNum int) error {
	return waitTaskPhase(ctx, job, []v1.PodPhase{v1.PodPending}, taskNum)
}

func waitJobStateReady(ctx *context, job *vkv1.TaskSet) error {
	return waitJobPhaseExpect(ctx, job, Running, oneMinute)
}

func waitJobStatePending(ctx *context, job *vkv1.TaskSet) error {
	return waitJobPhaseExpect(ctx, job, Pending, oneMinute)
}

func waitJobStateAborted(ctx *context, job *vkv1.TaskSet) error {
	return waitJobPhaseExpect(ctx, job, Aborted, oneMinute)
}

func waitJobPhaseExpect(ctx *context, job *vkv1.TaskSet, state TaskSetPhase, waitTime time.Duration) (error, *vkv1.TaskSet) {
	var additionalError, err error

	var ts *vkv1.TaskSet

	err = wait.Poll(100*time.Millisecond, oneMinute, func() (bool, error) {

		ts, err = ctx.tsclient.OctopusV1alpha1().TaskSets(job.Namespace).Get(job.Name, metav1.GetOptions{})

		Expect(err).NotTo(HaveOccurred())

		glog.V(4).Infof("taskset [%s] status [%s]", job.Name, job.Status.Phase)

		expected := job.Status.Phase == string(state)

		if !expected {
			additionalError = fmt.Errorf("expected job '%s' phase in %s, actual got %s", job.Name,
				state, job.Status.Phase)
		}

		return expected, nil
	})

	if err != nil && strings.Contains(err.Error(), timeOutMessage) {
		return fmt.Errorf("[Wait time out]: %s", additionalError), nil
	}

	return err, ts
}

func waitJobStates(ctx *context, job *vkv1.TaskSet, phases []TaskSetPhase, waitTime time.Duration) (error, *vkv1.TaskSet) {
	var ts *vkv1.TaskSet
	var err error
	for _, phase := range phases {
		err, ts = waitJobPhaseExpect(ctx, job, phase, waitTime)
		if err != nil {
			return err, nil
		}
	}
	return nil, ts
}

func getTasksOfJob(ctx *context, job *vkv1.TaskSet) []*v1.Pod {
	pods, err := ctx.kubeclient.CoreV1().Pods(job.Namespace).List(metav1.ListOptions{})
	Expect(err).NotTo(HaveOccurred())

	var tasks []*v1.Pod

	for _, pod := range pods.Items {
		if !metav1.IsControlledBy(&pod, job) {
			continue
		}
		var duplicatePod *v1.Pod
		duplicatePod = pod.DeepCopy()
		tasks = append(tasks, duplicatePod)
	}

	return tasks
}

// IsNodeReady function returns the node ready status
func IsNodeReady(node *v1.Node) bool {
	for _, c := range node.Status.Conditions {
		if c.Type == v1.NodeReady {
			return c.Status == v1.ConditionTrue
		}
	}
	return false
}

func waitClusterReady(ctx *context) error {
	return wait.Poll(100*time.Millisecond, oneMinute, func() (bool, error) {
		if readyNodeAmount(ctx) >= 1 {
			return true, nil
		}
		return false, nil
	})
}

func readyNodeAmount(ctx *context) int {
	var amount int
	nodes, err := ctx.kubeclient.CoreV1().Nodes().List(metav1.ListOptions{})
	Expect(err).NotTo(HaveOccurred())
	for _, n := range nodes.Items {
		if IsNodeReady(&n) && len(n.Spec.Taints) == 0 {
			amount++
		}
	}
	return amount
}

func waitPodGone(ctx *context, podName, namespace string) error {
	var additionalError error
	err := wait.Poll(100*time.Millisecond, oneMinute, func() (bool, error) {
		_, err := ctx.kubeclient.CoreV1().Pods(namespace).Get(podName, metav1.GetOptions{})
		expected := errors.IsNotFound(err)
		if !expected {
			additionalError = fmt.Errorf("Job related pod should be deleted when aborting job.")
		}

		return expected, nil
	})
	if err != nil && strings.Contains(err.Error(), timeOutMessage) {
		return fmt.Errorf("[Wait time out]: %s", additionalError)
	}
	return err
}

func waitJobTerminateAction(ctx *context, pg *vkv1.TaskSet) error {
	return wait.Poll(10*time.Second, oneMinute, jobTerminateAction(ctx, pg, time.Now()))
}

func jobTerminateAction(ctx *context, pg *vkv1.TaskSet, time time.Time) wait.ConditionFunc {
	return func() (bool, error) {
		events, err := ctx.kubeclient.CoreV1().Events(pg.Namespace).List(metav1.ListOptions{})
		Expect(err).NotTo(HaveOccurred())

		for _, event := range events.Items {
			target := event.InvolvedObject
			if strings.HasPrefix(target.Name, pg.Name) && target.Namespace == pg.Namespace {
				if event.Reason == string(executeAction) && strings.Contains(event.Message, "TerminateJob") && event.LastTimestamp.After(time) {
					return true, nil
				}
			}
		}

		return false, nil
	}
}

func waitPodPhase(ctx *context, pod *v1.Pod, phase []v1.PodPhase) error {
	var additionalError error
	err := wait.Poll(100*time.Millisecond, oneMinute, func() (bool, error) {
		pods, err := ctx.kubeclient.CoreV1().Pods(pod.Namespace).List(metav1.ListOptions{})
		Expect(err).NotTo(HaveOccurred())

		for _, p := range phase {
			for _, pod := range pods.Items {
				if pod.Status.Phase == p {
					return true, nil
				}
			}
		}

		additionalError = fmt.Errorf("expected pod '%s' to %v, actual got %s", pod.Name, phase, pod.Status.Phase)
		return false, nil
	})
	if err != nil && strings.Contains(err.Error(), timeOutMessage) {
		return fmt.Errorf("[Wait time out]: %s", additionalError)
	}
	return err
}

func pgIsReady(ctx *context, namespace string) (bool, error) {
	pgs, err := ctx.tsclient.SchedulingV1alpha1().PodGroups(namespace).List(metav1.ListOptions{})
	if err != nil {
		return false, err
	}
	if pgs != nil && len(pgs.Items) == 0 {
		return false, fmt.Errorf("podgroup is not found")
	}

	for _, pg := range pgs.Items {
		if pg.Status.Phase != schedulingv1alpha1.PodGroupPending {
			return true, nil
		}
	}

	return false, fmt.Errorf("podgroup phase is Pending")
}

func isPodScheduled(pod *v1.Pod) bool {
	for _, cond := range pod.Status.Conditions {
		if cond.Type == v1.PodScheduled && cond.Status == v1.ConditionTrue {
			return true
		}
	}
	return false
}

func toYaml(in interface{}, outfile string) error {
	out, err := yaml.Marshal(in)
	if err != nil {
		return fmt.Errorf("yaml marshal error: %s", err)
	}
	err = ioutil.WriteFile(outfile, out, 0666)
	return err
}

func saveTaskSet(ctx *context, taskset *tsv1alpha1.TaskSet, output string) {
	job, _ := ctx.tsclient.OctopusV1alpha1().TaskSets(taskset.Namespace).Get(taskset.Name, metav1.GetOptions{})
	_ = toYaml(job, output)
}

func fromYaml(data []byte, class interface{}) error {
	err := yaml.Unmarshal(data, class)
	if err != nil {
		return fmt.Errorf("yaml marshal error: %s", err)
	}
	return nil
}

func buildCustomTaskSet(name string, replicas replica, eventPolicy []tsv1alpha1.EventPolicy, retry uint, minSucc, minFail int32, psCommand, workerCommand []string) *tsv1alpha1.TaskSet {
	roles := []tsv1alpha1.TaskRole{}
	roles = append(roles,
		buildRoleTask(Role_PS,
			replicas,
			eventPolicy,
			buildCompletionPolicy(minSucc, minFail),
			buildRetryPolicy(retry),
			buildCustomPod(psCommand)),
		buildRoleTask(Role_Wroker,
			replicas,
			eventPolicy,
			buildCompletionPolicy(minSucc, minFail),
			buildRetryPolicy(retry),
			buildCustomPod(workerCommand)))

	succTaskSet := buildTaskSet(name,
		TestNameSpace,
		DefaultQueue,
		HighPriority,
		buildRetryPolicy(0),
		buildDefaultScheduler(),
		roles,
	)
	return succTaskSet
}

func buildSuccessedTaskSet(name string) *tsv1alpha1.TaskSet {
	roles := []tsv1alpha1.TaskRole{}
	roles = append(roles,
		buildRoleTask(Role_PS,
			replica(1),
			buildFailedPolicy(),
			buildCompletionPolicy(1, 1),
			buildRetryPolicy(0),
			buildCustomPod(Command_Sleep_10S)),
		buildRoleTask(Role_Wroker,
			replica(1),
			buildFailedPolicy(),
			buildCompletionPolicy((1), (1)),
			buildRetryPolicy(0),
			buildCustomPod(Command_Sleep_10S)))

	succTaskSet := buildTaskSet(name,
		TestNameSpace,
		DefaultQueue,
		HighPriority,
		buildRetryPolicy(0),
		buildDefaultScheduler(),
		roles,
	)
	return succTaskSet
}
func buildFailedTaskSet(name string) *tsv1alpha1.TaskSet {
	roles := []tsv1alpha1.TaskRole{}
	roles = append(roles,
		buildRoleTask(Role_PS,
			replica(1),
			buildFailedPolicy(),
			buildCompletionPolicy(1, 1),
			buildRetryPolicy(0),
			buildCustomPod(Command_Sleep_10S_Failed)),
		buildRoleTask(Role_Wroker,
			replica(1),
			buildFailedPolicy(),
			buildCompletionPolicy((1), (1)),
			buildRetryPolicy(0),
			buildCustomPod(Command_Sleep_10S_Failed)))

	succTaskSet := buildTaskSet(name,
		TestNameSpace,
		DefaultQueue,
		HighPriority,
		buildRetryPolicy(0),
		buildDefaultScheduler(),
		roles,
	)
	return succTaskSet
}
func buildRandomFailedTaskSet(name string) *tsv1alpha1.TaskSet {
	roles := []tsv1alpha1.TaskRole{}
	roles = append(roles,
		buildRoleTask(Role_PS,
			replica(1),
			buildFailedPolicy(),
			buildCompletionPolicy(1, 1),
			buildRetryPolicy(0),
			buildCustomPod(Command_Random_Failed)),
		buildRoleTask(Role_Wroker,
			replica(2),
			buildFailedPolicy(),
			buildCompletionPolicy(2, (1)),
			buildRetryPolicy(0),
			buildCustomPod(Command_Random_Failed)))

	succTaskSet := buildTaskSet(name,
		TestNameSpace,
		DefaultQueue,
		HighPriority,
		buildRetryPolicy(0),
		buildDefaultScheduler(),
		roles,
	)
	return succTaskSet
}
func buildFailedRetryTaskSet(name string, retry uint, minSucc, minFail int32) *tsv1alpha1.TaskSet {
	roles := []tsv1alpha1.TaskRole{}
	roles = append(roles,
		buildRoleTask(Role_PS,
			replica(1),
			buildEmptyPolicy(),
			buildCompletionPolicy((1), (1)),
			buildRetryPolicy(0),
			buildCustomPod(Command_Sleep_1M)),
		buildRoleTask(Role_Wroker,
			replica(2),
			buildEmptyPolicy(),
			buildCompletionPolicy(minSucc, minFail),
			buildRetryPolicy(retry),
			buildCustomPod(Command_Sleep_10S_Failed)))

	succTaskSet := buildTaskSet(name,
		TestNameSpace,
		DefaultQueue,
		HighPriority,
		buildRetryPolicy(0),
		buildDefaultScheduler(),
		roles,
	)
	return succTaskSet
}

func emptyTaskSet(name string) *tsv1alpha1.TaskSet {
	roles := []tsv1alpha1.TaskRole{}

	return buildTaskSet(name,
		TestNameSpace,
		DefaultQueue,
		HighPriority,
		buildRetryPolicy(0),
		buildDefaultScheduler(),
		roles,
	)
}

func buildOneRoleFailedRetryTaskSet(name string, retry uint, minSucc, minFail int32) *tsv1alpha1.TaskSet {
	roles := []tsv1alpha1.TaskRole{}
	roles = append(roles,
		buildRoleTask(Role_Wroker,
			replica(2),
			buildEmptyPolicy(),
			buildCompletionPolicy(minSucc, minFail),
			buildRetryPolicy(retry),
			buildCustomPod(Command_Sleep_10S_Failed)))

	succTaskSet := buildTaskSet(name,
		TestNameSpace,
		DefaultQueue,
		HighPriority,
		buildRetryPolicy(0),
		buildDefaultScheduler(),
		roles,
	)
	return succTaskSet
}

func buildSuccPolicy() []tsv1alpha1.EventPolicy {
	eventPolicies := []tsv1alpha1.EventPolicy{
		{
			Event:  tc.EventRoleCompleted,
			Action: tc.ActionTaskSetCompleted,
		},
	}
	return eventPolicies
}

func buildFailedPolicy() []tsv1alpha1.EventPolicy {
	eventPolicies := []tsv1alpha1.EventPolicy{
		{
			Event:  tc.EventRoleFailed,
			Action: tc.ActionTaskSetFailed,
		},
	}
	return eventPolicies
}

func buildEmptyPolicy() []tsv1alpha1.EventPolicy {
	eventPolicies := []tsv1alpha1.EventPolicy{}
	return eventPolicies
}

func buildCompletionPolicy(minSucceeded, minFailed int32) tsv1alpha1.CompletionPolicy {
	return tsv1alpha1.CompletionPolicy{
		MinFailed:    minFailed,
		MinSucceeded: minSucceeded,
	}
}

func buildTaskSet(name, namespace, queue string, priority uint, retryPolicy tsv1alpha1.RetryPolicy, scheduler tsv1alpha1.SchedulerSetting, roles []tsv1alpha1.TaskRole) *tsv1alpha1.TaskSet {
	job := &tsv1alpha1.TaskSet{
		ObjectMeta: metav1.ObjectMeta{
			Name:      name,
			Namespace: namespace,
		},
		Spec: tsv1alpha1.TaskSetSpec{
			Queue:       queue,
			Priority:    priority,
			RetryPolicy: retryPolicy,
			Scheduler:   scheduler,
			Roles:       roles,
		},
	}
	return job
}

func buildRoleTask(name string, replicas replica, eventPolicies []tsv1alpha1.EventPolicy, completePolicy tsv1alpha1.CompletionPolicy, retryPolicy tsv1alpha1.RetryPolicy, pod v1.PodTemplateSpec) tsv1alpha1.TaskRole {
	role := tsv1alpha1.TaskRole{
		Name:             name,
		Replicas:         uint(replicas),
		EventPolicies:    eventPolicies,
		CompletionPolicy: completePolicy,
		RetryPolicy:      retryPolicy,
		Pod:              pod,
	}
	return role
}

func buildCustomPod(command []string) v1.PodTemplateSpec {
	container := buildContainer(
		Container_Defauly_name,
		busybox,
		command,
		lowResource,
	)
	return buildPod([]v1.Container{container})
}

func buildPod(containers []v1.Container) v1.PodTemplateSpec {
	pod := v1.PodTemplateSpec{
		Spec: v1.PodSpec{
			RestartPolicy: v1.RestartPolicyNever,
			Containers:    containers,
		},
	}
	return pod
}
func buildContainer(name, image string, command []string, resource v1.ResourceList) v1.Container {
	container := v1.Container{
		Name:    name,
		Image:   image,
		Command: command,
		Resources: v1.ResourceRequirements{
			Limits:   resource,
			Requests: resource,
		},
	}
	return container
}

func buildResourceList(cpu string, memory string) v1.ResourceList {
	return v1.ResourceList{
		v1.ResourceCPU:    resource.MustParse(cpu),
		v1.ResourceMemory: resource.MustParse(memory),
	}
}
func buildResourceListWithGPU(cpu string, memory string, GPU string) v1.ResourceList {
	return v1.ResourceList{
		v1.ResourceCPU:      resource.MustParse(cpu),
		v1.ResourceMemory:   resource.MustParse(memory),
		NVIDIA_GPU_RESOURCE: resource.MustParse(GPU),
	}
}

func buildDefaultScheduler() tsv1alpha1.SchedulerSetting {
	return tsv1alpha1.SchedulerSetting{
		Name: SchedulerName,
		Policies: []tsv1alpha1.SchedulerPolicy{
			{
				Name:   "gang",
				Policy: "[{\"role\":\"ps\",\"minAvailable\":1},{\"role\":\"worker\",\"minAvailable\":1}]",
			},
		},
	}
}

// todo buildGangScheduler
func buildGangScheduler(minNumber int) tsv1alpha1.SchedulerSetting {
	return tsv1alpha1.SchedulerSetting{
		Name: SchedulerName,
		Policies: []tsv1alpha1.SchedulerPolicy{
			{
				Name:   "gang",
				Policy: "[{\"role\":\"ps\",\"minAvailable\":1},{\"role\":\"worker\",\"minAvailable\":1}]",
			},
		},
	}
}

func buildRetryPolicy(retryCount uint) tsv1alpha1.RetryPolicy {
	retry := false
	if retryCount >= 1 {
		retry = true

	}
	return tsv1alpha1.RetryPolicy{
		Retry:         retry,
		MaxRetryCount: retryCount,
	}
}
