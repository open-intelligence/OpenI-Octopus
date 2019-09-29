'use strict';

const fse = require('fs-extra');

require.extensions['.mustache'] = (module, filename) => {
  module.exports = fse.readFileSync(filename, 'utf8');
};

global.Promise = require('bluebird').Promise;

module.exports = app => {
  app.beforeStart(async () => {
    const proxyDB = await app.initProxyDB();
    app.proxyDB = proxyDB;
    const jobConfigDB = await app.initJobConifgDB();
    app.jobConfigDB = jobConfigDB;

  });
};

