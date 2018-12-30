//created by yyrdl on 2018.12.18
package mw


import (
	"log"
	"net/http"
	"io"
	"os"
	"time"
	"runtime"
	"ms_server/lib/gbeta2"
)

// prepare color printFunc to use
var (
	green        = string([]byte{27, 91, 57, 55, 59, 52, 50, 109})
	white        = string([]byte{27, 91, 57, 48, 59, 52, 55, 109})
	yellow       = string([]byte{27, 91, 57, 48, 59, 52, 51, 109})
	red          = string([]byte{27, 91, 57, 55, 59, 52, 49, 109})
	blue         = string([]byte{27, 91, 57, 55, 59, 52, 52, 109})
	magenta      = string([]byte{27, 91, 57, 55, 59, 52, 53, 109})
	cyan         = string([]byte{27, 91, 57, 55, 59, 52, 54, 109})
	reset        = string([]byte{27, 91, 48, 109})
	disableColor = false
)

var statusColor = func(status int) string {
	switch {
	case status < 200:
		{
			return blue
		}
	case status < 300:
		{
			return green
		}
	case status < 400:
		{
			return cyan
		}
	case status < 500:
		{
			return yellow
		}
	default:
		{
			return red
		}
	}
}

var timeColor = func(d time.Duration) string {
	switch {
	case d < 500*time.Millisecond:
		{
			return green
		}
	case d < 5*time.Second:
		{
			return yellow
		}
	default:
		{
			return red
		}
	}
}


func GetLogger(writer io.Writer)gbeta2.Middleware{

	if nil == writer{
		writer = os.Stdout
	}

	var logger = log.New(writer, "[MODEL-HUB]"+" ", log.Ldate|log.Ltime)

	return func(handle gbeta2.Handler) gbeta2.Handler{
		return func(res *gbeta2.Res, req *http.Request ,ctx *gbeta2.Ctx,next gbeta2.Next){

			start:= time.Now()

			handle(res,req,ctx,next)

			now:=time.Now()
			
			if "windows" == runtime.GOOS {
				logger.Printf(" |%3d| %13v |%-7s %s " ,res.Status(),now.Sub(start),req.Method,req.URL.Path)
			}else{
				logger.Printf(" |%s %3d %s| %13v |%s %-7s %s %s " ,statusColor(res.Status()),res.Status(),reset,now.Sub(start),green,req.Method,reset,req.URL.Path)
			}
			
	   }
	   
	}
}
