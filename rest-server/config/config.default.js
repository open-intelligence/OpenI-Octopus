'use strict';
const path = require('path');
const LError = require('../app/error/proto');
const ECode = require('../app/error/code');
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
    secret: process.env.JWT_SECRET || 'Hello OPENI PCL!',
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
    logging: () => {},
    define: {
      charset: 'utf8',
      collate: 'utf8_general_ci',
      freezeTableName: false,
      underscored: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  };

  config.commonKeys = {
    jobConfig: {
      limitKey: 'JOB_CONFIG_TYPE.LIMITS',
      whiteListKey: 'JOB_CONFIG_TYPE.LIMIT_WHITE_LIST',
    },
  };

  config.static = {
    prefix: '/public/',
    dir: [ path.join(appInfo.baseDir, 'app/public') ],
    // support lazy load
    dynamic: true,
    preload: false,
    buffer: false,
    maxFiles: 1000,
  };

  if(process.env.ENABLED_API_DOC === "YES"){
    config.static.dir.push(path.join(appInfo.baseDir, 'app/apidoc'));
  }

  config.proxyDB = {
    fileDB: {
      filePath: path.join(__dirname, '../rest-server'),
      fileName: 'proxy_db.json',
    },
  };

  config.jobConfigDB = {
    debugJobDurationMsec:  2 * 60 * 60 * 1000,
    fileDB: {
      filePath: path.join(__dirname, '../rest-server'),
      fileName: 'config_db.json',
    },
  };

  config.jobTypes = {
    gpuTypeMap: { dgx: true, debug: true },
    cpuTypeMap: { debug_cpu: true },
  };


  // define the order of middleware and options,
  const middlewareConfig = {
    middleware: [ 'validateHandler', 'jwtHandler', 'compressHandler', 'checkUserStatus', 'checkUserIsAdmin', 'notfoundHandler' ],
    jwtHandler: {
      secret: config.jwt.secret,
      ignore: [ '/public','/api/v1/token', '/api/v2/token', '/api/v2/user/register', '/api/v2/user/existed', '/api/v1/third/oauth' ],
    },
    compressHandler: {
      threshold: 2048,
    },
    checkUserIsAdmin: {
      match: /^\/api\/v1\/(acl|hardwares|services)/,
    },
  };


  config.onerror = {
    accepts(ctx) {
      if (ctx.acceptJSON) return 'json';
      if (ctx.acceptJSONP) return 'js';
      return 'json';
    },
    all: (err, ctx) => {
      ctx.set('Content-Type', 'application/json');
      if (err && typeof err.toJson === 'function') {
        ctx.status = 200;
        ctx.body = err.toJson();
      } else if (ctx.status === 401) {
        ctx.body = new LError(ECode.ACCESS_DENIED, 'Invalid token').toJson();
      } else {
        ctx.status = 500;
        const msg = err ? (err.message || err) : 'Unknown Error';
        ctx.body = (new LError(ECode.INTERNAL_ERROR, msg)).toJson();
      }
    },
  };

  Object.assign(config, middlewareConfig);

  return config;
};
