package shield

import (
	"log"
	"net"
	"time"
	"strings"
	"net/http"
	"net/url"
	"io/ioutil"
	"agent/config"
	"github.com/json-iterator/go"
)
 
func my_addresses()[]map[string]string{

	address_list := make([]map[string]string, 0)

	address:= config.Get(config.AGENT_ADDRESS)

	port := config.Get(config.PORT)

	if "" != address{

		address_url,er := url.Parse(address)
		if nil != er{
			panic("Failed to pare address:"+address)
		}

		address_list = append(address_list,map[string]string{
			"ip":address_url.Host,
			"address":address,
		})
	}

	addrs, err := net.InterfaceAddrs()

	if nil != err{
		return address_list
	}
	 
	for _, address := range addrs {

		ipnet, ok := address.(*net.IPNet)

		if ok && !ipnet.IP.IsLoopback()  && ipnet.IP.To4() != nil && "" != ipnet.IP.String(){
			address_list = append(address_list,map[string]string{
				"ip":ipnet.IP.String(),
				"address":"http://"+ipnet.IP.String()+":"+port,
			})

		}
	}

	return address_list
}

func register(shield,agent_ip,agent_address string)(bool,string){
	
	var json = jsoniter.ConfigCompatibleWithStandardLibrary

	param :=map[string]interface{}{
		"ip":agent_ip,
		"address":agent_address,
	}

	param_bytes,err:= json.Marshal(param)

	if nil != err{
		return false,err.Error()
  	}

	req,err:= http.NewRequest("POST",shield,strings.NewReader(string(param_bytes)))

	req.Header.Add("Content-Type","application/json")

	client:= &http.Client{}

	resp,err1:= client.Do(req)

	if nil != err1{
		return false,err1.Error()
	}

	defer resp.Body.Close()

	body, err2 := ioutil.ReadAll(resp.Body)
	
	if err2 != nil {
	    return false,err2.Error()
	}

	res:= json.Get([]byte(body))

	return res.Get("success").ToBool(),res.Get("msg").ToString()
}

func Register(){

	init_api()

	address_list := my_addresses()

	if 0 == len(address_list){
		panic("No address for image-factory agent!!!")
	}

	go func(){

		time.Sleep( 5 * time.Second) // wait for the http server 

		for{

			var success bool = false
			var error_msg string 
			 
			for i:=0;i< len(address_list);i++{
				
				it := address_list[i]

				suc,msg := register(REGISTER_API,it["ip"],it["address"])

				if true == suc{
					success = true
				}else{
					log.Println(msg)
					error_msg = msg
				}
			}

			if false == success{
				log.Println("Warning! Can not register to image-factory shield! Error:"+error_msg)
			}else{
				log.Println("Register to shield successfully!")
			}

			time.Sleep(30*time.Second)
		}
	}()


}