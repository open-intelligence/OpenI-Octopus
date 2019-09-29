package main

import (
	"agent/config"
	"agent/controller"
	"github.com/gin-gonic/gin"
	"agent/service/shield"
)

func main() {
	
	config.LoadConfig()

	shield.Register()

	router := gin.Default()
	
	router.Use(gin.Logger())

	router.Use(gin.Recovery())

	router.GET("/health",controller.Health)

	v1 := router.Group("/v1")

	v1_image := v1.Group("/commit")
	{
		v1_image.POST("/sync",controller.SyncCommit)
		v1_image.POST("/async",controller.AsyncCommit)
		v1_image.GET("/size",controller.Size)
	}

	router.Run(":"+config.Get(config.PORT))

}
