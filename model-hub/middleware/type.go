package middleware 

import (
	"github.com/julienschmidt/httprouter"
	"net/http"
)
type Middleware  func (w http.ResponseWriter, r *http.Request, ps httprouter.Params) bool