package router

import (
	"github.com/json-iterator/go"
	"github.com/julienschmidt/httprouter"
	"io/ioutil"
	"ms_server/lib/download"
	"ms_server/lib/persist/mysql"
	"net/http"
	"net/url"
)

func InitDownload( r *http.Request, ps httprouter.Params)([]byte,error)  {

	 body,err:= ioutil.ReadAll(r.Body)

	 if err != nil {
		 return nil,err
	 }

	 var json = jsoniter.ConfigCompatibleWithStandardLibrary

	 var user string = json.Get(body,"user").ToString()

	 var project_name string= json.Get(body,"project_name").ToString()
	 
	 var project_version string = json.Get(body,"project_version").ToString()

	 if user == "" || project_name == "" || project_version == ""{
		return []byte(`{"success":false,"message":"Lack of parameter"}`),nil
	 }

	 found, info, err := download.PrepareDownload(user,project_name,project_version)

	 if nil!= err{
		 return nil,err
	 }

	 if true == found{
		return []byte(`{"success":true,"project_info":`+info+`,"found":true}`),nil
	 }

	 return []byte(`{"success":true,"found":false}`),nil
}


func Download(w http.ResponseWriter, r *http.Request, ps httprouter.Params)bool{

	query,err:= url.ParseQuery(r.URL.RawQuery)
	if nil != err {
		w.WriteHeader(500)
		w.Write([]byte(`{"success":false,"message":"`+err.Error()+`"}`))
		return false
	}

	token:= r.Header.Get("token")

	file :=query.Get("file")
	seq:=query.Get("seq")
	size := query.Get("block_size")

	//服务端不存储状态，需要客户端指明
	version:=query.Get("version")
	user:= query.Get("user")
 
	project:=query.Get("project")

	if ""== token || "" == file || seq =="" || size == "" || version == "" || user == "" || project == ""{
		w.WriteHeader(400)
		w.Write([]byte(`{"success":false,"message":"Lack of parameter!"}`))
		return false
	}

	sql:= "SELECT username FROM ms_token WHERE username=? AND  token=?;"
	db := mysql_util.GetDB()
	
	rows,err:= db.Query(sql,user,token)

	if nil != err{
		w.WriteHeader(500)
		w.Write([]byte(`{"success":false,"message":"`+err.Error()+`"}`))
		return false
	}

	defer rows.Close()

	var json = jsoniter.ConfigCompatibleWithStandardLibrary

	rows_str,err:= mysql_util.RowsToJsonArray(rows)

	if nil != err{// 重复代码，须有优化设计
		w.WriteHeader(500)
		w.Write([]byte(`{"success":false,"message":"`+err.Error()+`"}`))
		return false
	}

	if json.Get([]byte(rows_str)).Size() == 0{
		w.WriteHeader(401)
		w.Write([]byte(`{"success":false,"message":"Access denied"}`))
		return false
	}

	//download given chunk
	//这里按照同一个文件的都是按照从文件开头每个size大小分块，若最后一个文件块不足size，会自行取文件剩余大小
	err = download.DownloadChunk(user,project,version,file, seq, size, w)
	
	if err != nil{
		w.WriteHeader(500)
		w.Write([]byte(`{"success":false,"message":"`+err.Error()+`"}`))

	}
     return false
}

 

func CommitDowload( r *http.Request, ps httprouter.Params)([]byte,error){
   return []byte(`{"success":true,"message":"ok"}`),nil
}

