package test

import (
	"fmt"
	jsoniter "github.com/json-iterator/go"
	"scheduler/pkg/applet/framework"
	libTaskset "scheduler/pkg/crd/apis/taskset/v1alpha1"
	api "scheduler/pkg/pipeline/apis/common"
	pluginTypes "scheduler/pkg/pipeline/constants/feature"
	"scheduler/pkg/pipeline/phases/accessgate"
)

type MockApplet struct {
	
}

func (m * MockApplet) ExecTemplateTranslator(packet *framework.AppletPacket) (*libTaskset.TaskSet, error) {
	fmt.Println(packet.FeatureUID)
	fmt.Println(packet.Packet)

	tasksetStr := `
{"kind": "TaskSet", "spec": {"roles": [{"name": "test11", "replicas": 1, "template": {"spec": {"volumes": [{"name": "mount-1591093800179", "hostPath": {"path": "/ghome/admin"}}, {"name": "mount-1591093800180", "hostPath": {"path": "/gmodel/admin"}}, {"name": "mount-1591093800181", "hostPath": {"path": "/gdata"}}, {"name": "mount-1591093800182", "hostPath": {"path": "/etc/localtime"}}, {"name": "cache-volume", "emptyDir": {"medium": "Memory", "sizeLimit": "64Mi"}}, {"name": "netsharehost", "hostPath": {"path": "/ghome/admin/share_hosts/0322a3300a4bc011ea0a2f801d24dc3d7d91", "type": "FileOrCreate"}}, {"name": "netsharehost0", "hostPath": {"path": "/ghome/admin/share_hosts/0322a3300a4bc011ea0a2f801d24dc3d7d91.json", "type": "FileOrCreate"}}, {"name": "netsharehost1", "hostPath": {"path": "/etc/localtime"}}], "containers": [{"env": [{"name": "NVIDIA_VISIBLE_DEVICES", "value": "void"}], "name": "test11-container", "image": "192.168.202.74:5000/user-images/deepo:v2.0", "command": ["sh", "-c", "sleep 10;sleep 10"], "resources": {"limits": {"cpu": 4, "memory": "16384Mi"}}, "volumeMounts": [{"name": "mount-1591093800179", "mountPath": "/userhome"}, {"name": "mount-1591093800180", "mountPath": "/model-hub"}, {"name": "mount-1591093800181", "readOnly": true, "mountPath": "/gdata"}, {"name": "mount-1591093800182", "readOnly": true, "mountPath": "/etc/localtime"}, {"name": "cache-volume", "mountPath": "/dev/shm"}, {"name": "netsharehost", "readOnly": true, "mountPath": "/etc/hosts"}], "securityContext": {"capabilities": {"add": []}}}], "hostNetwork": false, "nodeSelector": {"resourceType": "dgx"}, "restartPolicy": "Never", "schedulerName": "kube-batch", "initContainers": [{"name": "sharehostsoperator", "image": "192.168.202.74:5000/octopus/taskset:poddiscovery-1.0.1", "command": ["sh", "-c", "/app/poddiscovery"], "volumeMounts": [{"name": "netsharehost", "mountPath": "/etc/hosts"}, {"name": "netsharehost0", "mountPath": "/etc/hosts_json.json"}, {"name": "netsharehost1", "mountPath": "/etc/localtime"}]}], "serviceAccountName": "poddiscovery"}, "metadata": {"annotations": {"scheduling.k8s.io/group-name": "0322a3300a4bc011ea0a2f801d24dc3d7d91"}}}, "eventPolicy": [], "retryPolicy": {"retry": false, "maxRetryCount": 0}, "completionPolicy": {"maxFailed": 1, "minSucceeded": 1}}], "retryPolicy": {"retry": false, "maxRetryCount": 0}}, "metadata": {"name": "0322a3300a4bc011ea0a2f801d24dc3d7d91", "labels": {"job-name": "chargetesttees283656", "job-type": "dgx", "platform-user": "21232f297a57a5a743894a0e4a801fc3", "platform-group": "vc8a4p4rgz0"}, "namespace": "21232f297a57a5a743894a0e4a801fc3"}, "username": "admin", "minMember": 1, "apiVersion": "octopus.openi.pcl.cn/v1alpha1"}
	`
	var taskset libTaskset.TaskSet
	if err := jsoniter.Unmarshal([]byte(tasksetStr), &taskset); err != nil {
		return nil, err
	}

	return &taskset, nil
}

func (m * MockApplet) ExecFactorGenerator(packet *framework.AppletPacket) (*framework.Factor, error) {
	fmt.Println(packet.FeatureUID)
	fmt.Println(packet.Packet)

	return &framework.Factor{
		Topic:  "priority",
		Advice: "10",
		Reason: "user is admin",
	},nil
}

func (m * MockApplet) ExecAccessGate(packet *framework.AppletPacket) (*framework.Accessor, error) {
	fmt.Println(packet.FeatureUID)
	fmt.Println(packet.Packet)

	return &framework.Accessor{
		Decision: accessgate.DecisionPass,
		Reason:   "admin",
	}, nil
}

func (m * MockApplet) ExecTemplateDecorator(packet *framework.AppletPacket) (*libTaskset.TaskSet, error) {
	fmt.Println(packet.FeatureUID)
	fmt.Println(packet.Packet)

	return packet.Packet.Taskset, nil
}

func (m * MockApplet) ExecSchedulerBinder(packet *framework.AppletPacket) (*libTaskset.TaskSet, error) {
	fmt.Println(packet.FeatureUID)
	fmt.Println(packet.Packet)

	return packet.Packet.Taskset, nil
}

func (m * MockApplet) ExecLifeHook(packet *framework.AppletPacket) ([]byte, error) {
	fmt.Println(packet.FeatureUID)
	fmt.Println(packet.Packet)

	return []byte("OK"), nil
}

var hpcFeature *api.Feature =  &api.Feature{
	Name:        "hpc",
	Author:      "tensionliu",
	Enabled:     false,
	Description: "hpc feature for test",
	JobSelector: &api.JobSelector{
		Expression: "*",
	},
	Plugins: []*api.Plugin{
		&api.Plugin{
			PluginType: pluginTypes.PLUGIN_TYPE_TEMPLATE_TRANSLATOR,
		},
		&api.Plugin{
			PluginType: pluginTypes.PLUGIN_TYPE_FACTOR_GENERATOR,
		},
		&api.Plugin{
			PluginType: pluginTypes.PLUGIN_TYPE_ACCESS_GATE,
		},
		&api.Plugin{
			PluginType: pluginTypes.PLUGIN_TYPE_TEMPLATE_DECORATOR,
		},
		&api.Plugin{
			PluginType: pluginTypes.PLUGIN_TYPE_SCHEDULER_BINDER,
		},
		&api.Plugin{
			PluginType: pluginTypes.PLUGIN_TYPE_LIFEHOOK,
			JobSelector: &api.JobSelector{
				States: []string{"*"},
			},
		},
	},
}
