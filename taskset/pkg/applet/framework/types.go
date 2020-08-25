package framework

import (
	"scheduler/pkg/applet/conf"
	libTaskset "scheduler/pkg/crd/apis/taskset/v1alpha1"
	api "scheduler/pkg/pipeline/apis/common"
	libLifeHook "scheduler/pkg/pipeline/components/lifehook"
	"sync"
)

type complexFeatureAppletDelegator struct {
	mux     sync.RWMutex
	applets map[string]*featureAppletDelegator
}

type featureAppletDelegator struct {
	config            *conf.AppletConfiguration
	feature           *api.Feature
	featureWrapper    *api.Feature
	applet            Applet
}

type AppletPacket struct {
	FeatureUID string
	Packet     *Packet
	config     *conf.AppletConfiguration
}

type Packet struct {
	Factors       map[string][]*Factor `json:"factors"`
	Header        map[string]string    `json:"header"`
	JobConfig     string
	Taskset       *libTaskset.TaskSet
	Bytes         []byte

	libLifeHook.HookTaskMessage
}

type WrapperFeatureFn func(f api.Feature) *api.Feature
type AppletBuilder func(config *conf.AppletConfiguration, stopCh <-chan struct{}) (Applet, error)

type Factor struct {
	Topic  string  `json:"topic"`
	Advice string  `json:"advice"`
	Reason string  `json:"reason"`
}

type Accessor struct {
	Decision  string  `json:"decision"`
	Reason    string  `json:"reason"`
}

