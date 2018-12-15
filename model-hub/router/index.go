package router

import   (
	"github.com/julienschmidt/httprouter"
    "net/http"
)

func Index(w http.ResponseWriter, r *http.Request, ps httprouter.Params){
    w.Write([]byte(`{"msg":"welcome!"}`))
}