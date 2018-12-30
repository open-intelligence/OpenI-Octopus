package project

import (
	"ms_server/lib/persist/mysql"
	"github.com/json-iterator/go"
)


func GetVersions(user,project string)(jsoniter.Any,error)  {
	 
	 sql:= "SELECT project_version,create_date FROM ms_projects WHERE username = ? AND project_name = ?;"
	 
	 results ,err := mysql_util.QueryAsJson(sql,user,project)
	 
	 if nil != err{
		 return nil,err
	 }

	 return results,nil

}