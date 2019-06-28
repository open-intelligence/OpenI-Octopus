'use strict';

const Service = require('egg').Service;
const jwt = require('jsonwebtoken');

class TokenService extends Service {
  async generate(payload = {}, options) {
    const { jwt: jwtConfig } = this.config;
    return jwt.sign(payload, jwtConfig.secret, options);
  }
}

module.exports = TokenService;
