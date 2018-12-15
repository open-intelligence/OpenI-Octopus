package upload


import (
	"os"
	"time"
	"errors"
	"io"
	"strings"
	"strconv"
	"ms_server/util/path"
	"github.com/json-iterator/go"
	"github.com/google/uuid"
	"ms_server/lib/persist/file"
	"ms_server/lib/persist/mysql"
	"ms_server/config"
)

/**
    准备上传任务
  * 在task 中插入一条任务
  * 准备临时文件夹
  * 在临时文件夹写入任务信息json
*/
func PrepareUpload(user string ,project_name string,project_version string,info jsoniter.Any)(string,error){
    
    project_dir := path_util.Join(config.Get(config.FileStoragePath),user,project_name,"v"+project_version)
	temp_dir := path_util.Join(config.Get(config.FileStoragePath),user,project_name,uuid.New().String())
	task_id:= uuid.New().String()
	create_date:= time.Now().Unix()

	db:= mysql_util.GetDB()
    //upsert 
	sql:= "INSERT INTO ms_projects(username,project_name,project_version,project_dir,project_info,create_date,update_date) "+
	"VALUES(?,?,?,?,?,?,?) ON DUPLICATE KEY UPDATE update_date = ?,project_info =?;"

	stmt,err:= db.Prepare(sql)

	if nil != err{
		return "",err
	}

	info_bytes:= []byte(info.ToString())
   
	_,err = stmt.Exec(user,project_name,project_version,project_dir,info_bytes,create_date,create_date,create_date,info_bytes)

	if nil != err{
		return "", err
	}

    //upsert
	sql ="INSERT INTO ms_task (task_id,username,project_name,project_version,project_dir,"+
	"temp_dir,completed,create_date) VALUES(?,?,?,?,?,?,?,?) ON DUPLICATE KEY UPDATE completed = ?;"


	stmt,err = db.Prepare(sql)

	if nil != err{
		return "",err
	}
	 
	_,err = stmt.Exec(task_id,user,project_name,project_version,project_dir,temp_dir,"no",create_date,"no")

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
 @param {String} relative_file_path 
 @param {String} seq  // block seq 
 @param {String} total // total block
 @param {io.Reader} reader // io.reader
 @return {error}
 @api public
*/
func UploadFile(task_id ,relative_file_path,seq ,total string,reader io.Reader)(error){

	db:= mysql_util.GetDB()

	sql:= "SELECT temp_dir FROM ms_task WHERE task_id = ?;"

	rows,err:= db.Query(sql,task_id)

	if err != nil{
		return err
	}

	defer rows.Close()

	rows_str,err:= mysql_util.RowsToJsonArray(rows)

	if nil != err{
		return err
	}

	var json = jsoniter.ConfigCompatibleWithStandardLibrary

	temp_dir:= json.Get([]byte(rows_str),0).Get("temp_dir").ToString()


	if "" == temp_dir{
		return errors.New("Init upload task is neccessary!")
	}

	file_path:= path_util.Join(temp_dir,relative_file_path);

	file_dir := file_path[0:strings.LastIndex(file_path,"/")]

	file_name := file_path[strings.LastIndex(file_path,"/")+1:]


	file_util.DirMustExist(file_dir)
	
	temp_file_name := GenTempFileName(file_name,seq,total)

	temp_file_path := path_util.Join(file_dir,temp_file_name)

	un_uploaded_file_path := path_util.Join(file_dir,uuid.New().String()+".mdzz")

	
	var fd *os.File

	//在为完全接收完数据前，不应该用正式的临时文件名，因为负责merge的goroutine无法分辨
	//该文件是否上传完毕
	//假设用户正在上传，突然服务死掉，那么该文件是无效的,
	//但已经存在了磁盘上，可以考虑在最后commit 的时候删除
	//can not use formal temp file name when it has not finished
    
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

		   if "" != result{
			  result = result+","+sub_result
		   }
		 }

	}else{

	   if file_util.Exist(path_util.Join(dir,any.Get("name").ToString())){
		   return "" ,nil
	   }

	   temp_list,err:= GetTempList(any.Get("name").ToString(),dir)
	   
	   if nil != err{
		   return "",err
	   }

	   file := path_util.Join(dir,any.Get("name").ToString())[len(root):]

	   if len(temp_list) == 0{
		   result = result+","+`{"file":"`+file+`","lack":[],"lackAll":true}`
	   }else{

		   lack:= ""

		   seq_list :=make([]uint64,0)
 
		   for i:= 0;i<len(temp_list);i++{
			 seq_list = append(seq_list,temp_list[i].Seq())
		   }
		 
		   if seq_list[len(temp_list)-1] != temp_list[0].Total(){
			  seq_list = append(seq_list,temp_list[0].Total()+1)
		   }
 
		   for i:=0;i<len(seq_list)-1;i++{
			  k:= seq_list[i]
			  p:= seq_list[i+1]
			  for j:= k-1 ; j<p;j++{
			    lack = lack+","+strconv.FormatUint(uint64(j),10)
			  }
		   }
 
		   lack = "["+lack[1:]+"]"
		
		   result = result+","+`{"file":"`+file+`","lack":`+lack+`}`
	   }
	}

	if ""!= result{
		result = result[1:]
	}

	return result,nil
}


