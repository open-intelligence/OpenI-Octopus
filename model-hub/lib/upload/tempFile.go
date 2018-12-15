package upload

/**
   临时文件
*/
import (
	"strings"
	"strconv"
	"sort"
	"ms_server/lib/persist/file"
)

type TempFile struct{
	fileName string
	merged bool
	dir string
	seq uint64
	total uint64
}


func (t*TempFile)FileName()string{
	return t.fileName
}

func (t*TempFile)Merged()bool{
	return t.merged
}

func (t*TempFile)Seq()uint64{
	return t.seq
}

func (t*TempFile)Total()uint64{
	return t.total
}

func (t*TempFile)Dir()string{
	return t.dir
}

func (t*TempFile)ToString()string{
   var merged string = "N"
   if true == t.merged{
	   merged = "Y"
   }
   return t.fileName+"T_"+strconv.FormatUint(uint64(t.total),10)+"_"+strconv.FormatUint(uint64(t.seq),10)+"_"+merged+".temp"
}

func(t*TempFile)Parse(file string)(*TempFile,error){
   T_pos:=strings.LastIndex(file,"T")
   coma_pos:= strings.LastIndex(file,".")
   t.fileName = file[0:T_pos]

   file = file[T_pos:coma_pos]

   list := strings.Split(file,"_")

   t.merged = list[3] == "Y"

   var err error
   t.seq,err = strconv.ParseUint(list[2],10,64)
   if err != nil{
	   return nil,err
   }
   t.total,err = strconv.ParseUint(list[1],10,64)
   if err != nil{
	return nil,err
   }

   return t,nil
}



func isNumberString(str string)bool{
	result:= true
	for i:=0;i< len(str);i++{
        if str[i] < '0' || str[i] > '9'{
			result = false
			break
		}
	}
	return result
}

func IsValidTempFile(filename string) bool{
	T_pos:=strings.LastIndex(filename,"T")

	if T_pos < 0 {
		return false
	}

	coma_pos:= strings.LastIndex(filename,".")
 
	filename = filename[T_pos:coma_pos] 
 
	list := strings.Split(filename,"_")

	if list[3] != "Y" && list[3] != "N"{
		return false
	}

	if !isNumberString(list[2]){
		return false
	}

	if !isNumberString(list[1]){
		return false
	}

	return true
	
}


func GenTempFileName(fileName,seq,total string) string{
	return fileName+"T_"+total+"_"+seq+"_N.temp"
}


type TempFileArray []*TempFile

func (t TempFileArray)Less(i,j int)bool{
   return t[i].Seq() < t[j].Seq()
}

func (t TempFileArray)Swap(i,j int){
    t[i],t[j] = t[j], t[i]
}

func (t TempFileArray)Len()int{
	return len(t)
}


func GetTempList(fileName string,dir string)([]*TempFile,error){
	 fileInfoList,err := file_util.ReadDir(dir)
	 if nil != err{
		 return nil,err
	 }

	 target_list:=make([]*TempFile,0)

	 for i:=0;i<len(fileInfoList);i++{
		 if fileInfoList[i].IsDir(){
			 continue
		 }
		
		 name:= fileInfoList[i].Name()

		 //非法temp文件 或者名字不匹配
		 if !IsValidTempFile(name) || strings.Index(name,fileName) !=0 {
			 continue
		 }

		 temp:= new(TempFile)
		 temp.Parse(name)
		 temp.dir = dir
		 target_list = append(target_list,temp)
	 }

	 sort.Sort(TempFileArray(target_list))
	 
	 return target_list,nil

}