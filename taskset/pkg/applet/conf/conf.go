package conf

import (
	"fmt"
	"io/ioutil"
	"os"
	"scheduler/pkg/common/utils"

	yaml "gopkg.in/yaml.v2"
)

var globConfigRO *AppletConfigurations
var globConfigMapRO = make(map[string]*AppletConfiguration)

func fromFile(path string) (*AppletConfigurations, error) {
	file, err := ioutil.ReadFile(path)
	if nil != err {
		panic(err)
	}

	config := &AppletConfigurations{}
	err = yaml.Unmarshal(file, config)
	if nil != err {
		return nil, err
	}

	err = validateConfig(config)
	return config, err
}

func validateConfig(config *AppletConfigurations) error {
	return nil
}

func LoadConfig(path string) {
	var configFilePath string
	if path == "" {
		configFilePath = utils.ParseArgs(os.Args)["config"]
	} else {
		configFilePath = path
	}
	if "" == configFilePath {
		panic(fmt.Errorf("missing config filepath"))
	}
	config, err := fromFile(configFilePath)
	if err != nil {
		panic(fmt.Errorf("Failed to load config from config file! Error: %s", err.Error()))
	}

	globConfigRO = config
	for _, option :=range globConfigRO.Options {
		globConfigMapRO[option.Name] = &AppletConfiguration{
			Pipeline: globConfigRO.Pipeline,
			Configuration: Configuration{
				Name: option.Name,
				Arguments: option.Arguments,
			},
		}
	}
}

func GetServerConfig() *ServerConfiguration {
	return globConfigRO.Server
}

func GetAppletConfigurationByFeatureUID(uid string) (*AppletConfiguration,error) {
	if uid == "" {
		return nil, fmt.Errorf("featureUID is null")
	}

	if config, found := globConfigMapRO[uid];found {
		return config, nil
	}
	return &AppletConfiguration{
		Pipeline: globConfigRO.Pipeline,
	}, nil
}