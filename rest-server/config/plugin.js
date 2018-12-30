'use strict';
// const path = require('path');

module.exports = {
  sequelize: {
    enable: true,
    package: 'egg-sequelize',
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
