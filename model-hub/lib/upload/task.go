package upload

import (
	"sync"
	"time"
	"ms_server/lib/persist/mysql"
	"github.com/json-iterator/go"	
)

 

var task_map map[string] *Task

var task_map_mutex  *sync.Mutex


func _GetTimeoutTaskList()[]string{

	timeout_list := make([]string,0)

	now := time.Now().Unix()

	task_map_mutex.Lock()

	for task_id,task:= range task_map{
	  if nil != task && task.IsAlive() == false {
		 timeout_list = append(timeout_list,task_id)
	  }
	}

	task_map_mutex.Unlock()

    //从数据库里面翻出来的超时任务只能在本地taskMap里面不存在的才能认为是
		//死掉的上传任务，造成的原因是服务挂掉又重启
	db:= mysql_util.GetDB()
	sql:= "SELECT * FROM ms_task WHERE create_date < ?;"
 
	rows,err:= db.Query(sql,now - 2*60*60) //取超时2小时的
	 
	
	if err == nil{

		defer rows.Close()

		row_str,err:= mysql_util.RowsToJsonArray(rows)
		 
		if err == nil{
		 
		   var json = jsoniter.ConfigCompatibleWithStandardLibrary

		   array:= json.Get([]byte(row_str))

		   task_map_mutex.Lock()

		   for i:=0;i<array.Size();i++{

			   id:= array.Get(i,"task_id").ToString()

			   if tk,ok:= task_map[id];!ok || nil == tk{

				  timeout_list = append(timeout_list,id)
			   }
			}

		   task_map_mutex.Unlock()
		} 
	} 
    
	return timeout_list
}


func _RemoveTimeoutTask(){
	for {
		time.Sleep(6 * time.Minute)

		timeout_list := _GetTimeoutTaskList()
 
		for i:=0;i<len(timeout_list);i++{
		    CleanUploadTask(timeout_list[i])
		}
	}
}

 

func GetTask(task_id string)*Task{
	var t *Task
	task_map_mutex.Lock()
	t = task_map[task_id]
	task_map_mutex.Unlock()
	return t
}

func DeleteTask(task_id string){
	task_map_mutex.Lock()
	task_map[task_id] = nil
	delete(task_map,task_id)
	task_map_mutex.Unlock()
}

func AddTask(task_id string,task *Task){
	task_map_mutex.Lock()
	task_map[task_id] = task
	task_map_mutex.Unlock()
}

func IsTaskExist(task_id string)bool{
	 return GetTask(task_id) != nil
}

// 多线程的难度不一般啊，同步上传，还是异步合并，
 
func SubmitMergeFileTask(task_id,file_name,file_dir string,callback_channel chan error){
	 var task *Task = nil
	 var ok bool
	 task_map_mutex.Lock()

	 task,ok = task_map[task_id]

	 if  !ok || nil == task{
		 task = new(Task)
		 task.id = task_id
		 task.last_active_time = time.Now().Unix()
		 task.mutex = new (sync.Mutex)
		 task.w_count = 0
		 task_map[task_id] = task
	 } 

	 task_map_mutex.Unlock()

	 go func(){
		 task.mutex.Lock()
		 task.last_active_time = time.Now().Unix();
		 var err error = merge(file_name,file_dir)
		 task.mutex.Unlock()
		 if nil != callback_channel{
			callback_channel <- err
		 }
	 }()
}

func SubmitMergeProjectTask(task_id,file_dir string,project_info jsoniter.Any,callback_channel chan error){
	var task *Task = nil
	var ok bool
	task_map_mutex.Lock()

	task,ok = task_map[task_id]

	 if  !ok || nil == task{
		 task = new(Task)
		 task.id = task_id
		 task.last_active_time = time.Now().Unix()
		 task.mutex = new (sync.Mutex)
		 task.w_count = 0
		 task_map[task_id] = task
	 } 


	task_map_mutex.Unlock();

	go func(){

		task.mutex.Lock()
		task.last_active_time = time.Now().Unix();
		var err error = mergeAll(file_dir,project_info)
		task.mutex.Unlock()
		if nil != callback_channel{
			callback_channel <- err
		}

	}()
}

func init(){
	 
	task_map_mutex = new(sync.Mutex)

	task_map = make(map[string]*Task,20)

	go _RemoveTimeoutTask()
}