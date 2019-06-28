'use strict';

module.exports = () => {

  const config = exports = {};

  config.selfApp = {
    domain: 'http://cloudbrain.pcl.ac.cn',
    rootPath: '/rest-server',
  };


  const server_port = process.env.SERVER_PORT || 9186;

  config.cluster = {
    listen: {
      port: parseInt(server_port),
    },
  };


  config.sequelize = {
    host: process.env.MYSQL_HOST,
    port: process.env.MYSQL_PORT,
    username: process.env.MYSQL_USER,
    password: process.env.MYSQL_PWD,
  };

  config.APIGateWayIP = process.env.APIGateWay_IP;

  config.k8sConfigPath = process.env.K8S_CONFIG;

  config.userhomeBasePath = "/ghome/";

  config.usermodelBasePath="/gmodel/";

  config.prometheus = process.env.PROMETHEUS_URI;

  config.imageFactory = process.env.IMAGE_FACTORY_URI;

  config.logServiceUrl = process.env.LOG_SERVICE;

  config.docker = {
      registry: process.env.DOCKER_REGISTRY_ADDR,
      username: process.env.DOCKER_USER,
      password: process.env.DOCKER_PASSWORD,
      maxImageSize: 20*1024*1024//kb
  };

  config.security = {
    csrf: {
      enable: false,
    },
    domainWhiteList: [ 'http://localhost:9286', 'http://127.0.0.1:9286', 'http://192.168.112.221:9286' ],
  };

  config.thirdPlatform = {
    trustie: {
      oauth2: {
        client: {
          id: '88d893c5a345313e7b8c6fcf23d3d024ee08d5e41ce120c3448b6eea77d8ab11',
          secret: 'e9240cc5fc913741db5aea93f2986a8ea0631bb67f7c00e41e491b95d9617896',
        },
        protocol: 'https://',
        host: 'openi.org.cn',
        actions: {
          authorize: '/oauth/authorize',
          getToken: '/oauth/token',
          refreshToken: '',
          getUserInfo: '/oauth/userinfo',
        },
      },
    },
  };

  for (const pfName of Object.keys(config.thirdPlatform)) {
    const pf = config.thirdPlatform[pfName];
    if (pf.oauth2.host) {
      config.security.domainWhiteList.push(pf.oauth2.host);
    }
  }

  return config;
};
