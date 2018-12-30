'use strict';

const { app, assert } = require('egg-mock/bootstrap');

describe('test/app/controller/vc.test.js', () => {

  it('should assert', function* () {
    const pkg = require('../../../package.json');
    assert(app.config.keys.startsWith(pkg.name));

    // const ctx = app.mockContext({});
    // yield ctx.service.xx();
  });
 
});
