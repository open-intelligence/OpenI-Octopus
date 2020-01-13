'use strict';
const path = require('path');

module.exports = {
  component: {
    enable: true,
    path: path.resolve(__dirname,'../plugins/egg-component'),
  },
  sequelize: {
    enable: true,
    path: path.resolve(__dirname,'../plugins/egg-sequelize'),
  },
  cors: {
    enable: true,
    package: 'egg-cors',
  },
  security: {
    enable: true,
    package: 'egg-security',
  },
  routerPlus: {
    enable: true,
    package: 'egg-router-plus',
  },
};
