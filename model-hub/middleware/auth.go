package middleware 

import (
	"github.com/julienschmidt/httprouter"
	"net/http"
	"ms_server/lib/persist/mysql"
	"github.com/json-iterator/go"
	"time"
)

func TokenRequired(w http.ResponseWriter, r *http.Request, ps httprouter.Params)(bool){
	token:= r.Header.Get("token")
	if "" == token {
		w.WriteHeader(403)
		w.Write([]byte(`{"success":false,"message":"Access denied!"}`))
		return false
	}

	sql:= "SELECT * FROM ms_token WHERE token = ?;"
	db:= mysql_util.GetDB()

	rows,err:= db.Query(sql,token)

	if nil != err{
	  w.WriteHeader(500)
	  w.Write([]byte(`{"success":false,"message":"Internal Error`+err.Error()+`"}`))
	  return false
	}

	defer rows.Close()

	row_str,err:= mysql_util.RowsToJsonArray(rows)

	if nil != err{
	  w.WriteHeader(500)
	  w.Write([]byte(`{"success":false,"message":"Internal Error`+err.Error()+`"}`))
	  return false
	}

	var json = jsoniter.ConfigCompatibleWithStandardLibrary

	any:= json.Get([]byte(row_str))

	if 0 == any.Size(){
	  w.WriteHeader(403)
	  w.Write([]byte(`{"success":false,"message":"Access denied! Wrong token!"}`))
	  return false
	}

	now:=time.Now().Unix()

	create_date:= any.Get(0,"create_date").ToInt64()

	expiration:= any.Get(0,"expiration").ToInt64()

	if now - create_date >= expiration{
	  w.WriteHeader(403)
	  w.Write([]byte(`{"success":false,"message":"Token expired","token_expired":true}`))
	  sql:= "DELETE FROM ms_token WHERE token = ?;"
	  rows2,_:= db.Query(sql,token)

	  rows2.Close()

	  return false
	}

	
	return true
}
 
	 
 