func Commit(task_id string)(string,error){
	db := mysql_util.GetDB()
	sql:= "SELECT * FROM ms_task WHERE task_id=?;"
	rows,err:= db.Query(sql,task_id)
	if nil != err{
		return "",err
	}

	defer rows.Close()

	row_str,err:= mysql_util.RowsToJsonArray(rows)

	if err!=nil{
		return "",err
	}

	var json = jsoniter.ConfigCompatibleWithStandardLibrary
	record:= json.Get([]byte(row_str),0)

	username := record.Get("username").ToString()
	project_name := record.Get("project_name").ToString()
	project_version := record.Get("project_version").ToString()
	temp_dir := record.Get("temp_dir").ToString()

	if ""== username || project_name =="" || "" == project_version{
		return "",errors.New("Upload task is not exist: "+task_id)
	}
	
	sql = "SELECT * FROM ms_projects WHERE username=? AND project_name =? AND project_version = ?;"

	rows2,err := db.Query(sql,username,project_name,project_version)
	if nil != err{
		return "",err
	}

	defer rows2.Close()

	row_str,err = mysql_util.RowsToJsonArray(rows2)

	if err!=nil{
		return "",err
	}

	project_info:= json.Get([]byte(row_str),0).Get("project_info");
	project_dir:= json.Get([]byte(row_str),0).Get("project_dir").ToString()

	task:= GetTask(task_id)


	if nil == task{
		return "",errors.New("Missing Upload Task When Commit")
	}

	now:= time.Now().Unix()

	for {
		if 0 == task.GetWriteCount() || time.Now().Unix()-now > 30{
			break;
		}
		time.Sleep(1*time.Second)
	}
 
	check_result,err := checkUpload(project_info,temp_dir,temp_dir,0)

	if nil != err{
		
		return "", err
	}

	if "" == check_result{
		  //检查并删除本地 后缀为`.mdzz``的临时上传文件，如果存在的话应该是由于服务挂掉导致

		  channel:= make(chan error,1)

		  SubmitMergeProjectTask(task_id,temp_dir,project_info,channel)
		  
		  err = <- channel

		  if nil != err{
			  return "",err
		  }
		  
		  CleanUnuploadedFile(temp_dir)
		  // 删除原有的版本
		  err = os.RemoveAll(project_dir)
		  if nil != err{
			return "",err
		  }
		  //将新上传的目录重命名为指定版本
		  err = os.Rename(temp_dir,project_dir)
		  if nil != err{
			  return "",err
		  }
		  //清理上传任务
		  CleanUploadTask(task_id)
	}


	check_result = "["+check_result+"]" //array string

	return check_result,nil
}