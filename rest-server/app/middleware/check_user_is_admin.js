'use strict';

const { ECode, LError } = require('../../lib');

module.exports = () => {
  return async function(ctx, next) {
    const { user } = ctx.state;

    if (!user || !user.admin) {
      throw new LError(ECode.OPERATION_FORBIDDEN, 'no permission');
    }

    await next();
  };
};
