package main

import (
	"os"
	"net/http"
	"ms_server/config"
	"ms_server/lib/gbeta2"
	"ms_server/util/log"
	"ms_server/lib/persist/file"
	 mw "ms_server/middleware"
	"ms_server/router"
)

func setUp() {
	//read config
	logger := log.GetLogger()

	defer logger.Sync()

	err := config.InitConfig()

	if nil != err {
		logger.Fatal(err.Error())
	}
	// create root dir for storage
	if false == file_util.Exist(config.Get(config.FileStoragePath)) {
		os.MkdirAll(config.Get(config.FileStoragePath), os.ModeDir|os.ModePerm)
	}
}

func main() {

	setUp()

	logger:= log.GetLogger()

	defer logger.Sync()

	Router := gbeta2.New()

	Router.Mw(mw.GetLogger(nil))

	Router.GET("/", router.Index)

	Router.Use("/", mw.JSON_Parser)

	Router.Use("/", mw.Query_Parser)

	Router.SubRouter("/login", router.LoginRouter())

	Router.Use("/", mw.TokenRequired) // token is required

	Router.SubRouter("/project", router.ProjectRouter())

	Router.SubRouter("/upload", router.UploadRouter())

	Router.SubRouter("/download", router.DownloadRouter())

	logger.Info("Model-Hub is running at port:" + config.Get(config.ServerPort))

	err := http.ListenAndServe(":"+config.Get(config.ServerPort), Router.Build())

	if nil != err{
		logger.Fatal(err.Error())
	}

}
