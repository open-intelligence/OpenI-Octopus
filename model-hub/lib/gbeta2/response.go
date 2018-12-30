// created by yyrdl on 2018.12.18
package gbeta2


import (
	"net/http"
	"io"
)

type Res struct {
	wr http.ResponseWriter
	size   int
	status int
}

const (
	noWritten = -1
	defaultStatus = 200
)

func (w *Res) Clear( ) {
	w.wr = nil
	w.size = noWritten
	w.status = defaultStatus
}

func(w*Res)SetWriter(wr http.ResponseWriter){
	w.wr = wr
}

func (w *Res) WriteHeader(code int) {
	if code > 0 && w.status != code {
		w.status = code
	}
}

func (w *Res) WriteHeaderNow() {
	if !w.Written() {
		w.size = 0
		w.wr.WriteHeader(w.status)
	}
}

func (w *Res) Write(data []byte) (n int, err error) {
	w.WriteHeaderNow()
	n, err = w.wr.Write(data)
	w.size += n
	return
}

func (w *Res) WriteString(s string) (n int, err error) {
	w.WriteHeaderNow()
	n, err = io.WriteString(w.wr, s)
	w.size += n
	return
}

func (w *Res) Status() int {
	if w.status > 0 {
		return w.status
	}else{
		return 200
	}

}

func (w *Res) Size() int {
	return w.size
}

func (w *Res) Written() bool {
	return w.size != noWritten
}


func (w *Res) Flush() {
	w.WriteHeaderNow()
	w.wr.(http.Flusher).Flush()
}