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
const path = require('path');
const Joi = require('joi');
const LError = require('../error/proto');
const ECode = require('../error/code');

module.exports = (options, app) => {
  loadSchema(app, options);
  return async function validateHandler(ctx, next) {
    const requestSchema = ctx.requestSchema;
    if (!requestSchema) {
      return await next();
    }
    const originalData = ctx.requestData;
    const data = Object.assign({}, originalData);
    const result = Joi.validate(data, requestSchema);
    if (result.error) {
      throw new LError(ECode.INVALID_PARAM, result.error);
    }
    ctx.state.originalBody = originalData;
    ctx.requestData = result.value;
    await next();
  };
};

function loadSchema(app, options) {
  const directory = path.join(app.config.baseDir, 'app/controllerSchema');
  app.loader.loadToApp(directory, 'controllerSchema', options);
  return app.controllerSchema;
}
