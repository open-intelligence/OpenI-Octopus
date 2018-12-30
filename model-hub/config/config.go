package config

import (
	"github.com/json-iterator/go"
	"os"
	"io/ioutil"
	"errors"
	"ms_server/util/args"

)

var  config  map[string]string


const (
	ServerPort string = "SERVER_PORT"

 	FileStoragePath string = "FILE_STORAGE_PATH"

	Mysql string = "MYSQL"
	 
	UserCenter string  = "USER_CENTER"

	Exchange string = "EXCHANGE_SERVICE"

	ENV string = "MODE_HUB_ENV"
 
)

func init(){
	config = make(map[string]string,0)
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
	 

	config[ServerPort] =json_config.Get(ServerPort).ToString()

	config[FileStoragePath] = json_config.Get(FileStoragePath).ToString()

	config[Mysql] = json_config.Get(Mysql).ToString()
	
	config[UserCenter] = json_config.Get(UserCenter).ToString()

	config[Exchange] = json_config.Get(Exchange).ToString()

	return nil
}

func loadFromEnv(){
	config[ServerPort] = os.Getenv(ServerPort)

	config[FileStoragePath] =  os.Getenv(FileStoragePath)

	config[Mysql] =  os.Getenv(Mysql)
	
	config[UserCenter] = os.Getenv(UserCenter)

	config[Exchange] = os.Getenv(Exchange)

	config[ENV] = os.Getenv(ENV)

	
	
}

func InitConfig() error{

	configFilePath:= args.ParseArgs(os.Args)["config"]

     if "" != configFilePath {
		  err:= loadFromConfigFile(configFilePath)
		  if nil != err{
			  return err;
		  } 
	 }else{
		loadFromEnv()
	 }

	if "" == config[ENV]{
		config[ENV] = "dev"
	}

	if config[ServerPort] == ""{
		return errors.New("Config Error! config 'SERVER_PORT' is neccessary!")
	}

	if config[FileStoragePath] == ""{
		return errors.New("Config Error! config 'FILE_STORAGE_PATH' is neccessary!")
	}

	if config[Mysql] ==  ""{
		return errors.New("Config Error! config 'MYSQL' is neccessary!")
	}

	if config[UserCenter] == ""{
		return errors.New("Config Error! config 'USER_CENTER' is neccessary!")
	}

	if config[Exchange] == ""{
		return errors.New("Config Error! config 'EXCHANGE_SERVICE' is neccessary!")
	}
	return nil
}

//read only ,lock is unneccessary
func Get(key string)(string){
    return config[key]
}


