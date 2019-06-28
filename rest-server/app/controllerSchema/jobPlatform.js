'use strict';

const Joi = require('joi');

module.exports = {
  createJobPlatform: Joi.object().keys({
    platformKey: Joi.string()
      .required(),
    name: Joi.string()
      .required(),
    description: Joi.string(),
    standard: Joi.object().keys({
      taskNumber: Joi.number()
        .integer()
        .default(1),
      cpuNumber: Joi.number()
        .integer()
        .default(1),
      memoryMB: Joi.number()
        .integer()
        .default(100),
      shmMB: Joi.number()
        .integer()
        .max(Joi.ref('memoryMB'))
        .default(64),
      gpuNumber: Joi.number()
        .integer()
        .default(0),
    }).required(),
  }).required(),
  listJobPlatforms: Joi.object().keys({
    platformKey: Joi.string(),
    name: Joi.string(),
  }).required(),
};
