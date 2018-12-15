
package main

import (
    "log"
    "os"
    "fmt"
    "github.com/julienschmidt/httprouter"
    "net/http"
    "ms_server/router"
    "ms_server/config"
    "ms_server/lib/persist/file"
     mw "ms_server/middleware"
)

func setUp(){
     //read config
   
    err:= config.InitConfig()
    
    if nil != err{
        log.Fatal(err)
        os.Exit(1)
    }
    // create root dir for files
    if false == file_util.Exist(config.Get(config.FileStoragePath)){
        os.MkdirAll(config.Get(config.FileStoragePath),os.ModeDir)
    }
    
}

func main()  {

    setUp()
   
    Router := httprouter.New()

    Router.POST("/login",mw.Link(mw.Wrap(router.Login)))

    Router.POST("/login/check",mw.Link(mw.Wrap(router.Signed)))

    Router.POST("/project/info",mw.Link(mw.TokenRequired,mw.Wrap(router.Info)))

    Router.GET("/project/versions",mw.Link(mw.TokenRequired,mw.Wrap(router.Versions)))

    Router.POST("/project/convert",mw.Link(mw.TokenRequired,mw.Wrap(router.Convert)))
    
    Router.POST("/upload/init",mw.Link(mw.TokenRequired,mw.Wrap(router.InitUpload)))

    Router.POST("/upload/commit",mw.Link(mw.TokenRequired,mw.Wrap(router.CommitUpload)))

    Router.POST("/download/init",mw.Link(mw.TokenRequired,mw.Wrap(router.InitDownload)))

    Router.POST("/download/commit",mw.Link(mw.TokenRequired,mw.Wrap(router.CommitDowload)))
    
    Router.POST("/upload",mw.Link(mw.TokenRequired,router.Upload))
    
    Router.GET("/download",mw.Link(mw.TokenRequired,router.Download))
    

    fmt.Println("MS_SERVER is running at port:"+config.Get(config.ServerPort))
    
    log.Fatal(http.ListenAndServe(":"+config.Get(config.ServerPort), Router))

    
}