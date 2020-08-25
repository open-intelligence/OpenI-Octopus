package app

import (
	"fmt"
	"os"
	libApp "scheduler/pkg/pipeline/app"
	"scheduler/pkg/pipeline/config"
	"scheduler/pkg/pipeline/test/common"
)

var tempDB = fmt.Sprintf("%s%s", os.TempDir(), "/taskset_app_test.db")

func removeOldDB() {
	os.Remove(tempDB)
}

func createApp() *libApp.App {
	config := &config.Config{
		Pipeline: &config.PipelineConfig{
			WorkerAmount: 10,
		},
		Mysql: &config.MysqlConfig{
			DBType:  "sqlite3",
			AuthStr: tempDB,
		},
		Kubernetes: nil,
		LifeHook: &config.LifeHookConfig{
			RequestTimeOutSec:         5,
			MaxParallelProcessRequest: 30,
			MaxRetryOnFail:            3,
		},
		Server: &config.ServerConfig{
			Port: "8080",
		},
	}

	return common.CreateApp(config)
}
