'use strict';

const path = require('path');

module.exports = () => {

  const config = exports = {};

  config.cluster = {
    listen: {
      port: 8083,
    },
  };

  config.security = {
    csrf: {
      ignoreJSON: true,
    },
  };

  config.pipeline = {
    address: "http://127.0.0.1:8080",//process.env.TASKSET_CORE_HOST, //"http://127.0.0.1:8080",
    token: "KLtmMug9BDvvRjlg"//process.env.TASKSET_CORE_ACCESS_TOKEN//"KLtmMug9BDvvRjlg"
  }

  config.sharehosts = {
    shareDirectory:"/ghome", //process.env.SHARE_DIRECTORY,
    image: "192.168.202.74:5000/openi/poddiscovery",//process.env.IMAGE_POD_DISCOVERY, //192.168.202.74:5000/openi/poddiscovery"
    command:"/app/poddiscovery" //process.env.SHARE_HOSTS_EXECUTER_COMMAND
  };

  config.k8sConfigPath = process.env.CUSTOM_KUBE_CONFIG_PATH

  config.debugJobDurationMsec = 120 //2 * 60 * 60 

  const featureIp = "http://127.0.0.1"
  const featurePort = 8083//process.env.SERVER_PORT //8083
  const featureAddr = "http://127.0.0.1:8083"//process.env.PLUGIN_HOST

  config.sequelize = {
    host: '192.168.99.108',
    port: 3320,
    username: 'root',
    password: 'root',
    database: 'restplugins',
  };

  config.address = {
    ip : featureIp,
    port : featurePort,
    taskset : {
        translatorUri : "/template",
        translatorAddr : featureAddr + "/template", 
    },
    netdiscovery : {
        decoratorUri : "/decorator",
        decoratorAddr : featureAddr + "/decorator",
        lifehookUri: "/lifehook/netdiscovery",
        lifehookAddr : featureAddr + "/lifehook/netdiscovery",
    },
    podgroup : {
        schedulerUri : "/podgroupScheduler",
        schedulerAddr : featureAddr + "/podgroupScheduler", 
        lifehookUri : "/podgroupLifehook",
        lifehookAddr : featureAddr + "/podgroupLifehook", 
    },
    debugjob : {
        lifehookUri : "/debugjobLifehook",
        lifehookAddr : featureAddr + "/debugjobLifehook", 
    },
    nnijob : {
      lifehookUri : "/nnijobLifehook",
      lifehookAddr : featureAddr + "/nnijobLifehook", 
    },
  }

  return config;
};
