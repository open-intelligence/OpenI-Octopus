'use strict';

const { getToken } = require('../common');

describe('test/app/controller/token.test.js', () => {
  describe('POST /api/v1/token', () => {
    it('should status 200 and get the body', async () => {
      await getToken();
    });
  });
});
