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
const LError = require("../app/error/proto");
const ECode = require("../app/error/code");
module.exports = appInfo => {

  const config = exports = {};
  // use for cookie sign key, should change to your own and keep security
  config.keys = appInfo.name + '_1545288328934_4914';

  config.clusterId = 'openi-pcl';
  config.cluster = {
    listen: {
      port: 9186,
    },
  };
  config.jwt = {
    secret: 'Hello OPENI PCL!',
  };

  config.security = {
    csrf: {
      ignoreJSON: true,
    },
  };

  config.sequelize = {
    dialect: 'mysql',
    database: 'restserver',
    benchmark: true,
    timezone: '+08:00',
    define: {
      freezeTableName: false,
      underscored: true,
    },
  };

  config.launcherConfig = {
    webserviceRequestHeaders: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    jobRootDir: './frameworklauncher',
    jobDirCleanUpIntervalSecond: 7200,
    jobConfigFileName: 'JobConfig.json',
    frameworkDescriptionFilename: 'FrameworkDescription.json',
  };

  // define the order of middleware and options,
  const middlewareConfig = {
    middleware: [ 'validateHandler', 'jwtHandler', 'compressHandler', 'notfoundHandler' ],
    jwtHandler: {
      secret: config.jwt.secret,
      ignore: [ '/api/v1/token' ],
    },
    compressHandler: {
      threshold: 2048,
    },
  };
  config.onerror = {
    all: (err, ctx) => {
      
      ctx.set("Content-Type","application/json");

      if (err && typeof err.toJson === 'function') {

        ctx.status = 200;
        ctx.body =  err.toJson();

      } else{
       
        ctx.status = 500;

        let msg = err ? (err.message || err) :"Unknown Error";
       
        if(err){
          ctx.logger.error(err);
        }else{
          ctx.logger.error(msg);
        }
        ctx.body =  JSON.stringify((new LError(ECode.INTERNAL_ERROR, msg)).toJson());

      }
    },
  };

  Object.assign(config, middlewareConfig);

  return config;
};
