
package controller

import (
	
	"github.com/gin-gonic/gin"
	image_service "agent/service/image"
)

type Param struct {
	Container string  `json:"container"`
	Image string      `json:"image"`
	Author string     `json:"author"`
	Note string       `json:"note"`
	Transaction string `json:"transaction"`
	DockerRegistryUser string 		`json:"hub_user"`
	DockerRegistryPwd string 		`json:"hub_pwd"`
	DockerRegistry string	`json:"hub_addr"`
}

func SyncCommit(c *gin.Context){

   var param Param

   c.BindJSON(&param)

   success,msg := image_service.SyncCommit(param.Container,param.Image,param.Author,param.Note,param.DockerRegistryUser,param.DockerRegistryPwd,param.DockerRegistry)
   
   if false == success{
	   c.JSON(200,gin.H{
		   "success":false,
		   "msg":msg,
	   })
	   return 
   }
   
	c.JSON(200,gin.H{
		"success":true,
		"msg":msg,
	})

}

func AsyncCommit(c *gin.Context){

	var param Param

	c.BindJSON(&param)

	image_service.AsyncCommit(param.Transaction,param.Container,param.Image,param.Author,param.Note,param.DockerRegistryUser,param.DockerRegistryPwd,param.DockerRegistry)

	c.JSON(200,gin.H{
		"success":true,
		"msg":"success",
	})

}

func Size(c *gin.Context){
	container := c.Query("container")

	success,size,msg := image_service.Size(container)

	c.JSON(200,gin.H{
		"success":success,
		"size":size,
		"msg":msg,
	})
}