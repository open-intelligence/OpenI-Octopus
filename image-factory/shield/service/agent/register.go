package agent

import (
	"shield/types"
	"shield/utils/path"
	"shield/config"
	"net/url"
	"net/http"
	"io/ioutil"
)

var Agents_List * types.ThreadSafeMap = types.NewThreadSafeMap()


func connect(agent_address *url.URL) (bool){

	url:= agent_address.Scheme +"://"+ path.Join(agent_address.Host,agent_address.Path,config.AGENT_HEALTH_CHECK_API)

	resp,err:= http.Get(url)

	if nil != err{
		return false
	}

	defer resp.Body.Close()

	_,err1 := ioutil.ReadAll(resp.Body)

	if nil != err1{
		return false
	}

	return true
}

func Register(ip, address string) (bool,string) {

	agent_url,err:= url.Parse(address)

	if nil != err{
		return false,"Failed to parse url :'"+address+"',Error:"+err.Error()
	}

	if false == (connect(agent_url)){
		return false ,"Can not connect agent with address '"+address+"'"
	}

	Agents_List.Set(ip,agent_url)

	return true,"success"
}


func GetAgentAddress(ip string) (*url.URL,bool){

	value,exist := Agents_List.Get(ip)

	if value == nil || false == exist{
		return nil ,false
	}

	address,_:= value.(*url.URL)
	 
	return address,true
}