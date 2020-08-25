package main

import (
	"shield/config"
	"shield/controller"
	"github.com/gin-gonic/gin"
)

func main() {
	
	config.LoadConfig()

	router := gin.Default()
	
	router.Use(gin.Logger())

	router.Use(gin.Recovery())

	v1 := router.Group("/v1")

	v1_image := v1.Group("/commit")
	{
		v1_image.POST("/sync",controller.SyncCommit)
		v1_image.POST("/async",controller.AsyncCommit)
		v1_image.GET("/query",controller.QueryCommit)
		v1_image.PUT("/status",controller.CommitStatus)
		v1_image.GET("/size",controller.ImageSize)
	}

	v1_agent := v1.Group("/agent")
	{
		v1_agent.POST("/register",controller.Register)
	}

	router.Run(":"+config.Get(config.PORT))

}
 
 