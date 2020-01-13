package config

import (
	"fmt"
	"io/ioutil"
	"os"
	"scheduler/pkg/common/utils"
	"strconv"

	"k8s.io/client-go/rest"
	"k8s.io/client-go/tools/clientcmd"
)

// ControllerName  is the name of this controller
const ControllerName = "TaskSetController"

// Config declare the config of taskset crd controller
type Config struct {
	WorkerAmount            *uint   `yaml:"workerAmount"`
	ControllerName          *string `yaml:"controllerName"`
	K8sAPIServer            *string `yaml:"k8sApiServer"`
	K8sConfigFile           *string `yaml:"k8sConfigFile"`
	CacheCreationTimeoutSec *int64  `yaml:"cacheCreationTimeoutSec"`
}

func fromFile(filePath string) *Config {
	c := &Config{}

	yamlBytes, err := ioutil.ReadFile(filePath)

	if nil != err {
		panic(fmt.Errorf("Failed to read config file: %v, %v", filePath, err))
	}

	utils.FromYaml(string(yamlBytes), c)

	return c
}

func getEnv(name, deft string) string {
	if "" == os.Getenv(name) {
		return deft
	}

	return os.Getenv(name)
}

func fromEnv() *Config {

	c := &Config{}

	c.K8sAPIServer = utils.PtrString(getEnv("K8sAPIServer", ""))

	c.K8sConfigFile = utils.PtrString(getEnv("K8sConfigFile", ""))

	workerAmount, err := strconv.ParseUint(getEnv("WorkerAmount", "10"), 10, 64)

	if nil != err {
		panic(fmt.Errorf("Failed to parse workerAmount from env: %v", os.Getenv("WorkerAmount")))
	}

	c.WorkerAmount = utils.PtrUint(uint(workerAmount))

	cacheCreationTimeoutSec, err := strconv.ParseInt(getEnv("CacheCreationTimeoutSec", "300"), 10, 64)

	if nil != err {
		panic(fmt.Errorf("Failed to parse CacheCreationTimeoutSec from env: %v", os.Getenv("CacheCreationTimeoutSec")))
	}

	c.CacheCreationTimeoutSec = utils.PtrInt64(cacheCreationTimeoutSec)

	return c
}

// NewConfig is the constructor of Config
func NewConfig() (*Config, *rest.Config) {

	configFilePath := utils.ParseArgs(os.Args)["config"]

	var cf *Config

	if "" != configFilePath {
		cf = fromFile(configFilePath)
	} else {
		cf = fromEnv()
	}

	cf.ControllerName = utils.PtrString(ControllerName)

	kConfig, err := buildKubeConfig(*cf.K8sAPIServer, *cf.K8sConfigFile)

	if nil != err {
		panic(err)
	}

	if nil == cf.WorkerAmount {
		cf.WorkerAmount = utils.PtrUint(10)
	}

	if *cf.WorkerAmount < 1 {
		cf.WorkerAmount = utils.PtrUint(10)
	}

	if nil == cf.CacheCreationTimeoutSec {
		cf.CacheCreationTimeoutSec = utils.PtrInt64(300)
	}

	return cf, kConfig
}

func buildKubeConfig(master, configFilePath string) (*rest.Config, error) {
	if master != "" || configFilePath != "" {
		return clientcmd.BuildConfigFromFlags(master, configFilePath)
	}
	return rest.InClusterConfig()
}
