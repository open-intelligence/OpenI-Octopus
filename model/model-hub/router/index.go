package router


import (
	"net/http"
	"ms_server/lib/gbeta2"
	"ms_server/util/json"
	"ms_server/util/http"
)

func index(w *gbeta2.Res, r *http.Request, ctx *gbeta2.Ctx,next gbeta2.Next)(J.JSON,error){
	 return J.JSON{
		 "msg":"Welcome!",
	 },nil
}

// export method
var Index gbeta2.Handler = http_util.HandleError(index)

 