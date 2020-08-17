package config


import (
	"os"
	"io/ioutil"
	"strings"
	"agent/utils/args"
	"github.com/json-iterator/go"
)


var config map[string]string


const (
	SHIELD_ADDRESS string = "SHIELD_ADDRESS"
	AGENT_ADDRESS string = "AGENT_ADDRESS"
	PORT string  = "PORT"
)


func init(){
	config = make(map[string]string, 0)
}


func loadFromConfigFile(configFilePath string)error{

	file,err:= os.Open(configFilePath)

	if err!= nil{
         return err
	}

	data,err := ioutil.ReadAll(file)

	if nil != err{
		return err
	}

	var json = jsoniter.ConfigCompatibleWithStandardLibrary
 
	var json_config jsoniter.Any = json.Get(data)
	 

	config[SHIELD_ADDRESS] =json_config.Get(strings.ToLower(SHIELD_ADDRESS)).ToString()
	config[AGENT_ADDRESS] =json_config.Get(strings.ToLower(AGENT_ADDRESS)).ToString()
	config[PORT] =json_config.Get(strings.ToLower(PORT)).ToString()

 
	return nil
}

func loadFromEnv(){
	config[SHIELD_ADDRESS] = os.Getenv(SHIELD_ADDRESS)
	config[AGENT_ADDRESS] = os.Getenv(AGENT_ADDRESS)
	config[PORT] = os.Getenv(PORT)
}


func LoadConfig(){

	configFilePath:= args.ParseArgs(os.Args)["config"]

    if "" != configFilePath {
		  err:= loadFromConfigFile(configFilePath)
		  if nil != err{
			 panic("Failed to load config,Error:"+err.Error())
		  } 
	}else{
		loadFromEnv()
	}

	if "" == config[SHIELD_ADDRESS]{
		panic("Please set env 'SHIELD_ADDRESS'")
	}

	if "" == config[PORT]{
		 config[PORT] = "9002"
	}
	
}


func Get(key string)string{
	return config[key]
}