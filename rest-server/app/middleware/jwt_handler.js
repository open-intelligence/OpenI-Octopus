'use strict';
const jwtMiddleware = require('koa-jwt');


module.exports = function(options) {
  const { secret } = options;
  return jwtMiddleware({ secret });
};

