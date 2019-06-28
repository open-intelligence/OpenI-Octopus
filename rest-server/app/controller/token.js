'use strict';

const Controller = require('egg').Controller;

class TokenController extends Controller {
  async get() {
    const { ctx, service } = this;

    const { username, password, expiration } = ctx.request.body;
    const user = await service.user.check(username, password);
    await service.user.fillData(user);
    const tokenPayload = {
      username,
      admin: user.admin,
    };
    if (user.orgId) {
      tokenPayload.orgId = user.orgId;
    }

    const token = await service.token.generate(tokenPayload, { expiresIn: expiration });

    ctx.logger.info('Login successfully!');
    // await service.influxProxy.userLogin({ userId: username, groupId: user.orgId });
    ctx.success({
      username,
      token,
      admin: user.admin,
    });
  }
}

module.exports = TokenController;
