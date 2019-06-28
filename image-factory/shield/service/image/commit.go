package image

import (
	"time"
	"shield/constants"
	"shield/types"
	"shield/config"
	agent_service "shield/service/agent"
)

var Transaction_Records *types.ThreadSafeMap = nil

 

func init() {

	Transaction_Records = types.NewThreadSafeMap()

	var Timeout int64 = 60 * 60 * 3 // 3 hour

	go func() {
		for {

			Timeout = config.MAX_COMMIT_EXIST_TIME

			time.Sleep(60 * time.Second * 20)

			now := time.Now().Unix()

			list := Transaction_Records.List()

			for i := 0; i < len(list); i++ {
				it := list[i]
				commit := it.(*types.CommitRecord)

				if now-commit.GetTime() > Timeout {

					Transaction_Records.Delete(commit.GetId())
				}
			}
		}
	}()
}

func AsyncCommit(ip,image,container,author,note,hub_user,hub_pwd,hub_addr string) (success bool, transaction_id string, msg string) {

	address,agent_exist := agent_service.GetAgentAddress(ip)

	if false == agent_exist {
		return false, "", "The image-factory service on target node (" + ip + ") is not online!"
	}

	transaction_id = container

	if record, exist := Transaction_Records.Get(transaction_id); exist {

		old_commit,_ := record.(*types.CommitRecord) 

		old_status := old_commit.GetStatus()

		if constants.CommitStatus.FAILED == old_status || constants.CommitStatus.SUCCEEDED == old_status{

			Transaction_Records.Delete(transaction_id)

		}else{

			return false, transaction_id, "Commit task of container '"+container+"' is  processing!"
			
		}
	}

	commit := types.NewCommitRecord()

	commit.WriteAction(func(){
		commit.SetId(transaction_id)
		commit.SetStatus(constants.CommitStatus.INITIALIZED)
		commit.SetAuthor(author)
		commit.SetImage(image)
		commit.SetContainer(container)
		commit.SetNodeIP(ip)
		commit.SetStatusMsg("Commit task is initialized")
	})
	

	Transaction_Records.Set(transaction_id, commit)

	success, msg = agent_service.AsyncCommit(transaction_id,address,image,container,author,note,hub_user,hub_pwd,hub_addr)

	var status string = constants.CommitStatus.FAILED

	if true == success{
		status = constants.CommitStatus.PROCESSING
		msg  = "commit task is processing!"
	}

	commit.WriteAction(func(){
		commit.SetTime()
		commit.SetStatus(status)
		commit.SetStatusMsg(msg)
	})

	return

}

func QueryCommit(transaction_id string) types.JSON {

	record, exist := Transaction_Records.Get(transaction_id)

	if false == exist {
		return  nil
	}

	commit := record.(*types.CommitRecord)

	return  commit.ToJson()

}

func SetCommitStatus(transaction_id, status , status_comment string) (success bool, msg string) {

	record, exist := Transaction_Records.Get(transaction_id)

	if false == exist {
		return false, "Transaction (" + transaction_id + ") not found!"
	}

	commit := record.(*types.CommitRecord)

	commit.WriteAction(func(){
		commit.SetStatus(status)
		commit.SetStatusMsg(status_comment)
		commit.SetTime()
	})

	return true, "Success"
}

func SyncCommit(ip,image,container,author,note,hub_user,hub_pwd,hub_addr  string) (success bool, transaction_id,msg string) {

	address,agent_exist := agent_service.GetAgentAddress(ip)

	if false == agent_exist {
		return false, "", "The image-factory service on target node (" + ip + ") is not online!"
	} 

	transaction_id = container

	if record, exist := Transaction_Records.Get(transaction_id); exist {
		old_commit,_ := record.(*types.CommitRecord) 
		old_status := old_commit.GetStatus()
		if constants.CommitStatus.FAILED == old_status || constants.CommitStatus.SUCCEEDED == old_status{
			Transaction_Records.Delete(transaction_id)
		}else{
			return false, transaction_id, "Commit task of container '"+container+"' is  processing!"
		}
	}

	commit := types.NewCommitRecord()
	
	commit.WriteAction(func(){

		commit.SetId(transaction_id)
		commit.SetStatus(constants.CommitStatus.PROCESSING)
		commit.SetAuthor(author)
		commit.SetImage(image)
		commit.SetContainer(container)
		commit.SetNodeIP(ip)

	})

	Transaction_Records.Set(transaction_id, commit)

	success,msg = agent_service.SyncCommit(transaction_id,address,image,container,author,note,hub_user,hub_pwd,hub_addr)

	var status string = constants.CommitStatus.FAILED

	if true == success{
		status = constants.CommitStatus.SUCCEEDED
		msg = "Succeeded!"
	}
	 
	commit.WriteAction(func(){
		commit.SetTime()
		commit.SetStatus(status)
		commit.SetStatusMsg(msg)
	})
	 
	return 
}

func ImageSize(ip,container string)(bool,float64,string){

	address,agent_exist := agent_service.GetAgentAddress(ip)

	if false == agent_exist {

		return false, 0, "The image-factory service on target node (" + ip + ") is not online!"

	}

	return agent_service.ImageSize(address,container)

}