// created by yyrdl on 2018.12.18
// see github.com/yyrdl/gbeta2

package gbeta2

import (
	"net/http"
	"strings"
	"github.com/julienschmidt/httprouter"
	"sync"
)

var (
	_T_Middleware int = 0
	_T_HTTP_Handler int = 1
	_T_Filter = 2
)

type Next func()

type Handler func (w *Res, r *http.Request ,ctx *Ctx,next Next)


type Middleware func(handle Handler) Handler

type pkg struct {
	p_type int
	path string
	method string
	mw Middleware
	handle Handler
}

type  Router struct{
	pkg []*pkg
	res_pool sync.Pool
	ctx_pool sync.Pool
}

func (r*Router)Mw( mw Middleware)*Router{
	_pkg:= new(pkg)
	_pkg.p_type = _T_Middleware
	_pkg.mw = mw
	r.pkg = append(r.pkg,_pkg)
	return r
}

func (r *Router )Use(path string,handle Handler)*Router{

	_pkg:= new(pkg)
	_pkg.p_type = _T_Filter
	_pkg.path = path
	_pkg.handle = handle
	r.pkg = append(r.pkg,_pkg)

	return  r;
}

func (r*Router)SubRouter(path string,router *Router)*Router{
	r.link(path,router)
	return r
}

func mergePath(p1,p2 string) string{
    if p1 == ""{
		return p2
	}
	if p2 == ""{
		return p1
	}

	if p1[len(p1)-1:] == "/" ||  p1[len(p1)-1:] == "\\"{
		p1 = p1[0:len(p1)-2]
	}

	if p2[0:1] == "/" ||  p2[0:1] == "\\"{
		p2 = p2[1:]
	}

	if "/" == p2 || "\\" == p2 {
		p2 = ""
	}

	if p2 == ""{
		return p1
	}

	return p1+"/"+p2
}

func pathMatch(src, dst string) bool{

	if len(src) <= len(dst){
		return src == dst[0:len(src)]
	}
	 
	return false
}

func linkMiddlewareAndFilter(pkgs []*pkg,end int, path string ,handle Handler)Handler{
    for i:= end-1;i >-1 ;i--{
		 
		if pkgs[i].p_type == _T_Middleware {
			handle = pkgs[i].mw(handle)
		}

		if pkgs[i].p_type == _T_Filter {
			 
            if pathMatch(pkgs[i].path,path){
				var _handle Handler = handle
				handle = func(ft Handler,hd Handler)Handler{
                       return func(w *Res, r *http.Request ,ctx *Ctx,next Next){
							var _next bool = false
							__next := func(){
								 _next = true
							}
						    ft(w,r,ctx,__next)
							if true == _next{
                                 hd(w,r,ctx,next)
							}
					   }
				}(pkgs[i].handle,_handle)
			}
		}
	}
	return handle
}

func (r*Router)link(path string,router *Router){
	for i:=0;i<len(router.pkg);i++{
		if router.pkg[i].p_type == _T_HTTP_Handler{
			router.pkg[i].handle  = linkMiddlewareAndFilter(router.pkg,i,router.pkg[i].path,router.pkg[i].handle)
			router.pkg[i].path = mergePath(path,router.pkg[i].path)
			r.pkg = append(r.pkg,router.pkg[i])
		}
	}
}

func (r *Router)handle(method,path string ,args ... Handler){
	if len(args) == 0{
		panic("Http handler is required!")
	}

    _pkg:= new(pkg)
	_pkg.p_type = _T_HTTP_Handler
	_pkg.path = path
	_pkg.method = method
	
	_pkg.handle = func (w *Res, r *http.Request ,ctx *Ctx,next Next){

		var _next bool = false

		__next:= func(){
			_next = true
		}

		for i:=0;i<len(args);i++{
			args[i](w,r,ctx,__next)
			if true == _next{
				_next = false
			}else{
				break
			}
		}

		if true == _next{
			next()
		}
	}

	r.pkg = append(r.pkg,_pkg)
}


func (r*Router)POST(path string ,args ... Handler){
	r.handle("post",path,args...)
}

func (r*Router)GET(path string ,args ... Handler){
	r.handle("get",path,args...)
}

func (r*Router)HEAD(path string ,args ... Handler){
	r.handle("head",path,args...)
}

func (r*Router)OPTIONS(path string ,args ... Handler){
	r.handle("option",path,args...)
}

func (r*Router)PUT(path string ,args ... Handler){
	r.handle("put",path,args...)
}

func (r*Router)PATCH(path string ,args ... Handler){
	r.handle("patch",path,args...)
}

func (r*Router)DELETE(path string ,args ... Handler){
	r.handle("delete",path,args...)
}


func (r*Router) Build()*httprouter.Router{

	 router:= httprouter.New()

	
	 for i:=0;i<len(r.pkg);i++{

         if r.pkg[i].path != ""{
			 r.pkg[i].path = strings.Replace(r.pkg[i].path,"\\","/",-1)
		 }
		
		 if r.pkg[i].p_type == _T_HTTP_Handler {

			 handle := linkMiddlewareAndFilter(r.pkg,i,r.pkg[i].path,r.pkg[i].handle)

			 md := r.pkg[i].method

			 pt := r.pkg[i].path

			 httprouter_handle := func(w http.ResponseWriter, req *http.Request, ps httprouter.Params){
				 
				 next:= func(){}
				 res := r.res_pool.Get().(*Res)
				 res.SetWriter(w)

				 ctx := r.ctx_pool.Get().(*Ctx)
				 ctx.Set("params",ps)

				 handle(res,req,ctx,next)

				 res.Clear()
				 r.res_pool.Put(res)

				 ctx.Clear()
				 r.ctx_pool.Put(ctx)
			 }

			 if "get" == md {
				 router.GET(pt,httprouter_handle)
			 }else if "post" == md{
				 router.POST(pt,httprouter_handle)
			 }else if "put" == md{
				 router.PUT(pt,httprouter_handle)
			 }else  if "HEAD" == md{
				 router.HEAD(pt,httprouter_handle)
			 }else if "option" == md{
                 router.OPTIONS(pt,httprouter_handle)
			 }else if "patch" == md{
				 router.PATCH(pt,httprouter_handle)
			 }else if "delete" == md{
				 router.DELETE(pt,httprouter_handle)
			 }
		 }

	 }

	 return router
}


func New()*Router{
	
	router := new(Router)

	router.res_pool.New = func()interface{}{
		return new(Res)
	}
	router.ctx_pool.New = func()interface{}{
		return NewContext()
	}
	return router
}