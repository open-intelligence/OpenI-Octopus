'use strict';
const Routes = require('./routes');

module.exports = app => {
  new Routes(app).load();
  const { routes } = app;

  routes.third.namespace('/api/v1/third');
  routes.vc.namespace('/api/v1/virtual-clusters');
  routes.imageSet.namespace('/api/v1/imagesets');
  routes.dataSet.namespace('/api/v1/dataset');
  routes.token.namespace('/api/v1/token');
  routes.user.namespace('/api/v1/user');
  routes.job.namespace('/api/v1/jobs');
  routes.hardware.namespace('/api/v1/hardwares');
  routes.k8sServices.namespace('/api/v1/services');
  // routes.common.namespace('/api/v1/common');
  routes.jobPlatform.namespace('/api/v1/job/platform');
  routes.acl.namespace('/api/v1/acl');
  routes.ogz.namespace('/api/v1/ogz');
  routes.operation.namespace('/api/v1/operation');
};
