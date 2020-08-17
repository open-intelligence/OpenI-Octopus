package v1

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
	v1 "scheduler/pkg/pipeline/apis/http/v1"
	"scheduler/pkg/pipeline/app"
	"scheduler/pkg/pipeline/constants/authority"
	status "scheduler/pkg/pipeline/constants/statusphrase"

	"github.com/gin-gonic/gin"
)

// ChangeAdminToken change admin token
func ChangeAdminToken(app *app.App, c *gin.Context) error {

	var param v1.AdminTokenParam

	if err := c.ShouldBindJSON(&param); err != nil {
		return err
	}

	if "" == param.Token {
		c.JSON(http.StatusOK, gin.H{
			"code": status.WRONG_PARAM,
			"msg":  "Token can't be empty",
		})
		return nil
	}

	err := app.Services().Token().UpdateAdminToken(param.Token)

	if err != nil {
		return err
	}

	c.JSON(http.StatusOK, gin.H{
		"code": status.OPERATION_SUCCEEDED,
		"msg":  "Update admin token successfully!",
	})

	return nil
}

// CreateToken create a token
func CreateToken(app *app.App, c *gin.Context) error {

	var param v1.CreateTokenParam

	if err := c.ShouldBindJSON(&param); err != nil {
		return err
	}

	if nil == param.Privileges || "" == param.ForWho {
		c.JSON(http.StatusBadRequest, gin.H{
			"code": status.WRONG_PARAM,
			"msg":  "Missing privilege list or Who para",
		})
		return nil
	}

	privilege := authority.NONE

	for _, p := range param.Privileges {
		switch p {
		case v1.PrivilegeReadFeature:
			{
				privilege = privilege | authority.READ_FEATURE
			}
		case v1.PrivilegeWriteFeature:
			{
				privilege = privilege | authority.WRITE_FEATURE
			}
		case v1.PrivilegeReadJob:
			{
				privilege = privilege | authority.READ_JOB
			}
		case v1.PrivilegeWriteJob:
			{
				privilege = privilege | authority.WRITE_JOB
			}
		case v1.PrivilegeReadToken:
			{
				privilege = privilege | authority.READ_TOKEN
			}
		case v1.PrivilegeWriteToken:
			{
				privilege = privilege | authority.WRITE_TOKEN
			}
		}
	}

	token, err := app.Services().Token().Create(privilege, param.ForWho, param.Note)

	if err != nil {
		return err
	}

	c.JSON(http.StatusOK, gin.H{
		"code": status.OPERATION_SUCCEEDED,
		"msg":  "Create token successfully!",
		"payload": gin.H{
			"token": token,
		},
	})
	return nil
}

// UpdateTokenPrivilege update token privilege
func UpdateTokenPrivilege(app *app.App, c *gin.Context) error {

	var param v1.UpdateTokenParam

	if err := c.ShouldBindJSON(&param); err != nil {
		return err
	}

	if nil == param.Privileges || "" == param.Token {
		c.JSON(http.StatusBadRequest, gin.H{
			"code": status.WRONG_PARAM,
			"msg":  "Missing privilege list or Token para",
		})
		return nil
	}

	privilege := 0

	for _, p := range param.Privileges {
		switch p {
		case v1.PrivilegeReadFeature:
			{
				privilege = privilege | authority.READ_FEATURE
			}
		case v1.PrivilegeWriteFeature:
			{
				privilege = privilege | authority.WRITE_FEATURE
			}
		case v1.PrivilegeReadJob:
			{
				privilege = privilege | authority.READ_JOB
			}
		case v1.PrivilegeWriteJob:
			{
				privilege = privilege | authority.WRITE_JOB
			}
		case v1.PrivilegeReadToken:
			{
				privilege = privilege | authority.READ_TOKEN
			}
		case v1.PrivilegeWriteToken:
			{
				privilege = privilege | authority.WRITE_TOKEN
			}
		}
	}

	err := app.Services().Token().Update(param.Token, privilege)

	if err != nil {
		return err
	}

	c.JSON(http.StatusOK, gin.H{
		"code": status.OPERATION_SUCCEEDED,
		"msg":  "Update token privilege successfully!",
	})
	return nil
}

// DeleteToken delete a token
func DeleteToken(app *app.App, c *gin.Context) error {

	var param v1.DeleteTokenParam

	if err := c.ShouldBindJSON(&param); err != nil {
		return err
	}

	if "" == param.Token {
		c.JSON(http.StatusBadRequest, gin.H{
			"code": status.WRONG_PARAM,
			"msg":  "Missing Token param",
		})
		return nil
	}

	err := app.Services().Token().Delete(param.Token)

	if err != nil {
		return err
	}

	c.JSON(http.StatusOK, gin.H{
		"code": status.OPERATION_SUCCEEDED,
		"msg":  "Delete token privilege successfully!",
	})
	return nil
}
