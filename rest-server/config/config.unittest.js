'use strict';

module.exports = () => {
  const config = exports = {};

  config.cluster = {
    listen: {
      port: 9186,
    },
  };

  config.sequelize = {
    host: '192.168.113.221',
    port: 3308,
    username: 'root',
    password: 'root',
  };
 

  config.security = {
    csrf: {
      enable: false,
    },
    domainWhiteList: [ 'http://localhost:9286', 'http://127.0.0.1:9286' ],
  };

  return config;
};
