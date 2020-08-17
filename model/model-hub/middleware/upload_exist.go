//created by yyrdl on 2018.12.19
package mw

import (
	"net/http"
	"ms_server/lib/gbeta2"
	"ms_server/lib/persist/mysql"
	"github.com/json-iterator/go"
	"net/url"
	"ms_server/util/log"
)


func Upload_Task_Should_Exist(w *gbeta2.Res, r *http.Request ,ctx *gbeta2.Ctx,next gbeta2.Next){
	 
	query :=  ctx.Get("query").(url.Values)
	
	upload_id := query.Get("upload_id")

	if "" == upload_id{
		if nil != ctx.Get("body"){
			body := ctx.Get("body").(jsoniter.Any)
			upload_id = body.Get("upload_id").ToString()
		}
	}

	if "" == upload_id{
		w.Write([]byte(`{"success":false,"message":"missing query param 'upload_id',path:`+r.URL.Path+`"}`))
		return 
	}

	sql := "SELECT project_name FROM ms_task WHERE task_id=?;"

	results,err:= mysql_util.QueryAsJson(sql,upload_id)

	if nil != err{
		logger := log.GetLogger()

		defer logger.Sync()
		
		logger.Error(err.Error())

		w.WriteHeader(500)
		w.Write([]byte(`{"success":false,"message":"Internal Error `+err.Error()+`"}`))

	}else{
		if results.Size() == 0{
			w.Write([]byte(`{"success":false,"message":"Upload task is not existed!"}`));
		}else{
			next()
		}
	}
}
