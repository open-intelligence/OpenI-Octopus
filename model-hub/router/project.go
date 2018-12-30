package router

import   (
	"net/http"
	"net/url"
	"ms_server/lib/project"
	"github.com/json-iterator/go"
	"ms_server/lib/gbeta2"
	"ms_server/util/json"
	"ms_server/util/http"
)

func _versions (w *gbeta2.Res, r *http.Request, ctx *gbeta2.Ctx,next gbeta2.Next)(J.JSON,error){

	query :=  ctx.Get("query").(url.Values)
	
	user := query.Get("user")

	project_name := query.Get("project_name")

	if "" == user{
		return J.JSON{
			"success":false,
			"message":"Query parameter 'user' is required!",
		},nil
	}

	if "" == project_name{
		return J.JSON{
			"success":false,
			"message":"Query parameter 'project_name' is required!",
		},nil
	}

	versions,err:= project.GetVersions(user,project_name)

	if nil != err{
		return nil,err
	}

	return J.JSON{
		"success":true,
		"versions":versions,
	},nil

}

func _info(w *gbeta2.Res, r *http.Request, ctx *gbeta2.Ctx,next gbeta2.Next)(J.JSON,error){

	query :=  ctx.Get("query").(url.Values)
	user:= query.Get("user")
	project_name:= query.Get("project_name")
	version:= query.Get("project_version")

	if "" == user || project_name == "" || "" == version{
		return J.JSON{
			"success":false,
			"message":"Missing parameter,please check your input (user,project_name,project_version)",
		},nil
	}

	tar_version,info,err :=  project.Info(user,project_name,version);

	if nil != err{
		return nil,err
	}

	return J.JSON{
		"success":true,
		"version":tar_version,
		"info":info,
	},nil
}


func _convert(w *gbeta2.Res, r *http.Request, ctx *gbeta2.Ctx,next gbeta2.Next)(J.JSON,error){

	 body := ctx.Get("body").(jsoniter.Any)
	 
	 success,failed_message,err:= project.Convert(body.Get("project"),body.Get("params"))

	 if nil != err{
		 return nil,err
	 }

	 if true == success{
		 return J.JSON{
			 "success":true,
			 "message":"Convert successfully!",
		 },nil
	 }

	 return J.JSON{
		 "success":false,
		 "message":failed_message,
	 },nil
}

func ProjectRouter()*gbeta2.Router{

	router:= gbeta2.New()

	router.GET("/versions", http_util.HandleError(_versions))

	router.POST("/convert",http_util.HandleError(_convert))

	router.POST("/info",http_util.HandleError(_info))
	
	return router
}
 
 