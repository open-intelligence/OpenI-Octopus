package router

import   (
	"github.com/julienschmidt/httprouter"
	"net/http"
	"net/url"
	"io/ioutil"
	"errors"
	"ms_server/lib/project"
	"github.com/json-iterator/go"
)


func Versions(r *http.Request,ps httprouter.Params)([]byte,error){
	query,err:= url.ParseQuery(r.URL.RawQuery)
	if nil != err{
		return nil,err
	}
	
	user:= query.Get("user")
	project_name:=query.Get("project_name")

	if "" == user {
		return  []byte(`{"success":false,"message":"Query parameter 'user' is required!"}`),nil
	}

	if "" == project_name {
		return  []byte(`{"success":false,"message":"Query parameter 'project_name' is required!"}`),nil
	}

	versions,err:= project.GetVersions(user,project_name)

	if nil != err{
		return nil,err
	}

	return []byte(`{"success":true,"versions":`+versions+`}`),nil
}


func Info(r *http.Request,ps httprouter.Params)([]byte,error){
	query,err:= url.ParseQuery(r.URL.RawQuery)

	if nil != err{
		return nil,err
	}

	user:= query.Get("user")
	project_name:= query.Get("project_name")
	version:= query.Get("project_version")

	if "" == user || project_name == "" || "" == version{
		return nil, errors.New("Missing parameter,please check your input (user,project_name,project_version)")
	}

	tar_version,info,err :=  project.Info(user,project_name,version);

	if nil != err{
		return nil,err
	}

	return []byte(`{"success":true,"version":"`+tar_version+`","info":`+info+`}`),nil
 }


 func Convert(r *http.Request,ps httprouter.Params)([]byte,error){

	body,err:= ioutil.ReadAll(r.Body)

	if err != nil {
		return nil,err
	}

	var json = jsoniter.ConfigCompatibleWithStandardLibrary

	 params := json.Get(body)

	success,failed_message,err:= project.Convert(params.Get("project"),params.Get("params"))

	if nil != err{
		return nil ,err
	}

	if true == success{
		return []byte(`{"success":true,"message":"Convert successfully"}`),nil
	}else{
		return []byte(`{"success":false,"message":"`+failed_message+`"}`),nil
	}

 }