
package path

import (
	"strings"
)

func Join(ps ... string)string{
	path_:= make([]string,0)
	for i:=0;i<len(ps);i++{
		temp := strings.Split(strings.Replace(ps[i],"/","\\",-1),"\\")
	    if i==0 && len(temp)>0 && temp[0] == ""{
			path_ = append(path_,"/")
		}
		for k:=0;k<len(temp);k++{
          path_ = append(path_,temp[k])
		}
	} 
	 
	for i:=0 ;i<len(path_);i++{
		if "." == path_[i]{
			for k:= i-1;k>-1;k--{
				if ""!=path_[k]{
					path_[i] = ""
					break
				}
			}
		}else if ".." == path_[i]{
			for k:= i-1;k>-1;k--{
				if ""!=path_[k]{
					path_[k] = ""
					path_[i] = ""
					break
				}
			}
		}
	}

	var str string = ""

	for i:= 0;i<len(path_);i++{
		
		if ""!= path_[i]{
			if ""!= str{
				if "/" != str{
					str = str+"/"+path_[i]
				}else{
					str = str+path_[i]
				}
			}else{
				str = path_[i]
			}
		}
	}

	return str
}