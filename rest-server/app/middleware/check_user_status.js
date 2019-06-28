'use strict';


const ECode = require('../error/code');
const WHITE_PATHS = /^\/api\/v1\/(user|token|ogz|third)/;

module.exports = () => {
  return async function(ctx, next) {
    if (WHITE_PATHS.test(ctx.path)) {
      await next();
      return;
    }

    const userModel = ctx.app.model.User;
    const UserStatus = userModel.constants.status;
    let { user } = ctx.state;
    if (user) {
      user = await ctx.service.user.getUserInfoByIdOrUserName(user.username);
    }

    if (user && UserStatus.ALLOW_ACTIVE !== user.status) {
      return ctx.failure(ECode.INCOMPLETE_INFO.code, ECode.INCOMPLETE_INFO.msg, { userStatus: user.status });
    }
    await next();
  };
};
