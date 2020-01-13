'use strict';

const { ECode, LError } = require('../../lib');

module.exports = () => {
  return async function(ctx, next) {
    const { user } = ctx.state;

    if (!user) {
      throw new LError(ECode.ACCESS_DENIED, 'please log in');
    }

    if (!user.admin) {
      const whileList = await ctx.service.user.loadCheckWhiteList();
      if (whileList.indexOf(user.username) < 0) {
        throw new LError(ECode.OPERATION_FORBIDDEN, 'forbidden');
      }
    }

    await next();
  };
};
