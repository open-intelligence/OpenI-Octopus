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
	"os"
	"strconv"
)

const (
	MysqlMaxIdleConns = "MysqlMaxIdleConns"
	MysqlMaxOpenConns = "MysqlMaxOpenConns"
	MysqlAuthStr      = "MysqlAuthStr"
	MysqlDebugSql     = "MysqlDebugSql"
)

const (
	LifeHookRequestTimeoutSec         = "LifeHookRequestTimeoutSec"
	LifeHookMaxParallelProcessRequest = "LifeHookMaxParallelProcessRequest"
	LifeHookMaxRetryOnFail            = "LifeHookMaxRetryOnFail"
)

const (
	PipelineWorkerAmount = "PipelineWorkerAmount"
)

const (
	AdminToken = "AdminToken"
	ServerPort = "ServerPort"
	DebugMode  = "DebugMode"
)

const (
	KubeApiServer = "KubeApiServer"
	KubeFilePath  = "KubeFilePath"
)

func parseInt(v string, defa int) int {
	vv, err := strconv.ParseInt(v, 10, 64)
	if err != nil {
		return defa
	}
	return int(vv)
}

func fromEnv() *Config {
	config := &Config{}
	maxIdleConns := os.Getenv(MysqlMaxIdleConns)
	maxOpenConns := os.Getenv(MysqlMaxOpenConns)
	mysqlAuthStr := os.Getenv(MysqlAuthStr)
	isDebugSql   := false
	if os.Getenv(MysqlDebugSql) == "true" {
		isDebugSql = true
	}

	config.Mysql = &MysqlConfig{
		MaxIdleConns: parseInt(maxIdleConns, 10),
		MaxOpenConns: parseInt(maxOpenConns, 20),
		AuthStr:      mysqlAuthStr,
		DebugSql:     isDebugSql,
	}

	requestTimeoutSec := os.Getenv(LifeHookRequestTimeoutSec)
	maxParallelProcessRequest := os.Getenv(LifeHookMaxParallelProcessRequest)
	maxRetryOnFail := os.Getenv(LifeHookMaxRetryOnFail)

	config.LifeHook = &LifeHookConfig{
		RequestTimeOutSec:         parseInt(requestTimeoutSec, 10),
		MaxParallelProcessRequest: parseInt(maxParallelProcessRequest, 10),
		MaxRetryOnFail:            parseInt(maxRetryOnFail, 3),
	}

	pipelineWorkerAmount := os.Getenv(PipelineWorkerAmount)

	config.Pipeline = &PipelineConfig{
		WorkerAmount: parseInt(pipelineWorkerAmount, 20),
	}

	serverPort := os.Getenv(ServerPort)
	if "" == serverPort {
		serverPort = ":8080"
	}
	isDebugMode := false
	if os.Getenv(DebugMode) == "true" {
		isDebugMode = true
	}
	config.Server = &ServerConfig{
		Port:      serverPort,
		DebugMode: isDebugMode,
	}
	config.AdminToken = os.Getenv(AdminToken)

	kubeApiServer := os.Getenv(KubeApiServer)
	kubeFilePath := os.Getenv(KubeFilePath)

	kube, err := buildKubeConfig(kubeApiServer, kubeFilePath)
	if err != nil {
		panic(err)
	}

	config.Kubernetes = kube

	validateConfig(config)

	return config
}
