package middleware 

import (
	"github.com/julienschmidt/httprouter"
	"net/http"
)
func Link(mws ...Middleware) httprouter.Handle {
	return func(w http.ResponseWriter, r *http.Request, ps httprouter.Params){
		for _,mw:= range mws{
			next:= mw(w,r,ps)
			if true!= next{
				break
			}
		}
	}
}