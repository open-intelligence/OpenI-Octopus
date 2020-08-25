'use strict';

const path = require('path');

module.exports = () => {

  const config = exports = {};

  config.cluster = {
    listen: {
      port: parseInt(process.env.SERVER_PORT),
    },
  };

  config.sequelize = {
    host: process.env.MYSQL_HOST,
    port: process.env.MYSQL_PORT,
    username: process.env.MYSQL_USER,
    password: process.env.MYSQL_PWD,
    database: 'restplugins',
  };

  config.security = {
    csrf: {
      ignoreJSON: true,
    },
  };

  config.logger = {
    disableConsoleAfterReady: false,
    disableFileAfterReady:true
  };

  config.pipeline = {
    address: process.env.TASKSET_CORE_HOST,
    token: process.env.TASKSET_CORE_ACCESS_TOKEN//process.env.TASKSET_CORE_ACCESS_TOKEN//"KLtmMug9BDvvRjlg"
  }

  config.sharehosts = {
    shareDirectory:"/ghome", //process.env.SHARE_DIRECTORY,
    image: process.env.IMAGE_POD_DISCOVERY,//process.env.IMAGE_POD_DISCOVERY, //192.168.202.74:5000/openi/poddiscovery"
    command:"/app/poddiscovery" //process.env.SHARE_HOSTS_EXECUTER_COMMAND
  };

  config.k8sConfigPath = process.env.CUSTOM_KUBE_CONFIG_PATH

  config.debugJobDurationMsec = process.env.DEBUG_JOB_MAX_RUN_TIME

  const featureIp = "http://127.0.0.1"
  const featurePort = process.env.SERVER_PORT
  const featureAddr = process.env.PLUGIN_HOST


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
