package serv

import (
	"context"
	"fmt"
	"github.com/fvbock/endless"
	"github.com/gin-gonic/gin"
	jsoniter "github.com/json-iterator/go"
	"go.uber.org/zap"
	"io/ioutil"
	"net/http"
	"scheduler/pkg/applet/conf"
	"scheduler/pkg/applet/framework"
	libTaskset "scheduler/pkg/crd/apis/taskset/v1alpha1"

	api "scheduler/pkg/pipeline/apis/common"
	constants "scheduler/pkg/pipeline/constants/feature"
)

func NewDefaultAppletServer() Server {
	logger, err := zap.NewProduction()
	if err != nil {
		panic("init zap logger failed: "+ err.Error())
	}
	return &defaultAppletServer{
		stopChan:        make(chan struct{}),
		logger:          logger,
		config:          conf.GetServerConfig(),
		appletDelegator: framework.NewComplexFeatureAppletDelegator(),
	}
}

type defaultAppletServer struct {
	stopChan         chan struct{}
	logger          *zap.Logger
	config          *conf.ServerConfiguration
	appletDelegator framework.AppletDelegator
}

func (d *defaultAppletServer) Append(feature *api.Feature, builder framework.AppletBuilder) {
	config,err := conf.GetAppletConfigurationByFeatureUID(feature.Name)
	if err != nil {
		panic(err)
	}

	applet, err := builder(config, d.stopChan)
	if err != nil {
		panic(err)
	}

	err = d.appletDelegator.RegisterApplet(feature, applet, config)
	if err != nil {
		panic(err)
	}
}

func (d *defaultAppletServer) Run() error {
	router := gin.Default()
	d.route(router)

	onPort := d.config.Port
	if onPort == "" {
		onPort = "8081"
	}

	server := endless.NewServer(":" + onPort, router)

	go func(){
		err := d.appletDelegator.Start(func(f api.Feature) *api.Feature {
			plugins := f.Plugins
			for _, plugin := range plugins {
				plugin.CallAddress = fmt.Sprintf("%s:%s/%s/%s",
					d.config.Host,
					onPort,
					plugin.PluginType,
					f.Name,
				)
			}
			return &f
		})
		if err != nil {
			d.logger.Error(err.Error())
			server.Shutdown(context.TODO())
		}
	}()

	err := server.ListenAndServe()
	return err
}

func (d *defaultAppletServer) ShutDown() error {
	close(d.stopChan)
	return d.appletDelegator.Stop()
}

func (d *defaultAppletServer) deserializePacket(c *gin.Context, pluginType string) (*framework.Packet, error) {
	body, err := ioutil.ReadAll(c.Request.Body)
	if err != nil {
		return nil, err
	}

	var p framework.Packet
	if err = jsoniter.Unmarshal(body, &p); err != nil {
		return nil, err
	}
	p.Bytes = body

	jobStr := jsoniter.Get(body, "job").ToString()
	if jobStr == "" {
		return &p, nil
	}

	switch pluginType {
	case constants.PLUGIN_TYPE_TEMPLATE_TRANSLATOR:
		p.JobConfig = jobStr
	case constants.PLUGIN_TYPE_ACCESS_GATE, constants.PLUGIN_TYPE_FACTOR_GENERATOR, constants.PLUGIN_TYPE_TEMPLATE_DECORATOR, constants.PLUGIN_TYPE_SCHEDULER_BINDER:
		var taskset libTaskset.TaskSet
		if err = jsoniter.Unmarshal([]byte(jobStr), &taskset); err != nil {
			return nil, err
		}
		p.Taskset = &taskset
	}

	return &p, nil
}

func (d *defaultAppletServer) route(router *gin.Engine) {
	router.POST("/:pluginType/:featureUID", func(c *gin.Context) {
		pluginType := c.Param("pluginType")
		featureUID := c.Param("featureUID")

		p, err := d.deserializePacket(c, pluginType)
		if err != nil {
			d.logger.Error(err.Error())
			c.JSON(http.StatusBadRequest, gin.H{})
			return
		}
		packet := &framework.AppletPacket{
			FeatureUID: featureUID,
			Packet: p,
		}

		var (
			e error
			result interface{}
			contentType string = "application/json"
		)
		switch pluginType {
		case constants.PLUGIN_TYPE_TEMPLATE_TRANSLATOR:
			result, e = d.appletDelegator.ExecTemplateTranslator(packet)
		case constants.PLUGIN_TYPE_ACCESS_GATE:
			result, e = d.appletDelegator.ExecAccessGate(packet)
		case constants.PLUGIN_TYPE_TEMPLATE_DECORATOR:
			result, e = d.appletDelegator.ExecTemplateDecorator(packet)
		case constants.PLUGIN_TYPE_FACTOR_GENERATOR:
			result, e = d.appletDelegator.ExecFactorGenerator(packet)
		case constants.PLUGIN_TYPE_SCHEDULER_BINDER:
			result, e = d.appletDelegator.ExecSchedulerBinder(packet)
		case constants.PLUGIN_TYPE_LIFEHOOK:
			result, e = d.appletDelegator.ExecLifeHook(packet)
			contentType = "text/plain"
		default:
			c.JSON(http.StatusNotFound, gin.H{})
			return
		}

		if e != nil {
			d.logger.Error(e.Error())
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": e.Error(),
			})
		} else if taskset, ok := result.(*libTaskset.TaskSet); ok {
			c.JSON(http.StatusOK, &taskset)
		} else if factor, ok := result.(*framework.Factor); ok {
			c.JSON(http.StatusOK, &factor)
		} else if accessor, ok := result.(*framework.Accessor); ok {
			c.JSON(http.StatusOK, &accessor)
		} else if b, ok:= result.([]byte); ok {
			c.Data(http.StatusOK, contentType, b)
		} else {
			c.JSON(http.StatusNotImplemented, gin.H{})
		}
	})
}

