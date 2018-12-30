package upload

/**
  by yyrdl 2018.11.29
*/

import (
	"os"
	"strconv"
	"ms_server/util/path"
	"ms_server/lib/persist/file"
	"github.com/json-iterator/go"
)
 

func merge(file_name,file_dir string)(bool,error){

	if file_util.Exist(path_util.Join(file_dir,file_name)){
		 
		return true,nil
	}

	temp_list,err:= GetTempList(file_name,file_dir)

	if nil != err{
	   return false,err
	}

    if len(temp_list) == 0{
		return false,nil
	}

	if len(temp_list) == 1 && temp_list[0].Seq()== temp_list[0].Total(){

		if (temp_list[0].Total()>1 && temp_list[0].Merged()) || temp_list[0].Total() == 1{

			err = os.Rename(path_util.Join(file_dir,temp_list[0].ToString()),path_util.Join(file_dir,file_name))
			
			if err != nil {
				 return false ,err
			}

			return true,nil
		}		
	}

	if len(temp_list) < 2{
       return false,nil
	}

	list:= make([]*TempFile,0)

	 var start_index int = 0

	for i:=0;i<len(temp_list);i++{
		if temp_list[i].Merged(){
			start_index = i;
			break
		}
	}

	list =  append(list,temp_list[start_index])
	
	for i:= start_index;i<len(temp_list)-1;i++{

		if temp_list[i+1].Seq() == temp_list[i].Seq(){

			continue

		}

		if 1 != temp_list[i+1].Seq() - temp_list[i].Seq(){

			 break

		}else{

			if temp_list[i+1].Merged(){
				list = list[0:0]
				 
			}
			 
			list = append(list,temp_list[i+1])
		}
	}

	if len(list)<2{

		return false,nil

	}

	if !(list[0].Seq() == 1 || list[0].Merged()){
        return false,nil
	}

	end_seq := strconv.FormatUint(list[len(list)-1].Seq(),10)

	var fd *os.File

	//open the file with right privilege 
	
	fd,err = os.OpenFile(path_util.Join(file_dir,list[0].ToString()),os.O_APPEND|os.O_RDWR,os.ModeAppend|0666)

	if nil != err{

		return false,err
	}

	for i:=1;i<len(list);i++{
		
		rd,err:=os.Open(path_util.Join(file_dir,list[i].ToString()))
		if nil != err{
			fd.Close()
			return false,err
		}

		err = file_util.Pipe(rd,fd)

		rd.Close()

		if nil != err{
			fd.Close()
			os.Remove(path_util.Join(file_dir,list[0].ToString()))
			return false,err
		}
	}

	fd.Close() 

	var newName  string

	var success bool = false

	if list[len(list)-1].Seq() == list[0].Total(){
		newName = file_name
		success = true
	}else{
		newName =file_name+"T_"+strconv.FormatUint(uint64(list[0].Total()),10)+"_"+end_seq+"_Y.temp"
	}

	err = os.Rename(path_util.Join(file_dir,list[0].ToString()),path_util.Join(file_dir,newName))

	return success, err
}

func _listFiles(node jsoniter.Any,dir string,deep int)[]string{

	 list := make([]string,0)

	 if "file" == node.Get("type").ToString(){
		 return append(list,dir,node.Get("name").ToString())
	 }
	 
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
	 

	 return list
}

func mergeAll(file_dir string,dir_info jsoniter.Any)error{
 
	task_list:= _listFiles(dir_info,"./",0)

	var err error = nil

	var done bool = false

	for i:= 0;i<len(task_list)-1;i+=2{
		done ,err = merge(task_list[i+1],path_util.Join(file_dir,task_list[i]))
		if nil != err{
			return err
		}
		if true == done{
			CleanTempFile(task_list[i+1],path_util.Join(file_dir,task_list[i]))
		}
		
	}
	return nil
}