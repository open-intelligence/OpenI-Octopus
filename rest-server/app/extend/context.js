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

const ECode = require('../error/code');

module.exports = {
  success(payload, message = 'success', code) {
    const ctx = this;

    ctx.body = {
      code: code || ECode.SUCCESS.code,
      message,
      payload,
    };
  },
  failure(code, message = '', payload) {
    const ctx = this;

    code = code || ECode.FAILURE.code;
    code = "object" == typeof code ? code.code : code;
    ctx.body = {
      code,
      message,
      payload,
    };
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
