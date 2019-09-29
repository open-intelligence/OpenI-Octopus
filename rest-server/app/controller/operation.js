// License please refer to: http://www.aitisa.org.cn/uploadfile/2018/0910/20180910031548314.pdf

'use strict';

const Controller = require('egg').Controller;
// const LError = require('../error/proto');
// const ECode = require('../error/code');


class OperationController extends Controller {
  async recordOperation() {
    const { ctx } = this;
    ctx.success();

    // const { ctx, service } = this;
    // try {

    //   const { action, actionInfo = {} } = ctx.request.body;
    //   const { username: userId } = ctx.state.user;
    //   const influxProxyService = service.influxProxy;
    //   const doAction = influxProxyService[action];
    //   let groupId = ctx.state.user.orgId;

    //   if (!doAction) {
    //     throw new LError(ECode.NOT_FOUND, 'action is not found');
    //   }
    //   if (!groupId) {
    //     const user = await service.user.getUserInfoByIdOrUserName(userId);
    //     groupId = user.orgId;
    //   }
    //   await doAction.call(influxProxyService, Object.assign(actionInfo, { userId, groupId }));
    //   ctx.success();
    // } catch (e) {
    //   throw new LError(ECode.NOT_FOUND, e.message);
    // }
  }
}

module.exports = OperationController;
