'use strict';
const LError = require('../error/proto');
const ECode = require('../error/code');

module.exports = () => {
  return async function notFoundHandler(ctx, next) {
    await next();
    if (ctx.status === 404 && !ctx.body) {
      ctx.body = (new LError(ECode.NOT_FOUND, 'Path not found!')).toJson();
    }
  };
};
