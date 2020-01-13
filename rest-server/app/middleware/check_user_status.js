'use strict';

const { ECode, LError } = require('../../lib');
const WHITE_PATHS = /^\/api\/v1\/(user|token|ogz|third)/;

module.exports = () => {
  return async function(ctx, next) {
    if (WHITE_PATHS.test(ctx.path)) {
      await next();
      return;
    }

    const userModel = ctx.app.model.User;

    const UserStatus = userModel.constants.status;

    let { user:{username} } = ctx.state;

    let userInfo = null
    
    if (username) {
        userInfo = await ctx.service.user.getUserInfoByIdOrUserName(username);
    }

    if("default" == ctx.state.user.org_id && userInfo && userInfo.orgId){
        ctx.state.user.org_id =  userInfo.orgId;
    }

    if (userInfo && UserStatus.ALLOW_ACTIVE !== userInfo.status) {
      return ctx.failure(ECode.INCOMPLETE_INFO.code, ECode.INCOMPLETE_INFO.msg, { userStatus: userInfo.status });
    }

    await next();
  };
};
