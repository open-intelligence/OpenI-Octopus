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
 
	var json = jsoniter.ConfigCompatibleWithStandardLibrary
 
	sql:= "SELECT create_date,expiration ,username FROM ms_token WHERE token =?;"
	db:= mysql_util.GetDB()
	rows,err:= db.Query(sql,token) 
	if nil != err{
		return false,"",err
	}
	defer rows.Close()
	rows_str,err:= mysql_util.RowsToJsonArray(rows);

	if nil != err{
		return false,"",err
	}

	any:= json.Get([]byte(rows_str))

	if 0 == any.Size(){
		return false,"",nil
	}

	create_date := any.Get(0,"create_date").ToInt64()
	expiration := any.Get(0,"expiration").ToInt64()
	username:= any.Get(0,"username").ToString()
	now:= time.Now().Unix()

	if  now - create_date >= expiration{
		return false,"",nil
	}

	return true,username,nil

}