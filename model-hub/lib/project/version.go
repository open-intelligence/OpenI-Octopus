package project

import (
	"ms_server/lib/persist/mysql"
)


func GetVersions(user,project string)(string,error)  {
	 db:= mysql_util.GetDB()	
	 sql:= "SELECT project_version,create_date FROM ms_projects WHERE username = ? AND project_name = ?;"
	 rows,err:= db.Query(sql,user,project)
	 if nil != err{
		 return "",err
	 }
	 defer rows.Close()

	 rows_str,err:= mysql_util.RowsToJsonArray(rows)


	 if nil!= err{
		 return "",err
	 }

	 return rows_str,nil

}