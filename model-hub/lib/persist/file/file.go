package file_util

import (
	"os"
	"io"
	"strings"
	"sync"
	"fmt"
	"ms_server/util/path"
)


var mutex *sync.Mutex = new(sync.Mutex)

const BUF_SIZE int = 512 

/**
 检查指定路径存不存在
 
*/
func Exist(path string) (bool) {

	_,err:= os.Stat(path)

	if err == nil{
		return true
	}

	if os.IsNotExist(err){
		return false
	}

	return true
}

/*
  创建文件
*/
func CreateFile(path string)(file *os.File,err error){

	path = strings.Replace(path,"\\","/",-1)

	segs := strings.Split(path,"/")

	var dir string
	
	if len(segs) > 1{
		dir = strings.Join(segs[0:len(segs)-1],"/")
		os.MkdirAll(dir,os.ModeDir|os.ModePerm)
	}

	return os.Create(path)
}
 
/**
  流式写入
*/
func Pipe(reader io.Reader,writer io.Writer)(error){
	
	buf:= make([]byte,BUF_SIZE,BUF_SIZE)

	var writeError error

	for{
		n,err := reader.Read(buf)

        if err == nil {

            if n== BUF_SIZE{
				_,writeError = writer.Write(buf)
			}else if n>0 && n < BUF_SIZE{
				_,writeError = writer.Write(buf[0:n])
			}

			if nil != writeError{
				return writeError
			}

		}else{
			
           if "EOF" == err.Error(){
			   if n > 0 {
				_,writeError = writer.Write(buf[0:n])
			   }
			   break
		   }else{
			   return err
		   }
		}
	}

	if nil != writeError{
		return writeError
	}

	return nil
}

/**
  合并文件成为一个新文件
*/
func ConcatFile(newFile string,files []string)(error){

	file,err:= CreateFile(newFile)

	if err!=nil{
		return err
	}

	defer func (){
		file.Close()
	}()
	
	i:=0
	
	for i< len(files){

		src,err2:= os.Open(files[i])

		if err2 != nil{
			return err2
		}

		Pipe(src,file)
		src.Close()
		i++
	}

    return nil
}

func ReadDir(path string)([]os.FileInfo,error){
	file,err := os.Open(path)
	if nil != err{
		return nil,err
	}
	defer file.Close()
	list,err:= file.Readdir(-1)
	if nil != err{
		return nil,err
	}
	return list,nil
}

/**
    原子操作
	目录应该存在，如果不存在，则创建
*/

func DirMustExist(dir string){
	mutex.Lock()
	if !Exist(dir){
		os.MkdirAll(dir,os.ModeDir|os.ModePerm)
	}
	mutex.Unlock()
}


func ReadDirIn(dir string,file_type string,node_name string)(string,error){
	
	if "file" == file_type{
		fd,err:= os.Open(dir)
		if nil!= err{
			return "",err
		}

		fd_info,err:= fd.Stat()
		if nil != err{
			return "",err
		}
		info:= fmt.Sprintf(`{"name":"`+node_name+`","type":"file","size":%d}`,fd_info.Size())
		return info,nil
	}else{

		file_list ,err:= ReadDir(dir)

		if nil!= err{
			return "",err
		}

		info:= `{"name":"`+node_name+`","type":"dir","child":[`

		if 0 == len(file_list){
			info= info+`]}`
			return info,nil
		}

		if file_list[0].IsDir(){

			node,err:= ReadDirIn(path_util.Join(dir,file_list[0].Name()),"dir",file_list[0].Name())
			if nil != err{
				   return "",err
			}
			info = info+node
		}else{
			info = info+fmt.Sprintf(`{"name":"`+file_list[0].Name()+`","type":"file","size":%d}`,file_list[0].Size())
		}

        if len(file_list) >1 {
			for i:=1;i<len(file_list);i++{
				if file_list[i].IsDir(){
					node,err:= ReadDirIn(path_util.Join(dir,file_list[i].Name()),"dir",file_list[i].Name())
					if nil != err{
						return "",err
					}
					info= info+","+node
				}else{
					info = info+fmt.Sprintf(`,{"name":"`+file_list[i].Name()+`","type":"file","size":%d}`,file_list[i].Size())
				}
			 }
		}
	  
		return info+"]}",nil
	}
}
