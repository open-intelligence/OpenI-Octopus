package pipeline

import (
	"fmt"
	api "scheduler/pkg/pipeline/apis/common"
	libSelector "scheduler/pkg/pipeline/components/selector"
	pluginTypes "scheduler/pkg/pipeline/constants/feature"

	jsoniter "github.com/json-iterator/go"
)

func compileFeature(str string) (*api.Feature, error) {
	feature := &api.Feature{}

	err := jsoniter.UnmarshalFromString(str, feature)

	if err != nil {
		return nil, err
	}

	feature.Init()

	return feature, nil
}

func compileSelector(str string) (*libSelector.Selector, error) {
	s := &api.JobSelector{}
	err := jsoniter.UnmarshalFromString(str, s)

	if err != nil {
		return nil, err
	}
	se := libSelector.New()
	err = se.Compile(s)
	return se, err
}

func generateFeatures(amount int, host, namePrefix string) ([]*api.Feature, error) {

	temp := `{
        "jobSelector":{
            "conditions":[
			    {
				    "name":"jobKind",
				    "key":"jobKind",
				    "expect":"^UserDefinedRuntime$"
			    },
			    {
				    "name":"userType",
				    "key":"user.type",
				    "expect":"^test$"
			    }
		    ],
		    "expression":"jobKind && userType"
        },
        "plugins":[
            {
                "key":"translator",
                "pluginType":"` + pluginTypes.PLUGIN_TYPE_TEMPLATE_TRANSLATOR + `",
                "callAddress": "http://` + host + `/` + pluginTypes.PLUGIN_TYPE_TEMPLATE_TRANSLATOR + `",
                "description":"hello world translator"
            },
            {
                "key":"checkor",
                "pluginType":"` + pluginTypes.PLUGIN_TYPE_ACCESS_GATE + `",
                "callAddress": "http://` + host + `/` + pluginTypes.PLUGIN_TYPE_ACCESS_GATE + `",
                "description":"hello world checkor"
            },
            {
                "key":"decorator",
                "pluginType":"` + pluginTypes.PLUGIN_TYPE_TEMPLATE_DECORATOR + `",
                "callAddress": "http://` + host + `/` + pluginTypes.PLUGIN_TYPE_TEMPLATE_DECORATOR + `",
                "description":"hello world decorator"
            },{
                "key":"factor",
                "pluginType":"` + pluginTypes.PLUGIN_TYPE_FACTOR_GENERATOR + `",
                "callAddress": "http://` + host + `/` + pluginTypes.PLUGIN_TYPE_FACTOR_GENERATOR + `",
                "description":"hello world factor"
            },{
                "key":"bindscheduler",
                "pluginType":"` + pluginTypes.PLUGIN_TYPE_SCHEDULER_BINDER + `",
                "callAddress": "http://` + host + `/` + pluginTypes.PLUGIN_TYPE_SCHEDULER_BINDER + `",
                "description":"hello world bindscheduler"
            },
            {
                "key":"bindlifehook",
                "pluginType":"` + pluginTypes.PLUGIN_TYPE_LIFEHOOK + `",
                "callAddress":"http://` + host + `/` + pluginTypes.PLUGIN_TYPE_LIFEHOOK + `",
                "description":"hello world lifehook",
                "jobSelector":{
                    "conditions":[],
                    "expression":"",
                    "states":["*"]
                }
            }
        ],
        "name":"%s%d", 
        "author":"yyrdl",
        "Authorization":"123"
    }`

	features := make([]*api.Feature, amount)

	for i := 0; i < amount; i++ {
		fStr := fmt.Sprintf(temp, namePrefix, i)
		f, err := compileFeature(fStr)
		if nil != err {
			return nil, err
		}
		features[i] = f
	}
	return features, nil
}

func CreateFeature(name, host string, features []string) (*api.Feature, error) {
	var plugins string = ""
	if nil != features {
		for i := 0; i < len(features); i++ {
			var pluginAdded string

			if features[i] == pluginTypes.PLUGIN_TYPE_TEMPLATE_TRANSLATOR {
				pluginAdded = `{
                    "key":"translator",
                    "pluginType":"` + features[i] + `",
                    "callAddress": "http://` + host + `/` + features[i] + `",
                    "description":"hello world translator"
                }`
			}
			if features[i] == pluginTypes.PLUGIN_TYPE_FACTOR_GENERATOR {
				pluginAdded = `{
                    "key":"factor",
                    "pluginType":"` + features[i] + `",
                    "callAddress": "http://` + host + `/` + features[i] + `",
                    "description":"hello world factor"
                }`
			}
			if features[i] == pluginTypes.PLUGIN_TYPE_ACCESS_GATE {
				pluginAdded = `{
                    "key":"checkor",
                    "pluginType":"` + features[i] + `",
                    "callAddress": "http://` + host + `/` + features[i] + `",
                    "description":"hello world checkor"
                }`
			}
			if features[i] == pluginTypes.PLUGIN_TYPE_TEMPLATE_DECORATOR {
				pluginAdded = `{
                    "key":"decorator",
                    "pluginType":"` + features[i] + `",
                    "callAddress": "http://` + host + `/` + features[i] + `",
                    "description":"hello world decorator"
                }`
			}
			if features[i] == pluginTypes.PLUGIN_TYPE_SCHEDULER_BINDER {
				pluginAdded = `{
                    "key":"bindscheduler",
                    "pluginType":"` + features[i] + `",
                    "callAddress": "http://` + host + `/` + features[i] + `",
                    "description":"hello world bindscheduler"
                }`
			}
			if features[i] == pluginTypes.PLUGIN_TYPE_LIFEHOOK {
				pluginAdded = ` {
                    "key":"bindlifehook",
                    "pluginType":"` + features[i] + `",
                    "callAddress":"http://` + host + `/` + features[i] + `",
                    "description":"hello world lifehook",
                    "jobSelector":{
                        "conditions":[],
                        "expression":"",
                        "states":["*"]
                    }
                }`
			}

			if "" == plugins {
				plugins = pluginAdded
			} else {
				plugins = plugins + "," + pluginAdded
			}

		}
	}

	if plugins == "" {
		plugins = `{
            "key":"factor",
            "pluginType":"` + pluginTypes.PLUGIN_TYPE_FACTOR_GENERATOR + `",
            "callAddress": "http://` + host + `/` + pluginTypes.PLUGIN_TYPE_FACTOR_GENERATOR + `",
            "description":"hello world factor"
        }`
	}

	temp := `{
        "jobSelector":{
            "conditions":[
			    {
				    "name":"jobKind",
				    "key":"jobKind",
				    "expect":"^UserDefinedRuntime$"
			    },
			    {
				    "name":"userType",
				    "key":"user.type",
				    "expect":"^test$"
			    }
		    ],
		    "expression":"jobKind && userType"
        },
        "plugins":[` + plugins + `],
        "name":"` + name + `", 
        "author":"yyrdl",
        "Authorization":"123"
    }`

	return compileFeature(temp)
}
