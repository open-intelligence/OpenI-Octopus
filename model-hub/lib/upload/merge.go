package upload

/**
  由于 客户端可以并发地上传同一个文件的不同块，服务端在不同
  的goroutine 里面接收这个文件块,如果由接收的goroutine去执行合并操作的话，那么有可能
  造成不同的goroutine同时去写同一个文件，势必将污染数据
  所以要保证只能有一个goroutine在操作本地文件。
  
  这里有三个粒度可选：
  * 全局只有一个 goroutine 负责文件的合并操作
  * 针对一个task_id 有一个唯一的goroutine 负责合并操作
  * 针对一个文件 有一个唯一的goroutine 负责合并操作

  这里选择第二个粒度



  by yyrdl 2018.11.29
*/

import (
	"os"
	"strconv"
	"fmt"
	"ms_server/util/path"
	"ms_server/lib/persist/file"
	"github.com/json-iterator/go"
)
 
//合并部分的代码报错应该报告给谁，属于系统错误呀，而且跟用户的不在一个goroutine
func merge(file_name,file_dir string)error{

	temp_list,err:= GetTempList(file_name,file_dir)

	if nil != err{
	   fmt.Println("[MERGE FILE ERROR] - ",file_name,err)
	   return err
	}

    if len(temp_list) == 0{
		return nil
	}

	if len(temp_list) == 1 && temp_list[0].Seq()== temp_list[0].Total(){
		if (temp_list[0].Total()>1 && temp_list[0].Merged()) || temp_list[0].Total() == 1{

			err = os.Rename(path_util.Join(file_dir,temp_list[0].ToString()),path_util.Join(file_dir,file_name))
			
			if err != nil {
				fmt.Println("[MERGE FILE ERROR] - rename file error single",err.Error())
			}
			return err
		}		
	}

	if len(temp_list) < 2{
       return nil
	}

	list:= make([]*TempFile,0)

	list =  append(list,temp_list[0])

	//获取连续的文件块
	for i:= 0;i<len(temp_list)-1;i++{
		if 1 != temp_list[i+1].Seq() - temp_list[i].Seq(){
			 break
		}else{
			list = append(list,temp_list[i+1])
		}
	}

	if len(list)<2{
		return nil
	}

	if !(list[0].Seq() == 1 || list[0].Merged()){
        return nil
	}

	end_seq := strconv.FormatUint(list[len(list)-1].Seq(),10)

	var fd *os.File
    //open the file with right privilege 
	fd,err = os.OpenFile(path_util.Join(file_dir,list[0].ToString()),os.O_APPEND|os.O_RDWR,os.ModeAppend|0666)

	if nil != err{
		fmt.Println("[MERGE FILE ERROR] - ",file_name,err)
		return err
	}
	//TODO:这里有一个优化，应该记录合并成功前的文件末尾位置，假如合并失败，应该恢复到之前的状态
	//然后再次尝试合并，如果依然失败，那么是致命错误，程序应该退出

	for i:=1;i<len(list);i++{
		rd,err:=os.Open(path_util.Join(file_dir,list[i].ToString()))
		if nil != err{
			fd.Close()
			return err
		}

		err = file_util.Pipe(rd,fd)

		rd.Close()
		if nil != err{
		    fd.Close()
			os.Remove(path_util.Join(file_dir,list[0].ToString()))// 已经被污染，删除掉,暴力的操作，优化之后不会这样做
			return err
		}

		os.Remove(path_util.Join(file_dir,list[i].ToString()))// 删除已经合并的文件块
	}

	err = fd.Close()

	if err != nil {
		fmt.Println("[MERGE FILE ERROR] - close file error ",err)
		return err
	}

	var newName  string

	if list[len(list)-1].Seq() == list[0].Total(){// 已经完全合并了，恢复到本来的文件名
		newName = file_name
	}else{
		newName =file_name+"T_"+strconv.FormatUint(uint64(list[0].Total()),10)+"_"+end_seq+"_Y.temp"
	}

	// err 这么多，重命名也能error.. 先不管了，应该是得让程序退出的，这种操作都能失败，系统问题。。
	err = os.Rename(path_util.Join(file_dir,list[0].ToString()),path_util.Join(file_dir,newName))

	if err != nil {
		fmt.Println("[MERGE FILE ERROR] - rename file error",err)
		return err
	}

	return nil
}

func _listFiles(node jsoniter.Any,dir string,deep int)[]string{
	 list := make([]string,0)
	 if "dir" == node.Get("type").ToString(){
		  child:= node.Get("child")
		  for i:=0;i<child.Size();i++{
			  var sub_dir string
			  if 0 == deep{
				  sub_dir = dir
			  }else{
				  sub_dir = path_util.Join(dir,node.Get("name").ToString())
			  }
			 
			  sub_list := _listFiles(child.Get(i),sub_dir,deep+1)
              list = append(list,sub_list...)
		  }
	 }else{
		 list =  append(list,dir,node.Get("name").ToString())
	 }

	 return list
}

func mergeAll(file_dir string,dir_info jsoniter.Any)error{
 
	task_list:= _listFiles(dir_info,"./",0)
	var err error = nil
	for i:= 0;i<len(task_list)-1;i+=2{
		err = merge(task_list[i+1],path_util.Join(file_dir,task_list[i]))
		if nil != err{
			return err
		}
		
	}
	return nil
}