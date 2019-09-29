'use strict';

const path = require('path');

module.exports = () => {

  const config = exports = {};

  config.selfApp = {
    domain: 'http://test-cloudbrain.pcl.ac.cn',
    rootPath: '/rest-server',
  };

  config.cluster = {
    listen: {
      port: 9185,
    },
  };

  config.sequelize = {
    host: '192.168.202.73',
    port: 3310,
    username: 'root',
    password: 'root',
    database: 'restserver',
  };

  config.esService = 'http://192.168.202.71/es';

  config.logServiceUrl = '/log-service';

  config.imageFactory = 'http://192.168.202.71:9001';

  config.k8sConfigPath = path.join(__dirname, './config');


  config.userhomeBasePath = 'D:\\rest-server/ghome/';

  config.usermodelBasePath = 'D:\\rest-server/gmodel/';


  config.docker = {
    registry: '192.168.202.74:5000',
    username: 'admin',
    password: 'harboradmin',
    maxImageSize: 20 * 1024 * 1024, // kb
  };

  config.git = {
    server: '192.168.202.71',
    user: 'amax',
    password: 'Amax1979!',
    registry: '/home/amax/git/repodir/',
  };

  config.dockerImages = {
    framenameworkBarrier: '192.168.202.74:5000/openi/frameworkbarrier:v1', // 包含 framenameworkbarrier 的镜像
    ubuntugit: '192.168.202.74:5000/openi/ubuntu-git2', // 包含git工具的镜像
  };


  config.security = {
    csrf: {
      enable: false,
    },
    domainWhiteList: [ 'http://localhost:9286', 'http://127.0.0.1:9286', 'http://localhost:8000', 'http://127.0.0.1:8000' ],
  };

  return config;
};
