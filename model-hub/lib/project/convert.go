package project

import (
	"github.com/json-iterator/go"
	"net/http"
	"ms_server/config"
	"ms_server/lib/persist/file"
	"ms_server/lib/persist/mysql"
	"ms_server/util/path"	 
	"io/ioutil"
	"strings"
	"time"
)

func prepareParam(output,root_path string,params jsoniter.Any)string{

	src:= params.Get("source_framework").ToString()
	dst:= params.Get("destination_framework").ToString()
	input_shape:= params.Get("input_shape").ToString()
	json_file_path:=params.Get("json_file_path").ToString()
	params_file_path:= params.Get("params_file_path").ToString()
	model_file_path:= params.Get("model_file_path").ToString()
	proto_file_path:= params.Get("proto_file_path").ToString()
	weights_file_path:= params.Get("weights_file_path").ToString()

	var param_json  string = `{`
	param_json = param_json +`"source_framework":"`+src+`","destination_framework":"`+dst+`","input_shape":"`+input_shape+`",`
	param_json = param_json+`"output_path":"`+output+`"`
	
	if "" != json_file_path{
		param_json = param_json+`,"json_file_path":"`+path_util.Join(root_path,json_file_path)+`"`
	}

	if ""!= params_file_path{
		param_json = param_json+`,"params_file_path":"`+path_util.Join(root_path,params_file_path)+`"`
	}

	if "" != model_file_path{
		param_json = param_json+`,"model_file_path":"`+path_util.Join(root_path,model_file_path)+`"`
	}
	if ""!= proto_file_path{
		param_json = param_json +`,"proto_file_path":"`+path_util.Join(root_path,proto_file_path)+`"`
	}

	if ""!= weights_file_path{
		param_json = param_json +`,"weights_file_path":"`+path_util.Join(root_path,weights_file_path)+`"`
	}

	param_json = param_json+`}`

	return param_json
}

func resetProjectInfo(user,project,version string)error{

	dir:= path_util.Join(config.Get(config.FileStoragePath),user,project,"v"+version);

	info,err:= file_util.ReadDirIn(dir,"dir",project)

	if err != nil{
		return err
	}

	sql:= "UPDATE ms_projects SET project_info =?,update_date=? WHERE username=? AND project_name =? AND project_version = ?;"
	
	db:= mysql_util.GetDB()

	rows,err:= db.Query(sql,[]byte(info),time.Now().Unix(),user,project,version)
	

	if nil != err{
		return err
	}

	rows.Close()

	return nil
}

func Convert(info  jsoniter.Any,params jsoniter.Any)(bool,string,error)  {

	 user:= info.Get("user").ToString()
	 project_name:= info.Get("project_name").ToString()
	 project_version := info.Get("project_version").ToString()
	
	 output_path:= path_util.Join(config.Get(config.FileStoragePath),user,project_name,"v"+project_version,"convert_output")

	 root_path:= path_util.Join(config.Get(config.FileStoragePath),user,project_name,"v"+project_version)

	 param_json := prepareParam(output_path,root_path,params)


	file_util.DirMustExist(output_path)


    req,err:= http.NewRequest("POST",config.Get(config.Exchange)+"/api/v1/exchange",strings.NewReader(param_json))

	if nil != err{
		 return false,"",err
	}

	req.Header.Add("Content-Type","application/json")

	client:= &http.Client{}

	resp,err:= client.Do(req)

	if nil != err{
		return false,"",err
	}

	defer resp.Body.Close()
	
	body, err := ioutil.ReadAll(resp.Body)
	
	if err != nil {
	    return false,"",err
	}

	var json = jsoniter.ConfigCompatibleWithStandardLibrary

	res:= json.Get([]byte(body))

	error_text:= res.Get("error").ToString()

	if ""!= error_text{
		return false,error_text+res.Get("message").ToString(),nil
	}

	err = resetProjectInfo(user,project_name,project_version)

	if nil != err{
		return  false,"",err
	}

	return true,"",nil

}