'use strict';

const ECode = require('../error/code');
const LError = require('../error/proto');

module.exports = {
  success(payload, message = 'success', code) {
    const ctx = this;

    ctx.body = {
      code: code || ECode.SUCCESS.code,
      msg: message,
      payload,
    };
  },
  failure(code, message = '', payload) {
    const ctx = this;

    let body = {};
    if (code instanceof LError) {
      body = Object.assign(body, code.toJson());
    } else {
      body.code = code || ECode.FAILURE.code;
    }

    if (message) {
      body.msg = message;
    }
    if (payload) {
      body.payload = payload;
    }
    code = code || ECode.FAILURE.code;
    body.code = typeof body.code === 'object' ? body.code.code : body.code;
    ctx.body = body;
  },
  forbidden() {
    const ctx = this;
    ctx.status = 403;
    return ctx;
  },
  unauthorized() {
    const ctx = this;
    ctx.status = 401;
    return ctx;
  },
  created() {
    const ctx = this;
    ctx.status = 201;
    return ctx;
  },
  temporarilyMoved() {
    const ctx = this;
    ctx.status = 302;
    return ctx;
  },
  internalServerError() {
    const ctx = this;
    ctx.status = 500;
    return ctx;
  },
  notImplemented() {
    const ctx = this;
    ctx.status = 501;
    return ctx;
  },
  get requestData() {
    const ctx = this;
    const method = ctx.method.toLocaleUpperCase();
    switch (method) {
      case 'GET':
      case 'DELETE':
        return ctx.query;
      case 'POST':
      case 'PUT':
        return ctx.request.body;
      default:
        return;
    }
  },
  set requestData(data) {
    const ctx = this;
    const method = ctx.method.toLocaleUpperCase();
    switch (method) {
      case 'GET':
      case 'DELETE':
        ctx.query = data || {};
        break;
      case 'POST':
      case 'PUT':
        ctx.request.body = data || {};
        break;
      default:
        break;
    }
  },
  get requestSchema() {
    const ctx = this;
    const { routesMap, controllerSchema: Schema } = ctx.app;
    const { path: pathName, method: methodName } = ctx;
    let routeDirs = [ methodName.toLocaleUpperCase() ].concat(pathName.split('/'));
    routeDirs = routeDirs.filter(p => !!p);

    let
      currentMap = routesMap;
    for (const dir of routeDirs) {
      if (!currentMap[dir]) {
        if (currentMap.__param__) {
          currentMap = currentMap.__param__;
          continue;
        }
        return;
      }
      currentMap = currentMap[dir];
    }

    const controllerPath = currentMap.__controller__;
    if (!controllerPath) {
      return;
    }

    const controllerItems = controllerPath.split('.');
    let controllerSchema = Schema;
    for (let i = 0; i < controllerItems.length; i++) {
      if (controllerSchema && controllerSchema[controllerItems[i]]) {
        controllerSchema = controllerSchema[controllerItems[i]];
      } else {
        controllerSchema = null;
      }
    }
    return controllerSchema;
  },
};
