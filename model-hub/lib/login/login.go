package login

import (
	"ms_server/lib/persist/mysql"
	"ms_server/config"
	"github.com/json-iterator/go"
	"net/http"
	"strings"
	"io/ioutil"
	"time"
)

func  Login(user,pwd string) (string,string ,error) {
	form:= `{"username":"`+user+`","password":"`+pwd+`","expiration":345600}`//token有4天的有效时间
	req,err:= http.NewRequest("POST",config.Get(config.UserCenter)+"/api/v1/token",strings.NewReader(form))

	if nil != err{
		 return "","",err
	}
	req.Header.Add("Content-Type","application/json")

	client:= &http.Client{}
	resp,err:= client.Do(req)
	if nil != err{
		return "","",err
	}
	defer resp.Body.Close()
	body, err := ioutil.ReadAll(resp.Body)
	if err != nil {
	    return "","",err
	}

	var json = jsoniter.ConfigCompatibleWithStandardLibrary

	any:= json.Get(body);

	if "0" == any.Get("retCode").ToString(){
		token:=  any.Get("result").Get("token").ToString();
		if ""!= token {
			db:= mysql_util.GetDB()
			sql:= "DELETE  FROM ms_token WHERE username = ?;"
			rows,err:= db.Query(sql,user)
			if nil!= err{
				return "","",err
			}

			rows.Close()

			sql = "INSERT INTO ms_token(token,username,create_date,expiration) VALUES(?,?,?,?);"
			
			rows,err= db.Query(sql,token,user,time.Now().Unix(),345600)

			if nil!= err{
				return "","",err
			}
			rows.Close()
			return token ,"",nil
		}
	} 
	
	return "",any.Get("retMsg").ToString(),nil
	
}

func Signed(token string)(bool,string,error){
 
	sql:= "SELECT create_date,expiration ,username FROM ms_token WHERE token =?;"

	results,err:= mysql_util.QueryAsJson(sql,token)
	 

	if nil != err{
		return false,"",err
	}

	if 0 == results.Size(){
		return false,"",nil
	}

	create_date := results.Get(0,"create_date").ToInt64()
	expiration := results.Get(0,"expiration").ToInt64()
	username:= results.Get(0,"username").ToString()
	now:= time.Now().Unix()

	if  now - create_date >= expiration{
		return false,"",nil
	}

	return true,username,nil

}