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

  config.clusterId = 'openi-pcl';
  config.natFile = 'rest-server/natconfig.json';
  config.userDbFile = 'rest-server/user_db.json';
  config.jobLimit = 'rest-server/joblimit.json';
  config.virtualDebugClusters = ['default'];

  const launcherConfig = config.launcherConfig = {
    hdfsUri: 'hdfs://192.168.113.221:9000',
    webhdfsUri: 'http://192.168.113.221:50070',
    webserviceUri: 'http://192.168.113.221:9086',
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
    yarnUri: 'http://192.168.113.221:8088',
    webserviceRequestHeaders: {
      Accept: 'application/json',
    },
    yarnVcInfoPath: 'http://192.168.113.221:8088/ws/v1/cluster/scheduler',
  };

  config.security = {
    csrf: {
      enable: false,
    },
    domainWhiteList: [ 'http://localhost:9286', 'http://127.0.0.1:9286' ],
  };

  return config;
};
