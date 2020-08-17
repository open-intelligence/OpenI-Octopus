package http_util

import (
   "net/http"
   "ms_server/lib/gbeta2"
   "github.com/json-iterator/go"
   "ms_server/util/json"
   "ms_server/util/log"
)

var json = jsoniter.ConfigCompatibleWithStandardLibrary

type _Http_Handle func(w *gbeta2.Res, r *http.Request, ctx *gbeta2.Ctx,next gbeta2.Next)(J.JSON,error)

func HandleError(handle _Http_Handle) gbeta2.Handler{
	return func(w *gbeta2.Res, r *http.Request, ctx *gbeta2.Ctx,next gbeta2.Next){
		logger:= log.GetLogger()
		defer logger.Sync()
		response,err:= handle(w,r,ctx,next)
		if nil != err{
			logger.Error(err.Error())
			w.WriteHeader(500)
			w.Write([]byte(`{"success":false,"message":"Internal Error `+err.Error()+`"}`))
		}else if nil != response{
			bytes,err:= json.Marshal(response)
			if nil != err{
				logger.Error(err.Error())
				w.WriteHeader(500)
			    w.Write([]byte(`{"success":false,"message":"Internal Error `+err.Error()+`"}`))
			}else{
				w.Write(bytes)
			}
		}
	}
}