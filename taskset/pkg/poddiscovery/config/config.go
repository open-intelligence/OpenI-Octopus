// MIT License
//
// Copyright (c) PCL. All rights reserved.
//
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

	"k8s.io/client-go/rest"
	"k8s.io/client-go/tools/clientcmd"
)

// Config declare the config of taskset crd controller
type Config struct {
	K8sAPIServer  *string `yaml:"k8sApiServer"`
	K8sConfigFile *string `yaml:"k8sConfigFile"`
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

	kConfig, err := buildKubeConfig(*cf.K8sAPIServer, *cf.K8sConfigFile)

	if nil != err {
		panic(err)
	}

	return cf, kConfig
}

func buildKubeConfig(master, configFilePath string) (*rest.Config, error) {
	if master != "" || configFilePath != "" {
		return clientcmd.BuildConfigFromFlags(master, configFilePath)
	}
	return rest.InClusterConfig()
}
