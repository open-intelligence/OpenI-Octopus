'use strict';

module.exports = () => {

  const config = exports = {};

  config.selfApp = {
    domain: 'http://test-cloudbrain.pcl.ac.cn',
    rootPath: '/rest-server',
  };

  config.cluster = {
    listen: {
      port: 9186,
    },
  };

  config.sequelize = {
    host: '192.168.202.71',
    port: 3308,
    username: 'root',
    password: 'root',
  };

  config.APIGateWayIP = "192.168.202.71";

  config.logServiceUrl = "/log-service";

  config.imageFactory = "http://192.168.202.71:9001";

  config.k8sConfigPath = "D:\\rest-server/config";

  config.userhomeBasePath = "D:\\rest-server/ghome/";

  config.usermodelBasePath="D:\\rest-server/gmodel/";

  config.prometheus = "http://192.168.202.73:9091";

  config.docker = {
      registry: "192.168.202.74:5000",
      username: "admin",
      password: "harboradmin",
      maxImageSize: 20*1024*1024//kb
  };

  config.security = {
    csrf: {
      enable: false,
    },
    domainWhiteList: [ 'http://localhost:9286', 'http://127.0.0.1:9286', 'http://localhost:8000', 'http://127.0.0.1:8000' ],
  };

  config.thirdPlatform = {
    trustie: {
      oauth2: {
        client: {
          id: '88d893c5a345313e7b8c6fcf23d3d024ee08d5e41ce120c3448b6eea77d8ab11',
          secret: 'e9240cc5fc913741db5aea93f2986a8ea0631bb67f7c00e41e491b95d9617896',
        },
        protocol: 'https://',
        host: 'ucloudtest.trustie.net',
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
