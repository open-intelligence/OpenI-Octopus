package download

import (
	"io"
	"os"
	"strconv"
	"errors"
	"fmt"
	"ms_server/config"
	"ms_server/lib/persist/mysql"
	"github.com/json-iterator/go"
	"ms_server/util/path"
	
)

func PrepareDownload(user string, project_name string, project_version string)(bool, jsoniter.Any, error){

	sql := "SELECT project_info FROM ms_projects WHERE username=? AND project_name=? AND project_version=?;"
	 
	results,err:= mysql_util.QueryAsJson(sql,user,project_name,project_version)

	if nil != err{
		return false,nil,err
	}

	if 0 == results.Size(){
		return false ,nil,nil
	}
 
	return true,results.Get(0).Get("project_info"), err
}

func DownloadChunk(user,project,version,file, seq,chunksize string, w io.Writer)(error){
 
	projectRootPath:= path_util.Join(config.Get(config.FileStoragePath),user,project,"v"+version)
	 
	filepath := path_util.Join(projectRootPath, file)

	chunk_int64, err := strconv.ParseInt(chunksize, 10,64)

	if err!= nil{
		return err
	}

	seq_int64, err := strconv.ParseInt(seq, 10,64)

	if err!= nil{
		return err
	}

	start := (seq_int64-1)* chunk_int64

	fd, err := os.OpenFile(filepath,os.O_RDONLY,os.ModePerm)

	if err != nil{
		return err
	}

	fileInfo,err:= fd.Stat()

	if nil != err{
		return err
	}

	fileSize:= fileInfo.Size()

 
	if start >= fileSize{
		return errors.New(fmt.Sprintf("The target block is not exist! seq:%d,block_size:%s",seq_int64,chunksize))
	}

	defer fd.Close()
 
	fd.Seek(start,0)

	err = Pipe(fd,w,chunk_int64)

	return err
}


func Commit(download_id string)(error){
	return nil
}