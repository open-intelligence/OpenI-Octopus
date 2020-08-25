//created by yyrdl on 2018.12.18
package mw

import (
	"net/http"
	"ms_server/lib/gbeta2"
	"ms_server/util/log"
	"github.com/json-iterator/go"
	"io/ioutil"
)


func JSON_Parser(w *gbeta2.Res, r *http.Request ,ctx *gbeta2.Ctx,next gbeta2.Next){

	content_type:= r.Header.Get("Content-Type")
	
	if "application/json" != content_type{
		next()
		return 
	}
	
	body,err:= ioutil.ReadAll(r.Body)
	
	if nil != err{
	
		logger := log.GetLogger()

	    defer logger.Sync()
		logger.Error(err.Error())

		w.WriteHeader(500)
		w.Write([]byte(`{"success":false,"msg":"Failed to read request body for path :`+r.URL.Path+`"}`))
	}else{
	    var json = jsoniter.ConfigCompatibleWithStandardLibrary
        ctx.Set("body",json.Get([]byte(body)))
		next()
	}
}
