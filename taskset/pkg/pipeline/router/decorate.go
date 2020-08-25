package router

// MIT License
//
// Copyright (c) PCL. All rights reserved.
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE
//

import (
	"net/http"
	libApp "scheduler/pkg/pipeline/app"
	status "scheduler/pkg/pipeline/constants/statusphrase"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
)

type Handler func(*libApp.App, *gin.Context) error

type DecorateFunc func(int, Handler) gin.HandlerFunc

func genDecorateFunc(app *libApp.App) DecorateFunc {
	return func(authority int, handler Handler) gin.HandlerFunc {
		return func(ctx *gin.Context) {

			token := ctx.Request.Header.Get("token")

			if "" == token {
				ctx.Header("WWW-Authenticate", "Authorization Required")
				ctx.AbortWithStatus(http.StatusUnauthorized)
				return
			}

			privilege, err := app.Services().Token().Get(token)

			if nil != err {
				app.Logger().Error("Failed to get privilege", zap.String("token", token), zap.Error(err))
				ctx.JSON(http.StatusInternalServerError, gin.H{
					"code": status.INTERNAL_ERROR,
					"msg":  err.Error(),
				})
				return
			}

			if (privilege)&(authority) != authority {
				ctx.JSON(http.StatusForbidden, gin.H{
					"code": status.PERMISSION_DENIED,
					"msg":  "permission denied",
				})
				return
			}

			err = handler(app, ctx)

			if nil != err {
				app.Logger().Error("ServiceError",
					zap.String("url", ctx.Request.URL.Path),
					zap.Error(err),
				)
				ctx.JSON(http.StatusInternalServerError, gin.H{
					"code": status.INTERNAL_ERROR,
					"msg":  err.Error(),
				})
			}
		}
	}
}
