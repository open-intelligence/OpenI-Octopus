'use strict';

const { app, assert, assertFn, getToken } = require('../common');
let authorizationToken = 'Bearer ';

describe('test/app/controller/vc.test.js', () => {

  before('Init Authorization Token', async function() {
    authorizationToken += await getToken();
  });

  describe('GET /api/v1/virtual-clusters - list the virtual-clusters', () => {
    it('should status 200', async () => {
      const result = await app.httpRequest()
        .get('/api/v1/virtual-clusters')
        .set('Authorization', authorizationToken);

      assertFn.responseSuccess(result);
      assert(Object.keys(result.body.payload).length > -1, 'failure to get Virtual-Clusters');
    });
  });

  describe('GET /api/v1/virtual-clusters/:vcName - get a virtual-cluster', () => {
    it('should status 200');
  });
});
