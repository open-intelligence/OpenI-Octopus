package router

import   (
	"github.com/julienschmidt/httprouter"
	"net/http"
	"net/url"
	"fmt"
	"io/ioutil"
	"github.com/json-iterator/go"
	"ms_server/lib/upload"
)

func InitUpload(r *http.Request, ps httprouter.Params) ([]byte,error) {
	 
	body,err:= ioutil.ReadAll(r.Body)

	if err != nil {
		return nil,err
	}

	var json = jsoniter.ConfigCompatibleWithStandardLibrary

	var user string = json.Get(body,"user").ToString()

	if err != nil{
	   return nil,err
	}

	var project_name string= json.Get(body,"project_name").ToString()
	var project_version string = json.Get(body,"project_version").ToString()
	var project_info jsoniter.Any = json.Get(body,"project_info")
	
	task_id,err:= upload.PrepareUpload(user,project_name,project_version,project_info)

	if err != nil{
		return nil,err
	}

	return []byte(`{"success":true,"upload_id":"`+task_id+`"}`),nil
}




func CommitUpload(r *http.Request, ps httprouter.Params)([]byte,error){
	body,err:= ioutil.ReadAll(r.Body)

	if err != nil {
		return nil,err
	}

	var json = jsoniter.ConfigCompatibleWithStandardLibrary

	task_id:= json.Get([]byte(body),"upload_id").ToString()

	left,err:= upload.Commit(task_id)

	if nil != err{
		return nil,err
	}

	return []byte(`{"success":true,"left":`+left+`}`),nil

}


func Upload(w http.ResponseWriter, r *http.Request, ps httprouter.Params)bool{
	
	query,err:= url.ParseQuery(r.URL.RawQuery)

	if nil != err{
		w.WriteHeader(500)
		w.Write([]byte(fmt.Sprintf(`{"success":false,"message":"%v"}`,err)))
		return false
	}

	task_id:= query.Get("upload_id")
	
	relative_file_path := query.Get("file")
	seq:= query.Get("seq")

	total:= query.Get("total")

	err = upload.UploadFile(task_id,relative_file_path,seq,total,r.Body)

	if nil != err{
		 w.WriteHeader(500)
		 w.Write([]byte(fmt.Sprintf(`{"success":false,"message":"%v"}`,err)))
		 return false
	}

	w.Write([]byte(`{"success":true}`))

	return false

}
