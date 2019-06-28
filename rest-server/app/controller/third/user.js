'use strict';

const Controller = require('egg').Controller;
const ECode = require('../../error/code');

class ThirdUserController extends Controller {
  async register() {
    const { ctx, service, app } = this;
    const { username, password } = ctx.request.body;
    const { id: userId, status: userStatus } = ctx.state.user;
    if (userStatus !== app.model.User.constants.status.ZERO_HOUR) {
      return ctx.failure(ECode.OPERATION_FORBIDDEN, 'You are not third platform user');
    }

    const user = await service.third.user.register(userId, username, password);
    await service.hdfsProxy.createUserLogDir();
    await service.hdfsProxy.changeUserLogDirPower();

    const tokenPayload = {
      username,
      admin: false,
      orgId: user.orgId,
    };

    const token = await service.token.generate(tokenPayload, { expiresIn: 2 * 60 * 60 });
    // await service.influxProxy.userLogin({ userId: username, groupId: user.orgId });
    ctx.success({
      username,
      token,
      admin: false,
    });
  }
}

module.exports = ThirdUserController;
