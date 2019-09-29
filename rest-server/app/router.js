'use strict';
const Routes = require('./routes');

module.exports = app => {
  new Routes(app).load();
  const { routes } = app;

  routes.acl.namespace('/api/v1/acl');
  routes.ogz.namespace('/api/v1/ogz');
  routes.job.namespace('/api/v1/jobs');
  routes.user.namespace('/api/v1/user');
  routes.image.namespace('/api/v1/image');
  routes.token.namespace('/api/v1/token');
  routes.dataSet.namespace('/api/v1/dataset');
  routes.operation.namespace('/api/v1/operation');
  routes.vc.namespace('/api/v1/virtual-clusters');
  routes.k8sServices.namespace('/api/v1/services');
  routes.jobPlatform.namespace('/api/v1/job/platform');
};
