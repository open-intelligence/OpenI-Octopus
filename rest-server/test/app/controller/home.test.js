'use strict';

const { app, assert } = require('egg-mock/bootstrap');

describe('test/app/controller/token.test.js', () => {
  describe('POST /api/v1/token', () => {
    it('should status 200 and get the body', async () => {
      const result = await app.httpRequest()
        .post('/api/v1/token')
        .send({
          username: 'admin',
          password: 'KLtmMug9BDvvRjlg',
          expiration: 7200,
        });
      assert(result.status === 200);
      assert(result.body.username);
      assert(result.body.token);
    });
  });
});
