package router

import (
	"github.com/json-iterator/go"
	"ms_server/lib/download"
	"ms_server/lib/persist/mysql"
	"net/http"
	"net/url"
	"ms_server/lib/gbeta2"
	"ms_server/util/json"
	"ms_server/util/http"
)

func _initDownload (w *gbeta2.Res, r *http.Request, ctx *gbeta2.Ctx,next gbeta2.Next)(J.JSON,error){

	body := ctx.Get("body").(jsoniter.Any)

	user  :=  body.Get("user").ToString()

	project_name := body.Get("project_name").ToString()
	 
	project_version  := body.Get("project_version").ToString()

	 if user == "" || project_name == "" || project_version == ""{
		 return J.JSON{
			 "success":false,
			 "message":"Lack of parameter",
		 },nil
	 }

	 found, info, err := download.PrepareDownload(user,project_name,project_version)

	 if nil != err{
		 return nil,err
	 }

	 if true == found{
		return J.JSON{
			"success":true,
			"project_info":info,
			"found":true,
		},nil
	 }

	 return J.JSON{
		 "success":true,
		 "found":false,
	 },nil
}


func _download(w *gbeta2.Res, r *http.Request, ctx *gbeta2.Ctx,next gbeta2.Next)(J.JSON,error){

	query := ctx.Get("query").(url.Values)

	token := r.Header.Get("token")

	file := query.Get("file")

	seq := query.Get("seq")

	size := query.Get("block_size")

	version := query.Get("version")

	user := query.Get("user")
 
	project := query.Get("project")

	if ""== token || "" == file || seq =="" || size == "" || version == "" || user == "" || project == ""{
		w.WriteHeader(400)
		w.Write([]byte(`{"success":false,"message":"Lack of parameter!"}`))
		return nil,nil
	}

	sql:= "SELECT username FROM ms_token WHERE username=? AND  token=?;"

	any,err := mysql_util.QueryAsJson(sql,user,token)

	if nil != err{
		return nil,err
	}

	if any.Size() == 0{
		w.WriteHeader(401)
		w.Write([]byte(`{"success":false,"message":"Access denied"}`))
		return nil,nil
	}

	err = download.DownloadChunk(user,project,version,file, seq, size, w)
	
    return nil,err
}

func _commitDownload(w *gbeta2.Res, r *http.Request, ctx * gbeta2.Ctx,next gbeta2.Next)(J.JSON,error){
	return J.JSON{
		"success":true,
		"message":"ok",
	},nil
}



func DownloadRouter()*gbeta2.Router{
	
	router:= gbeta2.New()

	router.GET("/",http_util.HandleError(_download))

	router.POST("/init",http_util.HandleError(_initDownload))

	router.POST("/commit",http_util.HandleError(_commitDownload))

	return  router
}


 