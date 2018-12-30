//created by yyrdl on 2018.12.18
package mw

import (
	"net/http"
	"time"
	"ms_server/lib/gbeta2"
	"ms_server/lib/persist/mysql"
	"ms_server/util/http"
	"ms_server/util/json"
)

var TokenRequired gbeta2.Handler = http_util.HandleError(func(w *gbeta2.Res, r *http.Request, ctx * gbeta2.Ctx,next gbeta2.Next)(J.JSON,error){
	
		token:= r.Header.Get("token")

		if "" == token {
			w.WriteHeader(403)
			w.Write([]byte(`{"success":false,"message":"Access denied!"}`))
			return nil,nil
		}

		sql:= "SELECT * FROM ms_token WHERE token = ?;"

		results,err := mysql_util.QueryAsJson(sql,token)

	 
		if nil != err{
		  return nil,err
		}


		if 0 == results.Size(){
	 		 w.WriteHeader(403)
	 	     w.Write([]byte(`{"success":false,"message":"Access denied! Wrong token!"}`))
	  	     return nil,nil
		}

		now:=time.Now().Unix()

		create_date:= results.Get(0,"create_date").ToInt64()

		expiration:= results.Get(0,"expiration").ToInt64()

		if now - create_date >= expiration{

	 		 w.WriteHeader(403)

	 		 w.Write([]byte(`{"success":false,"message":"Token expired","token_expired":true}`))

			 sql:= "DELETE FROM ms_token WHERE token = ?;"
			 
			 db:= mysql_util.GetDB()

	  	     rows2,_:= db.Query(sql,token)

	  	     rows2.Close()

	         return nil,nil
		}

		next()

		return nil,nil
})

