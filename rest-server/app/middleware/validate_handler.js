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
