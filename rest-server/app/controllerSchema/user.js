'use strict';

const Joi = require('joi');

module.exports = {
  updatePassword: Joi.object().keys({
    username: Joi.string().token().required(),
    oldPassword: Joi.string().min(6).required(),
    newPassword: Joi.string().min(6).required(),
  }).required(),

  update: Joi.object().keys({
    username: Joi.string().regex(/^([a-zA-Z_])([a-zA-Z0-9_])+$/).min(6)
      .required(),
    password: Joi.string().min(6).required(),
  }).required(),

  remove: Joi.object().keys({
    username: Joi.string()
      .token()
      .required(),
  }).required(),

  updateUserVc: Joi.object().keys({
    virtualClusters: Joi.string()
      .allow('')
      .regex(/^[A-Za-z0-9_,]+$/)
      .optional(),
  }).required(),

  getUserList: Joi.object().keys({
    inw: Joi.string().allow('0', '1'),
    ps: Joi.number().min(1)
      .max(100),
    pi: Joi.number().min(1),
    search: Joi.string().allow('').required(),
  }).required(),

  updateUserInfo: Joi.object().keys({
    email: Joi.string().regex(/^[_a-z0-9-]+(\.[_a-z0-9-]+)*@[a-z0-9-]+(\.[a-z0-9-]+)*(\.[a-z]{2,})$/),
    fullName: Joi.string(),
    orgId: Joi.string(),
    teacher: Joi.string(),
    phone: Joi.string().regex(/^((\+\d{2}-)?(\d{2,3}-)?([1][3,4,5,7,8][0-9]\d{8}))$/),
  }).required(),
};
