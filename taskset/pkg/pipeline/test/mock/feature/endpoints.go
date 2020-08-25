package feature

import (
	"scheduler/pkg/pipeline/constants/feature"

	jsoniter "github.com/json-iterator/go"
)

const DefaultTaskSet = `{"apiVersion":"octopus.openi.pcl.cn/v1alpha1","kind":"TaskSet","metadata":{"name":"test","namespace":"default"},"spec":{"retryPolicy":{"maxRetryCount":0,"retry":false},"roles":[{"completionPolicy":{"maxFailed":1,"minSucceeded":1},"eventPolicy":[],"name":"default","replicas":1,"retryPolicy":{"maxRetryCount":0,"retry":false},"template":{"spec":{"containers":[{"command":["sh","-c","sleep 20;exit 0"],"image":"busybox","name":"busybox"}],"restartPolicy":"Never"}}}]}}`

func (f *FeatureImp) translateTemplate(payload []byte) ([]byte, error) {

	if f.HandlerFuncs != nil && f.HandlerFuncs.Translator != nil {

		return f.HandlerFuncs.Translator(payload)
	}
	return []byte(DefaultTaskSet), nil
}

func (f *FeatureImp) generateFactor(payload []byte) ([]byte, error) {

	if f.HandlerFuncs != nil && f.HandlerFuncs.Factor != nil {
		return f.HandlerFuncs.Factor(payload)
	}
	factor := `{
			topic:"priority",
			advice: 10,
			reason: "no",
	}`
	return []byte(factor), nil
}

func (f *FeatureImp) check(payload []byte) ([]byte, error) {
	if f.HandlerFuncs != nil && f.HandlerFuncs.Gate != nil {
		return f.HandlerFuncs.Gate(payload)
	}
	decision := `{
			"decision":"pass",
			"reason":"no special rule",
	}`
	return []byte(decision), nil
}

func (f *FeatureImp) decorate(payload []byte) ([]byte, error) {

	if f.HandlerFuncs != nil && f.HandlerFuncs.Decorator != nil {
		return f.HandlerFuncs.Decorator(payload)
	}
	return []byte(jsoniter.Get(payload, "job").ToString()), nil
}

func (f *FeatureImp) bindScheduler(payload []byte) ([]byte, error) {

	if f.HandlerFuncs != nil && f.HandlerFuncs.SchedulerBinder != nil {
		return f.HandlerFuncs.SchedulerBinder(payload)
	}

	return []byte(jsoniter.Get(payload, "job").ToString()), nil
}

func (f *FeatureImp) lifeHook(payload []byte) ([]byte, error) {

	if f.HandlerFuncs != nil && f.HandlerFuncs.LifeHook != nil {
		return f.HandlerFuncs.LifeHook(payload)
	}
	//fmt.Printf("hook: %v",string(payload))
	return []byte("ok"), nil
}

func (f *FeatureImp) request(payload []byte, pType string) ([]byte, error) {
	var buf []byte
	var err error

	switch pType {
	case "/" + feature.PLUGIN_TYPE_TEMPLATE_TRANSLATOR:
		{
			buf, err = f.translateTemplate(payload)
		}
	case "/" + feature.PLUGIN_TYPE_FACTOR_GENERATOR:
		{
			buf, err = f.generateFactor(payload)
		}
	case "/" + feature.PLUGIN_TYPE_ACCESS_GATE:
		{
			buf, err = f.check(payload)
		}
	case "/" + feature.PLUGIN_TYPE_TEMPLATE_DECORATOR:
		{
			buf, err = f.decorate(payload)
		}
	case "/" + feature.PLUGIN_TYPE_SCHEDULER_BINDER:
		{
			buf, err = f.bindScheduler(payload)
		}
	case "/" + feature.PLUGIN_TYPE_LIFEHOOK:
		{
			buf, err = f.lifeHook(payload)
		}
	}

	return buf, err
}
