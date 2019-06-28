package controller

import (
	"log"
	"github.com/gin-gonic/gin"
	"shield/types"
	agent_service "shield/service/agent"
)


func Register(c *gin.Context){
	var param types.AgentRegisterParam
	
	c.BindJSON(&param)

	log.Println("REGISTER",param.Ip,param.Address)

	if false == param.Ok(){
		
		c.JSON(400,gin.H{
		   "success":false,
		   "msg":"Lack of parameter",
	    })
	   return 
	}

	success,msg:= agent_service.Register(param.Ip,param.Address)

	c.JSON(201,gin.H{
		"success":success,
		"msg":msg,
	})

}