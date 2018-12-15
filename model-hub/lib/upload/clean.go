package upload

import (
	"os"
	"fmt"
	"ms_server/util/path"
	"ms_server/lib/persist/file"
	"ms_server/lib/persist/mysql"
	"github.com/json-iterator/go"
)

// 删除未上传完全的文件块，文件后缀是 `.mdzz`
func CleanUnuploadedFile(dir string){
	file_list,err:= file_util.ReadDir(dir)
	if err!= nil{
		return 
	}
	for i:=0;i<len(file_list);i++{
		name:= file_list[i].Name()
		if file_list[i].IsDir(){
			CleanUnuploadedFile(path_util.Join(dir,name))
		}else{
		   
			if len(name) > 5 && ".mdzz" == name[len(name)-5:]{
				os.Remove(path_util.Join(dir,name))
			}
		}
	}
}

// 删除上传任务，清空mysql 里面的相关数据和本地已经上传了的数据
func CleanUploadTask(task_id string){
   //cancel merge goroutine

   task:= GetTask(task_id)

   if nil != task{
	   if 0 != task.GetWriteCount() || task.IsAlive(){
		   return 
	   }
   }
    
   DeleteTask(task_id)
   
   db:= mysql_util.GetDB()

   sql:= "SELECT temp_dir FROM ms_task WHERE task_id=?;"

   rows,err:= db.Query(sql,task_id)

   if nil != err{
	   fmt.Println("[CLEAN DEAD UPLOAD TASK ERROR] - ",err.Error())
	   return 
   }

   row_str,err:= mysql_util.RowsToJsonArray(rows)

   rows.Close()

   if nil != err{
	   fmt.Println("[CLEAN DEAD UPLOAD TASK ERROR] - ",err.Error())
	   return 
   }

   var json = jsoniter.ConfigCompatibleWithStandardLibrary

   if json.Get([]byte(row_str)).Size() == 0{
	   return
   }

   temp_dir:= json.Get([]byte(row_str),0).Get("temp_dir").ToString()

   if "" == temp_dir{
	   return 
   }


   if file_util.Exist(temp_dir){
	   // 删除本地临时的上传数据
	   err = os.RemoveAll(temp_dir)

	   if err != nil{
		   fmt.Println("[CLEAN DEAD UPLOAD TASK ERROR] - ",err.Error())
		   return 
	   }
   }
   

   // 删除mysql 里面的数据
   sql = "DELETE FROM ms_task WHERE task_id = ?";

   stmt,err:= db.Prepare(sql)

   if err != nil{
	   fmt.Println("[CLEAN DEAD UPLOAD TASK ERROR] - ",err.Error())
	   return 
   }

   _,err = stmt.Exec(task_id)

   if err != nil{
	   fmt.Println("[CLEAN DEAD UPLOAD TASK ERROR] - ",err.Error())
	   return 
   }

}
