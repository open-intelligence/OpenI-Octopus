package project 

import (
	"ms_server/lib/persist/mysql"
	"github.com/json-iterator/go"
	"errors"
)


func  Info(user,project,version string) (string,string,error) {
	sql:= "SELECT * FROM ms_projects WHERE username = ? AND project_name = ?;"
	db:= mysql_util.GetDB()

	rows,err:= db.Query(sql,user,project)
	
	if nil != err{
		return "","",err
	}

	defer rows.Close()

	row_str,err:= mysql_util.RowsToJsonArray(rows)

	if nil != err{
		return "","",err
	}
	var json = jsoniter.ConfigCompatibleWithStandardLibrary

	any:= json.Get([]byte(row_str))

	if any.Size() == 0{
		return "","",errors.New("没有找到"+project)
	}

	var tar_version string = version
	

	if "" == version{
		var create_date int64 = 0
		for i:=0;i<any.Size();i++{
			date:= any.Get(i).Get("create_date").ToInt64()
			if date > create_date{
				create_date = date
				tar_version = any.Get(i).Get("project_version").ToString()
			}
		}
	} 

	var info string = ""

	for i:= 0;i<any.Size();i++{
		if tar_version == any.Get(i).Get("project_version").ToString(){
			info = any.Get(i).Get("project_info").ToString()
			break
		}
	}

	if "" == info{
		return "","",errors.New("没有找到"+project)
	}
	
	return tar_version,info,nil

}