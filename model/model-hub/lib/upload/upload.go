package upload


import (
	"os"
	"time"
	"io"
	"strings"
	"strconv"
	"ms_server/util/path"
	"ms_server/util/log"
	"github.com/json-iterator/go"
	"github.com/google/uuid"
	"ms_server/lib/persist/file"
	"ms_server/lib/persist/mysql"
	"ms_server/config"
)

/**

*/
func PrepareUpload(user string ,project_name string,project_version string,info jsoniter.Any)(string,error){

	logger := log.GetLogger()

	defer logger.Sync()
    
    project_dir := path_util.Join(config.Get(config.FileStoragePath),user,project_name,"v"+project_version)
	temp_dir := path_util.Join(config.Get(config.FileStoragePath),user,project_name,uuid.New().String())
	task_id:= uuid.New().String()
	create_date:= time.Now().Unix()

	info_bytes:= []byte(info.ToString())

   //upsert 
	sql:= "INSERT INTO ms_projects(username,project_name,project_version,project_dir,project_info,create_date,update_date) "+
	"VALUES(?,?,?,?,?,?,?) ON DUPLICATE KEY UPDATE update_date = ?,project_info =?;"


	err := mysql_util.Query(sql,user,project_name,project_version,project_dir,info_bytes,create_date,create_date,create_date,info_bytes)

	if nil != err{
		return "", err
	}

    //upsert
	sql ="INSERT INTO ms_task (task_id,username,project_name,project_version,project_dir,"+
	"temp_dir,completed,create_date) VALUES(?,?,?,?,?,?,?,?) ON DUPLICATE KEY UPDATE completed = ?;"

    err = mysql_util.Query(sql,task_id,user,project_name,project_version,project_dir,temp_dir,"no",create_date,"no")

	if nil != err{
		return "",err
	}

	//create temp dir
	file_util.DirMustExist(path_util.Join(config.Get(config.FileStoragePath),user,project_name))
	file_util.DirMustExist(temp_dir)

	 
    return task_id,nil
}

/**
 @param {string} task_id 
 @param {String} temp_dir
 @param {String} relative_file_path 
 @param {String} seq  // block seq 
 @param {String} total // total block
 @param {io.Reader} reader // io.reader
 @return {error}
 @api public
*/
func UploadFile(task_id ,temp_dir,relative_file_path,seq ,total string,reader io.Reader)(error){

	file_path := path_util.Join(temp_dir,relative_file_path);

	file_dir := file_path[0:strings.LastIndex(file_path,"/")]

	file_name := file_path[strings.LastIndex(file_path,"/")+1:]


	file_util.DirMustExist(file_dir)
	
	temp_file_name := GenTempFileName(file_name,seq,total)

	temp_file_path := path_util.Join(file_dir,temp_file_name)

	un_uploaded_file_path := path_util.Join(file_dir,uuid.New().String()+".mdzz")
	
	var fd *os.File

	var err error
    
	fd,err = file_util.CreateFile(un_uploaded_file_path)
		
	if nil != err{
      return err
	}	

	task:= GetTask(task_id)

	if nil != task{
       
		defer task.UnlockWrite()

		task.LockWrite()
	}
 
	err = file_util.Pipe(reader,fd)

	if err != nil {
		
		os.Remove(un_uploaded_file_path)

		return err
	}
	
	err = fd.Close()

	if err!= nil{
		 
		return err
	}
    
	err = os.Rename(un_uploaded_file_path,temp_file_path)

	if nil != err{
	 
		return err
	}

	SubmitMergeFileTask(task_id,file_name,file_dir,nil)

	return nil
}

