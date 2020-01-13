'use strict';

module.exports = () => {

  const config = exports = {};

  const server_port = process.env.SERVER_PORT || 9186;

  config.cluster = {
    listen: {
      port: parseInt(server_port),
    },
  };

  config.logger = {
    disableConsoleAfterReady: false,
    disableFileAfterReady:true
  };

  config.sequelize = {
    host: process.env.MYSQL_HOST,
    port: process.env.MYSQL_PORT,
    username: process.env.MYSQL_USER,
    password: process.env.MYSQL_PWD,
  };

  config.esService = process.env.ES_SERVICE_ROOT_PATH;

  config.imageFactory = process.env.IMAGE_FACTORY_URI;

  config.docker = {
    registry: process.env.DOCKER_REGISTRY_ADDR,
    username: process.env.DOCKER_USER,
    password: process.env.DOCKER_PASSWORD,
    maxImageSize: 20 * 1024 * 1024, // kb
  };

  config.security = {
    domainWhiteList: [ `http://localhost:${server_port}`, `http://127.0.0.1:${server_port}` ],
  };

  config.dockerImages = {
    framenameworkBarrier: process.env.IMAGE_FRAMEWORKBARRIER, // 包含 framenameworkbarrier 的镜像
    ubuntugit: process.env.IMAGE_UBUNTU_GIT, // 包含git工具的镜像
    poddiscovery: process.env.IMAGE_POD_DISCOVERY,
  };

  config.git = {
    server: process.env.GIT_SERVER,
    user: process.env.GIT_USER,
    password: process.env.GIT_PASSWORD,
    registry: process.env.GIT_REGISTRY,
  };

  return config;
};
