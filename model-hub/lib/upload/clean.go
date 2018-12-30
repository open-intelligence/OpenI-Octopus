package upload

import (
	"os"
	"ms_server/util/path"
	"ms_server/lib/persist/file"
	"ms_server/lib/persist/mysql"
	"ms_server/util/log"
)

func CleanUnuploadedFile(dir string){
	logger := log.GetLogger()
	
	defer logger.Sync()

	file_list,err:= file_util.ReadDir(dir)

	if err!= nil{
		logger.Error(err.Error())
		return 
	}

	for i:=0;i<len(file_list);i++{

		name:= file_list[i].Name()

		if file_list[i].IsDir(){
			CleanUnuploadedFile(path_util.Join(dir,name))
			continue
		} 
		   
		if len(name) > 5 && ".mdzz" == name[len(name)-5:]{
			err:= os.Remove(path_util.Join(dir,name))
			if nil != err{
				logger.Error(err.Error())
			}
		}
		 
	}
}

 
func CleanUploadTask(task_id string)bool{
   //cancel merge goroutine

   task:= GetTask(task_id)

   if nil != task{
	   if 0 != task.GetWriteCount() || task.IsAlive(){
		   return false
	   }
   }

   logger:=log.GetLogger()

   defer logger.Sync()

   sql:= "SELECT temp_dir FROM ms_task WHERE task_id=?;"

   results,err := mysql_util.QueryAsJson(sql,task_id) 
    
   if nil != err{
	   logger.Error(err.Error())
	   return false
   }

   if results.Size() == 0{
	   return false
   }

   temp_dir:= results.Get(0).Get("temp_dir").ToString()

   if "" == temp_dir{
	   return  false
   }

   if file_util.Exist(temp_dir){
	  
	   err = os.RemoveAll(temp_dir)

	   if err != nil{
		   logger.Error(err.Error())
		   return false
	   }
   }
  

   err = mysql_util.Query("DELETE FROM ms_task WHERE task_id = ?",task_id)

   if err != nil{
	  logger.Error(err.Error())
	  return false
   }

   DeleteTask(task_id)

   return true

}


func CleanTempFile(file_name,file_dir string)(error){

	logger := log.GetLogger()

	defer logger.Sync()
	
	temp_list,err:= GetTempList(file_name,file_dir)

	if nil != err{
		logger.Error(err.Error())
		return err
	}

	for i:=0;i<len(temp_list);i++{
		file_path := path_util.Join(file_dir,temp_list[i].ToString())
		if file_util.Exist(file_path){
			err = os.Remove(file_path)
			if nil != err{
				logger.Error(err.Error())
				return err
			}
		}
	}

	return nil

}