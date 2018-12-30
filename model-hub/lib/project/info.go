package project 

import (
	"ms_server/lib/persist/mysql"
	"github.com/json-iterator/go"
	"errors"
)

func  Info(user,project,version string) (string,jsoniter.Any,error) {

	sql:= "SELECT * FROM ms_projects WHERE username = ? AND project_name = ?;"

	results,err := mysql_util.QueryAsJson(sql,user,project)

	
	if nil != err{
		return "",nil,err
	}

	if results.Size() == 0{
		return "",nil,errors.New(project +"  Not Found!")
	}

	var tar_version string = version
	

	if "" == version{
		var create_date int64 = 0
		for i:=0;i<results.Size();i++{
			date:= results.Get(i).Get("create_date").ToInt64()
			if date > create_date{
				create_date = date
				tar_version = results.Get(i).Get("project_version").ToString()
			}
		}
	} 

	var info  jsoniter.Any = nil

	for i:= 0;i<results.Size();i++{
		if tar_version == results.Get(i).Get("project_version").ToString(){
			info = results.Get(i).Get("project_info")
			break
		}
	}

	if nil == info{
		return "",nil,errors.New(project +"  Not Found!")
	}
	
	return tar_version,info,nil

}