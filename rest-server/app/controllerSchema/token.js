'use strict';
const Joi = require('joi');

module.exports = {
  get: Joi.object().keys({
    username: Joi.string()
      .required(),
    password: Joi.string()
      .min(6)
      .required(),
    expiration: Joi.number()
      .integer()
      .min(60)
      .max(7 * 24 * 60 * 60)
      .default(2 * 60 * 60),
  }).required(),
};
