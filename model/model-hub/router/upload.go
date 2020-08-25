// created by yyrdl on 2018.12.18

package router

import(
	"net/http"
	"net/url" 
	"github.com/json-iterator/go"
	"ms_server/lib/upload"
	"ms_server/lib/gbeta2"
	"ms_server/util/json"
	"ms_server/util/http"
	"ms_server/lib/persist/mysql"
	 mw "ms_server/middleware"
)


func _initUpload(w *gbeta2.Res, r *http.Request, ctx *gbeta2.Ctx,next gbeta2.Next)  (J.JSON,error){
	
	body :=  ctx.Get("body").(jsoniter.Any)
 
	user :=  body.Get("user").ToString()

	project_name := body.Get("project_name").ToString()

	project_version := body.Get("project_version").ToString()

	project_info := body.Get("project_info")

	task_id,err := upload.PrepareUpload(user,project_name,project_version,project_info)

	if err != nil{
		return nil,err
	}

	return J.JSON{
		"success":true,
		"upload_id":task_id,
	},nil
	 
}

func _commitUpload(w *gbeta2.Res, r *http.Request, ctx *gbeta2.Ctx,next gbeta2.Next)(J.JSON,error){

	body :=  ctx.Get("body").(jsoniter.Any)

	task_id:= body.Get("upload_id").ToString()

	success,failed_msg,left,err:= upload.Commit(task_id)

	if nil != err{
		return nil,err
	}

	if true == success{
		return J.JSON{
			"success":success,
			"left":left,
		},nil
	}

	return J.JSON{
		"success":success,
		"message":failed_msg,
	},nil
	
}


func _upload(w *gbeta2.Res, r *http.Request, ctx *gbeta2.Ctx,next gbeta2.Next)(J.JSON,error){
	
	query :=  ctx.Get("query").(url.Values)

	task_id := query.Get("upload_id")
	
	relative_file_path := query.Get("file")

	seq := query.Get("seq")

	total := query.Get("total")

	sql:= "SELECT temp_dir FROM ms_task WHERE task_id = ?;"

	results,err := mysql_util.QueryAsJson(sql,task_id)

	if err != nil{
		return nil,err
	}

	temp_dir:= results.Get(0).Get("temp_dir").ToString()

	if "" == temp_dir{
		return  J.JSON{
			"success":false,
			"message":"Can't find  upload temp dir , please make sure that you have initialized the upload-task successfully!",
		},nil
	}


	err  = upload.UploadFile(task_id,temp_dir,relative_file_path,seq,total,r.Body)

	if nil != err{
		return nil,err
	}

	return  J.JSON{
		"success":true,
	},nil
}

func UploadRouter()*gbeta2.Router{

	router:= gbeta2.New()

	router.POST("/init",http_util.HandleError(_initUpload))

	router.Use("/",mw.Upload_Task_Should_Exist) // upload task should exist

	router.POST("/",http_util.HandleError(_upload))

	router.POST("/commit",http_util.HandleError(_commitUpload))

	return router
}
