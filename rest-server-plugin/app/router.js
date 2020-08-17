'use strict';

/**
 * @param {Egg.Application} app - egg application
 */

module.exports = app => {
  const { router, controller } = app;

  // feature of taskset translator
  router.post(app.config.address.taskset.translatorUri, controller.taskset.translator);

  // feature of netdiscovery
  router.post(app.config.address.netdiscovery.decoratorUri, controller.netdiscovery.decorator);
  router.post(app.config.address.netdiscovery.lifehookUri, controller.netdiscovery.lifehook);

  // feature of podgroup
  router.post(app.config.address.podgroup.schedulerUri, controller.podgroup.scheduler);
  router.post(app.config.address.podgroup.lifehookUri, controller.podgroup.lifehook);

  // feature of debugjob
  router.post(app.config.address.debugjob.lifehookUri, controller.debugjob.lifehook);

  // feature of nnijob
  router.post(app.config.address.nnijob.lifehookUri, controller.nnijob.lifehook);

};
