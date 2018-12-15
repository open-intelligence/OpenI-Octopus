package router


import (
	"github.com/json-iterator/go"
	"github.com/julienschmidt/httprouter"
	"io/ioutil"
	"ms_server/lib/login"
	"net/http"
)



func Login( r *http.Request, ps httprouter.Params)([]byte,error)  {

	body,err:= ioutil.ReadAll(r.Body)

	if err != nil {
		return nil,err
	}

	var json = jsoniter.ConfigCompatibleWithStandardLibrary

	var user string = json.Get(body,"user").ToString()

     var pwd string = json.Get(body,"pwd").ToString()

	if user == "" || pwd == ""{
		return []byte(`{"success":false,"message":"user and pwd is required"}`),nil
	}


	token, err_msg, err := login.Login(user,pwd)

	if nil!= err{
		return nil,err
	}

	if token == ""{
		 if "" == err_msg{
			 err_msg = "Login failed"
		 }

		 return []byte(`{"success":false,"message":"`+err_msg+`"}`),nil
 
	}

	return []byte(`{"success":true,"token":"`+token+`"}`),nil

}

func Signed( r *http.Request, ps httprouter.Params)([]byte,error){

	body,err:= ioutil.ReadAll(r.Body)

	if err != nil {
		return nil,err
	}
	
	var json = jsoniter.ConfigCompatibleWithStandardLibrary

	token := json.Get([]byte(body),"token").ToString();
	
	if "" == token{
		return []byte(`{"success":false,"message":"Parameter token is required"}`),nil	 
	}

	result,user,err := login.Signed(token)

	if nil!= err{
		return nil,err
	}

	if true ==  result{
		return []byte(`{"success":true,"user":"`+user+`"}`),nil
	}

	return []byte(`{"success":false,"message":"Token is illegal"}`),nil
	
}