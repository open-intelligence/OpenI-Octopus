// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE
//

package config

import (
	"fmt"
	"io/ioutil"
	"os"
	"scheduler/pkg/common/utils"

	yaml "gopkg.in/yaml.v2"
	"k8s.io/client-go/rest"
	"k8s.io/client-go/tools/clientcmd"
)

type MysqlConfig struct {
	MaxIdleConns int    `yaml:"maxIdleConns"`
	MaxOpenConns int    `yaml:"maxOpenConns"`
	AuthStr      string `yaml:"authStr"`
	DBType       string `yaml:"dbType"`
	DebugSql     bool   `yaml:"debugSql"`
}

type LifeHookConfig struct {
	RequestTimeOutSec         int `yaml:"requestTimeOutSec"`
	MaxParallelProcessRequest int `yaml:"maxParallelProcessRequest"`
	MaxRetryOnFail            int `yaml:"maxRetryOnFail"`
}

type PipelineConfig struct {
	WorkerAmount int `yaml:"workerAmount"`
}

type ServerConfig struct {
	DebugMode bool    `yaml:"debugMode"`
	Port      string  `yaml:"port"`
}

type KubeConfig struct {
	ApiServer    string `yaml:"apiServer"`
	KubeFilePath string `yaml:"kubeFilePath"`
}

type configTemplate struct {
	AdminToken string          `yaml:"adminToken"`
	Pipeline   *PipelineConfig `yaml:"pipeline"`
	Mysql      *MysqlConfig    `yaml:"mysql"`
	Kubernetes *KubeConfig     `yaml:"kubernetes"`
	LifeHook   *LifeHookConfig `yaml:"lifehook"`
	Server     *ServerConfig   `yaml:"server"`
}

type Config struct {
	AdminToken string          `yaml:"adminToken"`
	Pipeline   *PipelineConfig `yaml:"pipeline"`
	Mysql      *MysqlConfig    `yaml:"mysql"`
	Kubernetes *rest.Config    `yaml:"kubernetes"`
	LifeHook   *LifeHookConfig `yaml:"lifehook"`
	Server     *ServerConfig   `yaml:"server"`
}

func buildKubeConfig(master, configFilePath string) (*rest.Config, error) {
	if master != "" || configFilePath != "" {
		return clientcmd.BuildConfigFromFlags(master, configFilePath)
	}
	return rest.InClusterConfig()
}
func validateConfig(config *Config) {

	if nil == config.Kubernetes {
		kube, err := buildKubeConfig("", "")
		if err != nil {
			panic(err)
		}
		config.Kubernetes = kube
	}

	if config.Pipeline == nil || config.Pipeline.WorkerAmount < 0 || config.Pipeline.WorkerAmount > 1000 {
		config.Pipeline = &PipelineConfig{
			WorkerAmount: 20,
		}
	}

	if nil == config.Mysql || "" == config.Mysql.AuthStr {
		panic(fmt.Errorf("Missing mysql auth string"))
	}

	if config.Mysql.MaxIdleConns > 50 {
		config.Mysql.MaxIdleConns = 50
	}

	if config.Mysql.MaxIdleConns < 0 {
		config.Mysql.MaxIdleConns = 10
	}

	if config.Mysql.MaxOpenConns > 200 {
		config.Mysql.MaxIdleConns = 200
	}

	if config.Mysql.MaxIdleConns < 0 {
		config.Mysql.MaxIdleConns = 30
	}

	if config.Mysql.DBType == "" {
		config.Mysql.DBType = "mysql"
	}

	if config.LifeHook == nil {
		config.LifeHook = &LifeHookConfig{
			RequestTimeOutSec:         10,
			MaxParallelProcessRequest: 20,
			MaxRetryOnFail:            3,
		}
	}

	if config.LifeHook.RequestTimeOutSec < 0 {
		config.LifeHook.RequestTimeOutSec = 10
	}
	if config.LifeHook.MaxParallelProcessRequest < 0 {
		config.LifeHook.MaxParallelProcessRequest = 10
	}

	if config.LifeHook.MaxRetryOnFail < 0 ||
		config.LifeHook.MaxParallelProcessRequest > 20 {
		config.LifeHook.MaxRetryOnFail = 3
	}

	if nil == config.Server {
		config.Server = &ServerConfig{}
	}

	if "" == config.Server.Port {
		config.Server.Port = ":8080"
	}

	if "" == config.AdminToken {
		config.AdminToken = "KLtmMug9BDvvRjlg"
	}

}

func fromFile(path string) *Config {
	file, err := ioutil.ReadFile(path)
	if nil != err {
		panic(err)
	}
	cf := &configTemplate{}
	err = yaml.Unmarshal(file, cf)
	if nil != err {
		panic(fmt.Errorf("Failed to parse config from config file! Error:%s", err.Error()))
	}

	if nil == cf.Kubernetes {
		panic(fmt.Errorf("Missing kubenetes config data"))
	}

	kube, err := buildKubeConfig(cf.Kubernetes.ApiServer, cf.Kubernetes.KubeFilePath)

	if nil != err {
		panic(err)
	}

	config := &Config{
		AdminToken: cf.AdminToken,
		Pipeline:   cf.Pipeline,
		Mysql:      cf.Mysql,
		LifeHook:   cf.LifeHook,
		Server:     cf.Server,
		Kubernetes: kube,
	}

	validateConfig(config)

	return config
}

func NewConfig() *Config {
	configFilePath := utils.ParseArgs(os.Args)["config"]
	if "" != configFilePath {
		return fromFile(configFilePath)
	}
	return fromEnv()
}
