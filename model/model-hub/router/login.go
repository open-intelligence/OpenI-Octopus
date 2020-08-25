package router


import (
	"github.com/json-iterator/go"
	"ms_server/lib/login"
	"net/http"
	"ms_server/lib/gbeta2"
	"ms_server/util/json"
	"ms_server/util/http"
)

 func _login(w *gbeta2.Res, r *http.Request, ctx *gbeta2.Ctx,next gbeta2.Next)(J.JSON,error){
	
	body:= ctx.Get("body").(jsoniter.Any)

	user := body.Get("user").ToString()

	pwd := body.Get("pwd").ToString()

	if user == "" || pwd == ""{

        return J.JSON{
			"success": false,
			"message":"user and pwd are required!",
		},nil  
	}
	  
    token, err_msg, err := login.Login(user,pwd)

	if nil!= err{
		return nil,err
	}

	if token == "" {

		 if "" == err_msg{
			 err_msg = "Login failed"
		 }

		 return J.JSON{
			 "success":false,
			 "message":err_msg,
		 },nil
 
	}

	return J.JSON{
		"success":true,
		"token":token,
	},nil
}


func _signed (w *gbeta2.Res, r *http.Request, ctx *gbeta2.Ctx,next gbeta2.Next)(J.JSON,error){

	body:= ctx.Get("body").(jsoniter.Any)

	token:= body.Get("token").ToString()

	if "" == token {
		return J.JSON{
			"success":false,
			"message":"Token is required!",
		},nil
	}

	result,user,err := login.Signed(token)

	if nil!= err{
		return nil,err
	}

	if true ==  result{
		return J.JSON{
			"success":true,
			"user":user,
		},nil
	}

	return J.JSON{
		"success":false,
	},nil
}


func LoginRouter()*gbeta2.Router{
	
	router:= gbeta2.New()

	router.POST("/",http_util.HandleError(_login))

	router.POST("/check",http_util.HandleError(_signed))

	return router
}