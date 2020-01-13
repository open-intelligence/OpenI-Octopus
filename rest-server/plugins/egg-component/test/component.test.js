'use strict';

const mock = require('egg-mock');

describe('test/component.test.js', () => {
  let app;
  before(() => {
    app = mock.app({
      baseDir: 'apps/component-test',
    });
    return app.ready();
  });

  after(() => app.close());
  afterEach(mock.restore);

  it('should GET /', () => {
    return app.httpRequest()
      .get('/')
      .expect('hi, component')
      .expect(200);
  });
});
