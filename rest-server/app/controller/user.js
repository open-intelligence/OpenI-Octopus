// Copyright (c) Microsoft Corporation
// All rights reserved.
//
// MIT License
//
// Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated
// documentation files (the "Software"), to deal in the Software without restriction, including without limitation
// the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and
// to permit persons to whom the Software is furnished to do so, subject to the following conditions:
// The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING
// BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
// NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

'use strict';

const Controller = require('egg').Controller;

const ECode = require('../error/code');

class UserController extends Controller {

  async updatePassword() {

    const { ctx, service } = this;

    const { username, oldPassword, newPassword } = ctx.request.body;

    if (oldPassword === newPassword) {
      ctx.logger.info("Failed to update password,please input a different password!");
      return ctx.failure(ECode.WRONG_PASSWORD, 'The new password is same with the old one,please input a different password !');
    }

    const userInfo = await service.user.getUserInfoByIdOrUserName(username);

    if (!userInfo) {
      ctx.logger.info("Failed to update password,can not find user "+username);
      return ctx.failure(ECode.NOT_FOUND, 'Can not find user ' + username);
    }

    await service.user.updatePassword(oldPassword, newPassword, userInfo);
     ctx.logger.info("Update password for "+username+"  successfully");
     ctx.created().success();
  }

  async update() {
    const { ctx, service } = this;
    const { username, password } = ctx.request.body;
    const { admin: isAdmin } = ctx.state.user;
    if (!isAdmin) {
      ctx.logger.info("Failed to add user, you are not administrator!");
      return ctx.failure(ECode.OPERATION_FORBIDDEN, "You are not administrator");
    }
    const userInfo = await service.user.getUserInfoByIdOrUserName(username);
    const admin = userInfo ? userInfo.admin : false;

    await service.user.upsertUser(username, password, admin);
    await service.hdfsProxy.createUserLogDir();
    await service.hdfsProxy.changeUserLogDirPower();

    ctx.logger.info("Add user successfully")

    ctx.created().success();
  }

  async remove() {
    const { ctx, service } = this;
    const { admin: isAdmin } = ctx.state.user;
    if (!isAdmin) {
      ctx.logger.info("Can not remove user, you are not administrator!");
      return ctx.failure(ECode.OPERATION_FORBIDDEN, "You are not administrator");
    }
    const { username } = ctx.request.body;
    await service.user.removeUser(username);
     ctx.logger.info("Remove user '"+username+"' successfully!");
     ctx.success();
  }

  async getUserList() {
    const { ctx, service } = this;
    const { admin: isAdmin } = ctx.state.user;
    if (!isAdmin) {
      ctx.logger.info("Can not get user list, you are not administrator!");
      return ctx.failure(ECode.OPERATION_FORBIDDEN, "You are not administrator");
    }
    const { ps, pi } = ctx.query;
    const users = await service.user.getUserList({}, pi, ps);
    ctx.success(users);
  }

  async updateUserVc() {
    const { ctx, service } = this;
    const { admin: isAdmin } = ctx.state.user;
    if (!isAdmin) {
      ctx.logger.info("Can not update virtual cluster, you are not administrator!");
      return ctx.failure(ECode.OPERATION_FORBIDDEN, "You are not administrator");
    }
    const { username } = ctx.params;
    const { virtualClusters } = ctx.request.body;
    await service.user.updateUserVc(username, virtualClusters);
     ctx.logger.info("Update user's virtual cluster successfully")
     ctx.created().success();
  }
}

module.exports = UserController;
