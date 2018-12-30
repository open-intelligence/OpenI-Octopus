'use strict';
const Routes = require('./routes');

module.exports = app => {
  new Routes(app).load();
  const { routes } = app;


  routes.vc.namespace('/api/v1/virtual-clusters');
  routes.imageSet.namespace('/api/v1/imagesets');
  routes.token.namespace('/api/v1/token');
  routes.user.namespace('/api/v1/user');
  routes.job.namespace('/api/v1/jobs');
};
