'use strict';

const taskSetFeature = require('./libs/registry/taskset')
const podGroupFeature = require('./libs/registry/podgroup')
const netDiscoveryFeature = require('./libs/registry/netdiscovery')
const debugJobFeature = require('./libs/registry/debugjob')
const nniJobFeature = require('./libs/registry/nnijob')

module.exports = app => {

  app.messenger.once('register_feature_action', () => {
    taskSetFeature.register(app)
    podGroupFeature.register(app)
    netDiscoveryFeature.register(app)
    debugJobFeature.register(app)
    nniJobFeature.register(app)
  });

  app.beforeStart(async () => {
    await app.model.sync({
        force: false
    });
  });
 
  app.ready(async (err) => {
    if (err) throw err;
    if (app.config.logger.disableFileAfterReady){
      app.disableFileLoggers();
    }
  });
 
  app.beforeClose(async () => {
  });
}
