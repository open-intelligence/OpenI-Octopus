'use strict';

const Joi = require('joi');

module.exports = {
  getCommonTypeItems: Joi.object().keys({
    typeKey: Joi.string()
      .required(),
  }).required(),
  createCommonType: Joi.object().keys({
    typeName: Joi.string()
      .required(),
    typeKey: Joi.string()
      .required(),
    description: Joi.string(),
  }).required(),
  createCommonTypeItem: Joi.object().keys({
    itemKey: Joi.string()
      .required(),
    itemValue: Joi.string()
      .required(),
    itemName: Joi.string()
      .required(),
    typeKey: Joi.string()
      .required(),
    description: Joi.string(),
  }).required(),
};
