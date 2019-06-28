'use strict';

const { app, assert, assertFn, getToken, RESPONSE } = require('../common');
const TESTACCOUNT = { username: 'TESTACCOUNT', password: 'TESTACCOUNT' };
let authorizationToken = 'Bearer ';

describe('test/app/controller/user.test.js', () => {

  before('Init Authorization Token', async function() {
    authorizationToken += await getToken();
  });

  describe('GET /api/v1/user - get the users', () => {
    it('should status 200', async () => {
      const result = await app.httpRequest()
        .get('/api/v1/user')
        .set('Authorization', authorizationToken);

      assertFn.responseSuccess(result);
      assert(result.body.payload.count > -1 && result.body.payload.rows.length > -1, 'failure to get Users');
    });
  });

  describe('POST /api/v1/user - create or update a user', () => {
    it('should status 201 and create a user to login', async () => {
      const result = await app.httpRequest()
        .post('/api/v1/user')
        .set('Authorization', authorizationToken)
        .send(TESTACCOUNT);
      assert(result.status === RESPONSE.status.HTTP201, 'http response status is not 201');
      assert(result.body.code === RESPONSE.code.SUCCESS, 'response code is not ' + RESPONSE.code.SUCCESS);

      await getToken(TESTACCOUNT.username, TESTACCOUNT.password);
    });

    it('should status 200 and update a user');
  });

  describe('PUT /api/v1/user - update a user password', () => {
    it('should status 200 and re-login successful', async () => {
      let token = await getToken(TESTACCOUNT.username, TESTACCOUNT.password);
      token = 'Bearer ' + token;

      const result = await app.httpRequest()
        .put('/api/v1/user')
        .set('Authorization', token)
        .send({ username: TESTACCOUNT.username, oldPassword: TESTACCOUNT.password, newPassword: '123456' });
      assert(result.status === RESPONSE.status.HTTP201, 'http response status is not 201');
      assert(result.body.code === RESPONSE.code.SUCCESS, 'response code is not ' + RESPONSE.code.SUCCESS);

      await getToken(TESTACCOUNT.username, '123456');
    });
  });

  describe('DELETE /api/v1/user - remove a user', () => {
    it('should status 200 and re-login failure', async () => {
      let token = await getToken();
      token = 'Bearer ' + token;

      const result = await app.httpRequest()
        .delete('/api/v1/user?username=' + TESTACCOUNT.username)
        .set('Authorization', token);
      assertFn.responseSuccess(result);

      await getToken(TESTACCOUNT.username, TESTACCOUNT.password, response => {
        assert(response.status === RESPONSE.status.HTTP200, 'http response status is not 200');
        assert(response.body.code === RESPONSE.code.NOTFOUND, 'response code is not ' + RESPONSE.code.NOTFOUND);
        assert(!response.body.payload || !response.body.payload.token, 'removed user but user account also can log in');
      });
    });
  });

  describe('PUT /api/v1/user/:username/virtualClusters - update user virtualClusters', () => {
    it('should status 200');
  });
});
