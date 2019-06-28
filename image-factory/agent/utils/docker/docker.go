package docker 

import (
	"strings"
    "strconv"
	"regexp"
	"agent/utils/cmd"
)

func Login(user,pwd,respository string)(bool,string){
	
	args:=[]string{
		"login",
		"--password",
		pwd,
		"--username",
		user,
		respository,
	}

	success,msg := cmd.Run("docker",args)

	if false == success && msg != ""  && strings.Contains(msg,"permission") && strings.Contains(msg,"denied"){
		msg = "Permission denied,Can not run  command 'docker'" 
	}

	if  msg != "" && strings.Contains(msg,"daemon") && strings.Contains(msg,"Error"){
		msg_split := strings.Split(msg,"Error")
		msg = "Error" + msg_split[len(msg_split)-1]
		success = false
	} 

	if  strings.Contains(msg,"--password") || strings.Contains(msg,"stored"){
		success = true
		msg = "success"
	} 


	return success,msg

}


func Commit(container,image,author,note string) ( bool , string) {

	args := []string{
		"commit",
	}
 
	if author != ""{
		args = append(args,"-a",author)
	}

	if note != ""{
		args = append(args,"-m",note)
	}

	args = append(args,container,image)

	success,msg := cmd.Run("docker",args)
	
	if false == success && msg != ""  && strings.Contains(msg,"permission") && strings.Contains(msg,"denied"){
		msg = "Permission denied,Can not run  command 'docker'" 
	}

	return success,msg

}


func Push(image string)(bool,string){

	args := []string{
		"push",
		image,
	}

	success,msg := cmd.Run("docker",args)
	
	if false == success && msg != ""  && strings.Contains(msg,"permission") && strings.Contains(msg,"denied"){
		msg = "Permission denied,Can not run  command 'docker'" 
	}

	if false == success && msg != ""  && strings.Contains(msg,"denied") && strings.Contains(msg,"resource"){
		msg = msg +". Maybe you should sign in to the respository at first!" 
	}

	return success,msg
	 
}

var _Size_Regexp * regexp.Regexp = regexp.MustCompile("virtual\\s+([\\d.]+)([A-Za-z]{2,2})")


func parse_size(str string, regx * regexp.Regexp)(bool ,float64,string){

	if false == regx.MatchString(str){
		return false,0,"does not match size pattern"
	}

	size_strs := regx.FindStringSubmatch(str)

	if 3 != len(size_strs){
		return false,0,"does not match size pattern"
	}

	size,err := strconv.ParseFloat(size_strs[1],10)

	if nil != err{
		return false , 0, err.Error()
	}

	if "gb" == strings.ToLower(size_strs[2]){
		size = size * 1024 * 1024
	}

	if "mb" == strings.ToLower(size_strs[2]){
		size = size * 1024
	}

	return true,size,"success"
}


func get_by(what,target string)(success bool,size float64,msg string){

	args :=[]string{
		"ps",
		"--filter",
		what+"="+target,
		"--format",
		"{{.ID}}|||{{.Names}}|||{{.Size}}",
		"-as",
	}

	success,msg = cmd.Run("docker",args)
	
	if false == success && msg != ""  && strings.Contains(msg,"permission") && strings.Contains(msg,"denied"){
		msg = "Permission denied,Can not run  command 'docker'" 
	}

	msg = strings.TrimSpace(msg)

	if "" == msg{
		return false,0,"Container not found,container:"+target
	}

	if suc,size_t,_ := parse_size(msg,_Size_Regexp);true == success && suc == true {
		
		return true,size_t,"success" 

	}

	return success,0,msg
}

func Size(container string)(success bool,size float64, msg string){

	success,size,msg = get_by("id",container)

	if true == success{
		return 
	}

	success,size,msg = get_by("name",container)

	return 
	
}