'use strict';

const Joi = require('joi');

module.exports = {
  addOrganization: Joi.object().keys({
    name: Joi.string().required(),
    description: Joi.string(),
    pid: Joi.string(),
    typ: Joi.string(),
  }).required(),
};
