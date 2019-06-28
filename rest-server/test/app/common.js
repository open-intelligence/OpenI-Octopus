'use strict';

const { app, assert } = require('egg-mock/bootstrap');

const RESPONSE = {
  status: {
    HTTP200: 200,
    HTTP201: 201,
    HTTP401: 401,
  },
  code: {
    SUCCESS: 'S000',
    NOTFOUND: 'S400',
  },
};

const assertFn = {
  responseSuccess(response) {
    assert(response.status === RESPONSE.status.HTTP200, 'http response status is not 200');
    assert(response.body.code === RESPONSE.code.SUCCESS, 'response code is not ' + RESPONSE.code.SUCCESS);
  },
};

module.exports = {
  app, assert,
  RESPONSE,
  assertFn,
  getToken(username, password, assertCallBack) {
    return app.httpRequest()
      .post('/api/v1/token')
      .send({
        username: username || 'admin',
        password: password || 'KLtmMug9BDvvRjlg',
        expiration: 7200,
      })
      .then(function(response) {
        if (assertCallBack) {
          assertCallBack(response);
        } else {
          assertFn.responseSuccess(response);
          assert(response.body.payload && response.body.payload.token, 'failure to get token');
        }

        return response.body.payload && response.body.payload.token;
      });
  },
};
