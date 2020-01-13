'use strict';

const path = require('path');

module.exports = () => {

  const config = exports = {};

  config.cluster = {
    listen: {
      port: 9186,
    },
  };

  config.sequelize = {
    host: '192.168.202.71',
    port: 3313,
    username: 'root',
    password: 'root',
    database: 'restserver',
  };

  config.esService = 'http://192.168.202.71/es';

  config.imageFactory = 'http://192.168.202.71:9001';

  config.docker = {
    registry: '192.168.202.74:5000',
    username: 'admin',
    password: 'harboradmin',
    maxImageSize: 20 * 1024 * 1024, // kb
  };

  config.security = {
    domainWhiteList: [ 'http://localhost:9286', 'http://127.0.0.1:9286', 'http://localhost:8000', 'http://127.0.0.1:8000' ],
  };
  
  config.dockerImages = {
    framenameworkBarrier: '192.168.202.74:5000/openi/frameworkbarrier:v1', // 包含 framenameworkbarrier 的镜像
    ubuntugit: '192.168.202.74:5000/openi/ubuntu-git2', // 包含git工具的镜像
    poddiscovery: '192.168.202.74:5000/openi/poddiscovery',
  };


  config.git = {
    server: '192.168.202.71',
    user: 'amax',
    password: 'Amax1979!',
    registry: '/home/amax/git/repodir/',
  };

  return config;
};
