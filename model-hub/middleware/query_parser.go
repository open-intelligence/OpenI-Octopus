//created by yyrdl on 2018.12.18
package mw

import (
	"net/http"
	"ms_server/lib/gbeta2"
	"net/url"
	"ms_server/util/log"
)


func Query_Parser(w *gbeta2.Res, r *http.Request ,ctx *gbeta2.Ctx,next gbeta2.Next){
	query,err:= url.ParseQuery(r.URL.RawQuery)
	if nil != err{
		
		logger := log.GetLogger()

		defer logger.Sync()
		
		logger.Error(err.Error())
		w.WriteHeader(500)
		w.Write([]byte(`{"success":false,"msg":"Failed to parse query:`+r.URL.Path+`"}`))
	}else{
		ctx.Set("query",query)
		next()
	}
}