func checkUpload(any jsoniter.Any, dir,root string,deep int)(string,error){

	var _result = func (str string) string{
	   if "" != str{
		   return str[1:]
	   }
	   return str
   }

   var result string = ""

   f_type:=any.Get("type").ToString()

   if "" == f_type{
	   return "",nil
   }

   if "dir" == f_type{

		child:= any.Get("child")

		for i:=0;i<child.Size();i++{

		  var sub_dir string

		  if 0 == deep{
			  sub_dir = dir;
		  }else{
			  sub_dir = path_util.Join(dir,any.Get("name").ToString())
		  }

		  sub_result,err :=  checkUpload(child.Get(i),sub_dir,root,deep+1)

		  if err!= nil{
			  return "",err
		  }

		  if "" != sub_result{
			 result = result+","+sub_result
		  }
		}

		return _result(result),nil

   } 


   if file_util.Exist(path_util.Join(dir,any.Get("name").ToString())){
	   return "" ,nil
   }

   temp_list,err:= GetTempList(any.Get("name").ToString(),dir)
   
   if nil != err{
	   return "",err
   }

   file := path_util.Join(dir,any.Get("name").ToString())[len(root):]

   if file[0:1] == "/" {
	   file = "."+file
   }

   if 0 == len(temp_list){
	   return _result(result+","+`{"file":"`+file+`","lack":[],"lackAll":true}`),nil
   }
	 

   var lack string = ""

   seq_list :=make([]uint64,0)

   seq_list = append(seq_list,0)
   
   for i:= 0;i<len(temp_list);i++{

	   if temp_list[i].Merged(){
		   
		  seq_list = seq_list[0:0]
		   
	   }

	   seq_list = append(seq_list,temp_list[i].Seq())
   }

   if seq_list[len(seq_list)-1] != temp_list[0].Total(){
	  seq_list = append(seq_list,temp_list[0].Total()+1)
   }

   for i:=0;i<len(seq_list)-1;i++{

	  k:= seq_list[i]

	  p:= seq_list[i+1]

	  for j:= k+1 ; j<p ;j++{

		lack = lack+","+strconv.FormatUint(uint64(j),10)

	  }

   }

   if "" != lack{
	   lack = lack[1:]
   }
   
   return _result(result+","+`{"file":"`+file+`","lack":[`+lack+`]}`),nil
	
}



func Commit(task_id string)(bool,string,jsoniter.Any,error){

	logger := log.GetLogger()

	defer logger.Sync()
	 
	sql:= "SELECT * FROM ms_task WHERE task_id=?;"

	results,err:= mysql_util.QueryAsJson(sql,task_id)
	 
	if nil != err{
		return false,"",nil,err
	}
	 
	record:= results.Get(0)

	username := record.Get("username").ToString()
	project_name := record.Get("project_name").ToString()
	project_version := record.Get("project_version").ToString()
	temp_dir := record.Get("temp_dir").ToString()

	if ""== username || project_name =="" || "" == project_version{
		return false,"Upload task is not exist: "+task_id,nil,nil
	 
	}
	
	sql = "SELECT * FROM ms_projects WHERE username=? AND project_name =? AND project_version = ?;"
 

	results,err = mysql_util.QueryAsJson(sql,username,project_name,project_version)
	
	if nil != err{
		return false,"",nil,err
	}

	project_info:= results.Get(0).Get("project_info");
	
	project_dir:= results.Get(0).Get("project_dir").ToString()

	task:= GetTask(task_id)

	if nil == task{
		return false,"Missing Upload Task When Commit",nil,nil
	}

	now:= time.Now().Unix()

	for {
	   //logger.Info("Write count",zap.Int("count",task.GetWriteCount()))
		if 0 == task.GetWriteCount() || time.Now().Unix()-now > 30{
			break;
		}
		time.Sleep(1*time.Second)
	}
	
 
	check_result,err := checkUpload(project_info,temp_dir,temp_dir,0)

	if nil != err{
		
		return false,"",nil, err
	}

	if "" == check_result{
		   

		  channel:= make(chan error,1)

		  SubmitMergeProjectTask(task_id,temp_dir,project_info,channel)
		  
		  err = <- channel

		  if nil != err{
			  return false,"",nil,err
		  }

		  // remove temp file

		  CleanUnuploadedFile(temp_dir)

		  // remove the old version

		  err = os.RemoveAll(project_dir)

		  if nil != err{
			return false,"",nil,err
		  }
		  
		  err = os.Rename(temp_dir,project_dir)
		  if nil != err{
			  logger.Error(err.Error())
			  return false,"",nil,err
		  }
		  
		  //清理上传任务
		  CleanUploadTask(task_id)
	}


	check_result = "["+check_result+"]" //array string

	var json = jsoniter.ConfigCompatibleWithStandardLibrary

	return true,"",json.Get([]byte(check_result)),nil
}