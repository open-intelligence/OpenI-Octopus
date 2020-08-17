package controller

import (
	"github.com/gin-gonic/gin"
	"shield/types"
	image_service "shield/service/image"
)


func AsyncCommit(c *gin.Context){
	
	var param types.CommitParam
	
	c.BindJSON(&param)

	if false == param.Ok(){
		 c.JSON(400,gin.H{
			"success":false,
			"msg":"Lack of parameter",
		})
		return 
	}

	success,transaction_id,msg := image_service.AsyncCommit(param.Ip,param.Image,param.Container,param.Author,param.Note,param.DockerRegistryUser,param.DockerRegistryPwd,param.DockerRegistry)

	 c.JSON(202,gin.H{
		"success":success,
		"msg":msg,
		"transaction_id":transaction_id,
	})

}

func CommitStatus(c *gin.Context){

	var param types.CommitStatusUpdateParam

	c.BindJSON(&param)

	if false == param.Ok(){
		c.JSON(400,gin.H{
		   "success":false,
		   "msg":"Lack of parameter",
	   })
	   return 
	}
	
	image_service.SetCommitStatus(param.Transaction,param.Status,param.StatusMsg)

	c.JSON(200,gin.H{
		"success":true,
		"msg":"success",
	})

}

func SyncCommit(c *gin.Context){
	var param types.CommitParam
	
	c.BindJSON(&param)

	if false == param.Ok(){
		c.JSON(400,gin.H{
			"success":false,
			"msg":"Lack of parameter",
		})
		return 
	}

	success,transaction_id,msg := image_service.SyncCommit(param.Ip,param.Image,param.Container,param.Author,param.Note,param.DockerRegistryUser,param.DockerRegistryPwd,param.DockerRegistry)

	c.JSON(201,gin.H{
		"success":success,
		"msg":msg,
		"transaction_id":transaction_id,
	})

}


func QueryCommit(c *gin.Context){

	  id := c.Query("transaction_id")

	  if id == ""{
	    c.JSON(400,gin.H{
			  "success":false,
			  "msg":"Lack of parameter",
			})
		return
	  }

	  json := image_service.QueryCommit(id)

	  if nil != json{

		  c.JSON(200,gin.H{
			  "success":true,
			  "msg":"success",
			  "commit":json,
		  })
		  return 
	  }

	  c.JSON(200,gin.H{
		  "success":false,
		  "msg":"Not Found",
	  })
}

func ImageSize(c *gin.Context){

	ip := c.Query("ip")

	container := c.Query("container")

	if "" == ip || "" == container{
		c.JSON(400,gin.H{
			"success":false,
			"msg":"Lack of parameter",
		})

	  return
	}

	success,size,msg := image_service.ImageSize(ip,container)

	c.JSON(200,gin.H{
		"success":success,
		"size":size,
		"msg":msg,
	})
}