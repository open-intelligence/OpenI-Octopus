'use strict';

const Joi = require('joi');

const jobConfigSchema = Joi.object().keys({
  jobName: Joi.string()
    .regex(/^[a-z0-9]{1,36}$/)
    .required(),
  image: Joi.string()
    .required(),
  authFile: Joi.string()
    .allow('')
    .default(''),
  dataDir: Joi.string()
    .allow('')
    .default(''),
  outputDir: Joi.string()
    .allow('')
    .default(''),
  codeDir: Joi.string()
    .allow('')
    .default(''),
  taskRoles: Joi.array()
    .items(Joi.object().keys({
      name: Joi.string()
        .regex(/^[a-z0-9]{1,30}$/)
        .required(),
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
      portList: Joi.array()
        .items(Joi.object().keys({
          label: Joi.string()
            .regex(/^[A-Za-z0-9._~]+$/)
            .required(),
          beginAt: Joi.number()
            .integer()
            .default(0),
          portNumber: Joi.number()
            .integer()
            .default(1),
        }))
        .optional()
        .default([]),
      command: Joi.string()
        .required(),
      minFailedTaskCount: Joi.number()
        .integer()
        .min(1)
        .max(Joi.ref('taskNumber'))
        .allow(null)
        .default(1),
      minSucceededTaskCount: Joi.number()
        .integer()
        .min(1)
        .max(Joi.ref('taskNumber'))
        .allow(null)
        .default(null),
    }))
    .min(1)
    .required(),
  gpuType: Joi.string()
    .allow('')
    .default(''),
  killAllOnCompletedTaskNumber: Joi.number()
    .integer()
    .optional(),
  virtualCluster: Joi.string()
    .allow('')
    .default('default'),
  retryCount: Joi.number()
    .integer()
    .min(-2)
    .max(10)
    .default(0),
}).required();

const jobExecutionSchema = Joi.object().keys({
  value: Joi.string().allow('START', 'STOP').required(),
}).required();


module.exports = {
  update: jobConfigSchema,
  execute: jobExecutionSchema,
};
