'use strict';

const Controller = require('egg').Controller;
const ECode = require('../error/code');

class UserController extends Controller {

  async updatePassword() {
    const { ctx, service } = this;
    const { username, oldPassword, newPassword } = ctx.request.body;

    if (oldPassword === newPassword) {
      ctx.logger.info('Failed to update password,please input a different password!');
      return ctx.failure(ECode.WRONG_PASSWORD, 'The new password is same with the old one,please input a different password !');
    }

    const userInfo = await service.user.getUserInfoByIdOrUserName(username);

    if (!userInfo) {
      ctx.logger.info('Failed to update password,can not find user ' + username);
      return ctx.failure(ECode.NOT_FOUND, 'Can not find user ' + username);
    }

    await service.user.updatePassword(oldPassword, newPassword, userInfo);
    ctx.logger.info('Update password for ' + username + '  successfully');
    ctx.created().success();
  }

  async getUserSimpleInfo() {
    const { ctx } = this;
    const { user } = ctx.state;
    ctx.success(user);
  }

  async updateUserInfo() {
    const { ctx, service } = this;
    const userInfo = ctx.request.body;
    const { username } = ctx.params;
    const { user } = ctx.state;

    if (user.username !== username) {
      return ctx.failure(ECode.OPERATION_FORBIDDEN, 'Only update yourself');
    }

    await service.user.updateUserInfo(userInfo, { username });
    ctx.success();
  }

  async getUserInfo() {
    const { ctx, service } = this;
    const { username } = ctx.params;
    const { user } = ctx.state;

    if (!user.admin && user.username !== username) {
      return ctx.failure(ECode.OPERATION_FORBIDDEN, 'Only find yourself');
    }

    const userInfo = await service.user.getUserInfo({ username });
    ctx.success(userInfo);
  }

  async update() {
    const { ctx, service } = this;
    const { username, password } = ctx.request.body;
    const { admin: isAdmin } = ctx.state.user;
    if (!isAdmin) {
      ctx.logger.info('Failed to add user, you are not administrator!');
      return ctx.failure(ECode.OPERATION_FORBIDDEN, 'You are not administrator');
    }
    const userInfo = await service.user.getUserInfoByIdOrUserName(username);
    const admin = userInfo ? userInfo.admin : false;

    await service.user.upsertUser(username, password, admin);
     
    ctx.logger.info('Add user successfully');

    ctx.created().success();
  }

  async remove() {
    const { ctx, service } = this;
    const { admin: isAdmin } = ctx.state.user;
    if (!isAdmin) {
      ctx.logger.info('Can not remove user, you are not administrator!');
      return ctx.failure(ECode.OPERATION_FORBIDDEN, 'You are not administrator');
    }
    const { username } = ctx.query;
    await service.user.removeUser(username);
    ctx.logger.info("Remove user '" + username + "' successfully!");
    ctx.success();
  }

  async getUserList() {
    const { ctx, service } = this;
    const { admin: isAdmin } = ctx.state.user;
    if (!isAdmin) {
      ctx.logger.info('Can not get user list, you are not administrator!');
      return ctx.failure(ECode.OPERATION_FORBIDDEN, 'You are not administrator');
    }
    const { ps, pi, inw, search } = ctx.query;
    const users = await service.user.getUserList({ inWhite: inw }, pi, ps, search);
    ctx.success(users);
  }

  async updateUserVc() {
    const { ctx, service } = this;
    const { admin: isAdmin } = ctx.state.user;
    if (!isAdmin) {
      ctx.logger.info('Can not update virtual cluster, you are not administrator!');
      return ctx.failure(ECode.OPERATION_FORBIDDEN, 'You are not administrator');
    }
    const { username } = ctx.params;
    const { virtualClusters } = ctx.request.body;
    await service.user.updateUserVc(username, virtualClusters);
    ctx.logger.info("Update user's virtual cluster successfully");
    ctx.created().success();
  }
}

module.exports = UserController;
