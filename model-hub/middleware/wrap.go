package middleware 

import (
	"github.com/julienschmidt/httprouter"
	"net/http"
	 
)

type Handler func(r *http.Request, ps httprouter.Params)([]byte,error)


func Wrap(handler Handler)Middleware{
   return func(w http.ResponseWriter, r *http.Request, ps httprouter.Params)bool{
	   response,err := handler(r,ps)
	   if err != nil{
		   w.Write([]byte(`{"success":false,"message":"Internal Error:`+err.Error()+`"}`))
	   }else{
		   w.Write(response)
	   }
	   return false
   }
}