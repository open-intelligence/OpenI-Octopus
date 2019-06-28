package config


import (
	"os"
	"strconv"
	"io/ioutil"
	"shield/utils/args"
	"github.com/json-iterator/go"
)


var config map[string]string


const (
	PORT string = "PORT"
)

var (
	MAX_COMMIT_EXIST_TIME int64 = 60 * 60 * 3// 3 hour
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
	 

	config[PORT] =json_config.Get("port").ToString()

	max_str := json_config.Get("max_commit_exist_time").ToString()

	if "" != max_str{

		value ,err:= strconv.ParseInt(max_str,10,64)

		if nil == err{
			MAX_COMMIT_EXIST_TIME = value
		}
	}

	
 
	return nil
}

func loadFromEnv(){
	config[PORT] = os.Getenv("PORT")
	
	max_str := os.Getenv("MAX_COMMIT_EXIST_TIME")

	if "" != max_str{

		value ,err:= strconv.ParseInt(max_str,10,64)

		if nil == err{
			MAX_COMMIT_EXIST_TIME = value
		}
	}
	
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

	if "" == config[PORT]{
		 config[PORT] = "9001"
	}



}


func Get(key string)string{
	return config[key]
}

