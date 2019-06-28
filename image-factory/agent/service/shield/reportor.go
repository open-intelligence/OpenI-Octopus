package shield

import (
	"strings"
	"net/http"
	"io/ioutil"
	"github.com/json-iterator/go"
)

 

func ReportStatus(transaction,status ,comment string) (bool,string)  {
	
	var json = jsoniter.ConfigCompatibleWithStandardLibrary

	param :=map[string]interface{}{
		"transaction":transaction,
		"status":status,
		"status_msg":comment,
	}

	param_bytes,err:= json.Marshal(param)

	if nil != err{
		return false,err.Error()
  	}

	req,err:= http.NewRequest("PUT",COMMIT_API,strings.NewReader(string(param_bytes)))

	req.Header.Add("Content-Type","application/json")

	client:= &http.Client{}

	resp,err1:= client.Do(req)

	if nil != err1{
		return false,err1.Error()
	}

	defer resp.Body.Close()

	body, err2 := ioutil.ReadAll(resp.Body)
	
	if err2 != nil {
	    return false,err2.Error()
	}

	res:= json.Get([]byte(body))

	return res.Get("success").ToBool(),res.Get("msg").ToString()

}

 