// Copyright (c) Microsoft Corporation
// All rights reserved.
//
// MIT License
//
// Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated
// documentation files (the "Software"), to deal in the Software without restriction, including without limitation
// the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and
// to permit persons to whom the Software is furnished to do so, subject to the following conditions:
// The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING
// BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
// NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

'use strict';

const Controller = require('egg').Controller;


class TokenController extends Controller {
  async get() {
    const { ctx, service } = this;

    const { username, password, expiration } = ctx.request.body;

    const user = await service.user.check(username, password);

    await service.user.fillData(user);

    const tokenPayload = {
      org_id: user.orgId || "default",
      user_id:username,
      username: username,
      admin: user.admin,
    };

    const token = await service.token.generate(tokenPayload, { expiresIn: expiration });

    ctx.logger.info('Login successfully!');

    ctx.success({
      username,
      token,
      admin: user.admin,
    });
  }
}

module.exports = TokenController;
