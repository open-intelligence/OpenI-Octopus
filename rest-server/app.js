'use strict';

const fse = require('fs-extra');

require.extensions['.mustache'] = (module, filename) => {
  module.exports = fse.readFileSync(filename, 'utf8');
};

global.Promise = require('bluebird').Promise;

module.exports = app => {
  app.beforeStart(async () => {
    const proxyDB = await app.initProxyDB();
    const jobConfigDB = await app.initJobConifgDB();

    app.proxyDB = proxyDB;
    app.jobConfigDB = jobConfigDB;
  });

  app.ready(err => {
    if (err) throw err;
    if (app.config.logger.disableFileAfterReady){
      app.disableFileLoggers();
    }
  });
};

