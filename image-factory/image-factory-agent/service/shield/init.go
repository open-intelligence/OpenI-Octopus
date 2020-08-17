package shield

import (
	"net/url"
	"agent/config"
	"agent/utils/path"
)

var COMMIT_API string 
var REGISTER_API string

func init_api(){

	shield_url,err:= url.Parse(config.Get(config.SHIELD_ADDRESS))

	if err != nil{
		panic("Failed to parse 'SHIELD_ADDRESS':"+config.Get(config.SHIELD_ADDRESS))
	}

	COMMIT_API = shield_url.Scheme+"://" + path.Join(shield_url.Host,shield_url.Path,config.SHIELD_STATUS_COMMIT_API)
	REGISTER_API = shield_url.Scheme +"://"+path.Join(shield_url.Host,shield_url.Path,config.SHIELD_REGISTER_API)

}
 
 