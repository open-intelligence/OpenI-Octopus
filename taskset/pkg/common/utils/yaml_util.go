package utils

import (
	"fmt"

	"gopkg.in/yaml.v2"
)

// ToYaml convert an object to string with yaml format
func ToYaml(obj interface{}) string {
	yamlBytes, err := yaml.Marshal(obj)
	if nil != err {
		panic(fmt.Errorf("Failed to marshal Object %#v to YAML: %v", obj, err))
	}
	return string(yamlBytes)
}

// FromYaml init an object from yaml
func FromYaml(str string, objAddr interface{}) {
	err := yaml.Unmarshal([]byte(str), objAddr)
	if nil != err {
		panic(fmt.Errorf("Failed to unmarshal YAML %#v to Object: %v", str, err))
	}
}
