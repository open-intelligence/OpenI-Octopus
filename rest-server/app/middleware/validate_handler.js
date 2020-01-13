'use strict';
const path = require('path');
const Joi = require('joi');
const { ECode, LError } = require('../../lib');

const defaultOptions = {
  override: true,
};

module.exports = (options, app) => {
  loadSchema(app, Object.assign(defaultOptions, options));
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
  const directorys = app.loader
    .getLoadUnitsWithoutPlugins()
    .map(unit => path.join(unit.path, 'app/controllerSchema'));
  app.loader.loadToApp(directorys, 'controllerSchema', options);
  return app.controllerSchema;
}
