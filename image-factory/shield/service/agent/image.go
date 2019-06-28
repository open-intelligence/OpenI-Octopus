package agent

import (
	"strings"
	"io/ioutil"
	"net/http"
	"net/url"
	"shield/utils/path"
	"shield/config"
	"github.com/json-iterator/go"
)


func commit(url,transaction , image , container ,author, note,hub_user,hub_pwd,hub_addr string)(success bool,msg string){

	var json = jsoniter.ConfigCompatibleWithStandardLibrary

	param :=map[string]interface{}{
		"transaction":transaction,
		"image":image,
		"author":author,
		"container":container,
		"note":note,
		"hub_user":hub_user,
		"hub_pwd":hub_pwd,
		"hub_addr":hub_addr,
	}

	param_byte,err0 := json.Marshal(param)

	if nil != err0{
		return false, "Internal Error, Error:"+err0.Error()
	}

	resp, err := http.Post(url, "application/json", strings.NewReader(string(param_byte)))

	if nil != err{
		return false, "Internal Error, Error:"+err.Error()
	}

	defer resp.Body.Close()

	body , err2 := ioutil.ReadAll(resp.Body)

	if nil != err2{
		return false, "Internal Error, Error:"+err2.Error()
	}

	res:= json.Get(body)

	success = res.Get("success").ToBool()

	if true == success {
		msg = "Success"
	}else{
		msg = res.Get("msg").ToString()
	}

	return  

}

func AsyncCommit(transaction string,agent_address *url.URL,image,container,author , note,hub_user,hub_pwd,hub_addr string)(bool, string){

	url := agent_address.Scheme +"://" + path.Join(agent_address.Host,agent_address.Path,config.AGENT_ASYNC_COMMIT_API)
	 
	return commit(url,transaction,image,container,author,note,hub_user,hub_pwd,hub_addr)
}


func SyncCommit(transaction string,agent_address *url.URL,image,container,author, note ,hub_user,hub_pwd,hub_addr string)( bool, string){

	url := agent_address.Scheme +"://" + path.Join(agent_address.Host,agent_address.Path,config.AGENT_SYNC_COMMIT_API)

	return commit(url,transaction,image,container ,author,note,hub_user,hub_pwd,hub_addr)
}


func ImageSize(agent_address *url.URL,container string)(bool,float64,string){

	url := agent_address.Scheme +"://" + path.Join(agent_address.Host,agent_address.Path,config.AGENT_IMAGE_SIZE_API)+"?container="+container
	
	resp,err:= http.Get(url)

	if nil != err{
		return false,0 , "Internal Error, Error:"+err.Error()
	}

	defer resp.Body.Close()

	body,err1 := ioutil.ReadAll(resp.Body)

	if nil != err1{
		return false,0 , "Internal Error, Error:"+err1.Error()
	}

	var json = jsoniter.ConfigCompatibleWithStandardLibrary

	res:= json.Get(body)

	return res.Get("success").ToBool(),res.Get("size").ToFloat64(),res.Get("msg").ToString()

}