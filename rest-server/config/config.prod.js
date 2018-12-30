// Copyright (c) Microsoft Corporation
// All rights reserved.
//
// MIT License
//
// Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated
// documentation files (the "Software"), to deal in the Software without restriction, including without limitation
// the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and
// to permit persons to whom the Software is furnished to do so, subject to the following conditions:
// The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING
// BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
// NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

'use strict';

module.exports = appInfo => {

  const config = exports = {};
  let server_port = process.env.SERVER_PORT || 9186;
  config.cluster = {
    listen: {
      port: parseInt(server_port),
    },
  };
  config.sequelize = {
    host: process.env.OPENI_DB_HOST,
    port: process.env.OPENI_DB_PORT,
    username: process.env.OPENI_DB_USER,
    password: process.env.OPENI_DB_PWD,
  };

  config.natFile = process.env.NAT_FILE;
  config.userDbFile = process.env.USERDB_FILE || 'rest-server/user_db.json';
  config.jobLimit = process.env.JOB_LIMIT || 'rest-server/joblimit.json';
  config.virtualDebugClusters = process.env.VIRTUAL_DEBUG_CLUSTERS || ["default"];

  const launcherConfig = config.launcherConfig = {
    hdfsUri: process.env.HDFS_URI,
    webhdfsUri: process.env.WEBHDFS_URI,
    webserviceUri: process.env.LAUNCHER_WEBSERVICE_URI,
    webserviceRequestHeaders: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    jobRootDir: './frameworklauncher',
    jobDirCleanUpIntervalSecond: 7200,
    jobConfigFileName: 'JobConfig.json',
    frameworkDescriptionFilename: 'FrameworkDescription.json',
  };


  const launcherApi = {
    healthCheckPath: () => {
      return `${launcherConfig.webserviceUri}/v1`;
    },
    frameworksPath: () => {
      return `${launcherConfig.webserviceUri}/v1/Frameworks`;
    },
    frameworkStatusPath: frameworkName => {
      return `${launcherConfig.webserviceUri}/v1/Frameworks/${frameworkName}/FrameworkStatus`;
    },
    frameworkAggregatedStatusPath: frameworkName => {
      return `${launcherConfig.webserviceUri}/v1/Frameworks/${frameworkName}/AggregatedFrameworkStatus`;
    },
    frameworkPath: frameworkName => {
      return `${launcherConfig.webserviceUri}/v1/Frameworks/${frameworkName}`;
    },
    frameworkRequestPath: frameworkName => {
      return `${launcherConfig.webserviceUri}/v1/Frameworks/${frameworkName}/FrameworkRequest`;
    },
    frameworkExecutionTypePath: frameworkName => {
      return `${launcherConfig.webserviceUri}/v1/Frameworks/${frameworkName}/ExecutionType`;
    },
    frameworkInfoWebhdfsPath: frameworkName => {
      return `${launcherConfig.webhdfsUri}/webhdfs/v1/Launcher/${frameworkName}/FrameworkInfo.json?op=OPEN`;
    },
  };

  Object.assign(launcherConfig, launcherApi);


  config.yarnConfig = {
    yarnUri: process.env.YARN_URI,
    webserviceRequestHeaders: {
      Accept: 'application/json',
    },
    yarnVcInfoPath: process.env.YARN_URI + '/ws/v1/cluster/scheduler',
  };

  config.security = {
    csrf: {
      enable: false,
    },
    domainWhiteList: [ 'http://localhost:9286', 'http://127.0.0.1:9286','http://192.168.113.221:9286' ],
  };

  return config;
};
