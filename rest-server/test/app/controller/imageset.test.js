'use strict';

const { app, assert, assertFn, getToken } = require('../common');
let authorizationToken = 'Bearer ';

describe('test/app/controller/imageset.test.js', () => {

  before('Init Authorization Token', async function() {
    authorizationToken += await getToken();
  });

  describe('GET /api/v1/imageset - list the ImageSets', () => {
    it('should status 200', async () => {
      const result = await app.httpRequest()
        .get('/api/v1/imagesets')
        .set('Authorization', authorizationToken);

      assertFn.responseSuccess(result);
      assert(Object.keys(result.body.payload).length > -1, 'failure to get ImageSets');
    });
  });

  describe('GET /api/v1/imageset/:imagesetId - get a imageset', () => {
    it('should status 200');
  });
});
