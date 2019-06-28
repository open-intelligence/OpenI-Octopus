package image

import (
	"time"
	"sync"
	"strings"
	"agent/utils/docker"
	"agent/constants"
	"agent/types"
	shield_service "agent/service/shield"
)

var Login_Record *types.ThreadSafeMap = types.NewThreadSafeMap()
var Login_Lock *sync.Mutex = new(sync.Mutex)

func check_login(user,pwd,addr string,force bool)(bool ,string){

	if user == "" || pwd == ""{
		return true,"no account provided"
	}

	Login_Lock.Lock()

	defer Login_Lock.Unlock()
	
	key:= addr

	if "" == key{
		key = "docker_official"
	}

	key = key+"-"+user

	record,exist := Login_Record.Get(key)

	if true == exist && true != force{

		old_pwd ,_ := record.(string)

		if old_pwd == pwd {
			return true,"already logined"
		}
	}

	success,msg := docker.Login(user,pwd,addr)
	
	if false == success{
		return false,msg
	}

	Login_Record.Set(key,pwd)
	 
	return true,"success"
}

func docker_push(image,hub_user,hub_pwd,hub_addr string)(bool,string){

	success,msg :=  docker.Push(image)

	if true == success {
		return success,msg
	}

	if strings.Contains(msg,"denied") && strings.Contains(msg,"resource"){

		success,msg := check_login(hub_user,hub_pwd,hub_addr,true)

		if false == success{

			return success,msg
		}

		success,msg =  docker.Push(image)
	}

	return success,msg
}

func SyncCommit(container,image,author,note ,hub_user,hub_pwd,hub_addr string) (bool,string) {

	success,msg := check_login(hub_user,hub_pwd,hub_addr,false)

	if false == success{
		return success,msg
	}
	
	success,msg = docker.Commit(container,image,author,note)

	if false == success{
		return false,msg
	}

	return docker_push(image,hub_user,hub_pwd,hub_addr)

}


func AsyncCommit(transaction,container,image,author,note,hub_user,hub_pwd,hub_addr string){

	go func(){

		success,msg := check_login(hub_user,hub_pwd,hub_addr,false)

		if false == success{
			shield_service.ReportStatus(transaction,constants.CommitStatus.FAILED,"Failed to run 'docker login' for image :"+image+", Error:"+msg)
			return 
		}

		shield_service.ReportStatus(transaction,constants.CommitStatus.COMMITTING,"start run ’docker commit' for image :"+image)

		success,msg = docker.Commit(container,image,author,note)

		if false == success{
			shield_service.ReportStatus(transaction,constants.CommitStatus.FAILED,"Failed to run 'docker commit' for image :"+image+", Error:"+msg)
			return 
		}
		 
		shield_service.ReportStatus(transaction,constants.CommitStatus.PUSHING,"Run 'docker commit' for image: "+ image+" successfully,start pushing")
		
		var push_end bool = false
		sync_chan := make(chan int, 0)

		defer func(){
			push_end = true
		}()
		
		// task heartbeat
		go func(){
			for{
				time.Sleep(3 * time.Second)

				if true == push_end{
					break
				}

				shield_service.ReportStatus(transaction,constants.CommitStatus.PUSHING,"Image: "+ image+" is been pushing") 
			}
			sync_chan <- 1
		}()

		success,msg = docker_push(image,hub_user,hub_pwd,hub_addr)

		push_end = true

		<- sync_chan

		if false == success{
			shield_service.ReportStatus(transaction,constants.CommitStatus.FAILED,"Failed to run 'docker push' for image :"+image+", Error:"+msg)
		}else{
			shield_service.ReportStatus(transaction,constants.CommitStatus.SUCCEEDED,"Run 'docker push' for image: "+ image+" successfully!")
		}

	}()

}


func Size(container string) (bool,float64,string){
	return docker.Size(container)
}