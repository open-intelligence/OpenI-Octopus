'use strict';

const Controller = require('egg').Controller;


class AclController extends Controller {
  async addUserWhiteList() {
    const { ctx, service } = this;
    const { username } = ctx.request.body;

    await service.acl.addUserWhiteList(username);
    ctx.success();
  }

  async removeUserWhiteList() {
    const { ctx, service } = this;
    const { username } = ctx.query;

    await service.acl.removeUserWhiteList(username);
    ctx.success();
  }

  async listUserWhiteList() {
    const { ctx, service } = this;

    const whiteList = await service.user.loadCheckWhiteList();
    ctx.success(whiteList);
  }
}

module.exports = AclController;
