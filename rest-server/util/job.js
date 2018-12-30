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
const fse = require('fs-extra');
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');

const getJobLimitConfig = filepath => {
  try {
    fse.ensureDirSync(path.dirname(filepath));
    const adapter = new FileSync(filepath);
    const jobdb = low(adapter);
    return jobdb;
  } catch (err) {
    console.info('Load /var/pai/rest-server/joblimit.json Error');
  }
  return null;
};


const taskRolesNum = jobConfig => {
  return Object.getOwnPropertyNames(jobConfig.taskRoles).length;
};


const severalNum = jobConfig => {
  const rolesNum = taskRolesNum(jobConfig);
  let cpuNum = 0;
  let gpuNum = 0;
  let mem = 0;
  let taskNum = 0;
  for (let i = 0; i < rolesNum - 1; ++i) {
    cpuNum += parseInt(jobConfig.taskRoles[i].cpuNumber) * parseInt(jobConfig.taskRoles[i].taskNumber);
    gpuNum += parseInt(jobConfig.taskRoles[i].gpuNumber) * parseInt(jobConfig.taskRoles[i].taskNumber);
    mem += parseInt(jobConfig.taskRoles[i].memoryMB) * parseInt(jobConfig.taskRoles[i].taskNumber);
    taskNum += parseInt(jobConfig.taskRoles[i].taskNumber);
  }
  const numJson = {
    tasknum: taskNum,
    cpuNum,
    gpuNum,
    mem,
  };
  return numJson;
};


const isUserInLimitList = (jobDb, req) => {
  if (jobDb.get('username').value() === undefined) {
    console.warn('Config File /var/pai/rest-server/joblimit.json has no username item!!!');
    return false;
  } else if (jobDb.get('username').value().indexOf(req.cookies.email) !== -1) {
    return true;
  }
  return false;

};


const ifOverLimit = (numJson, jobDb) => {
  // if jobDb is empty, all if statement will be true. So it has no need to determine if jobDb has"tasknum", "cpunum"…
  const taskNumLimit = parseInt(jobDb.get('tasknum').value());
  const cpuLimit = parseInt(jobDb.get('cpunum').value());
  const memLimit = parseInt(jobDb.get('mem').value());
  const gpuLimit = parseInt(jobDb.get('gpunum').value());

  if (parseInt(numJson.taskNum) > taskNumLimit) {
    const taskNumString = 'Over limited, most Task number is ' + taskNumLimit;
    return taskNumString;
  } else if ((parseInt(numJson.cpuNum)) > cpuLimit) {
    const cpuString = 'Over limited, most CPU number is ' + cpuLimit;
    return cpuString;
  } else if (parseInt(numJson.mem) > memLimit) {
    const memString = 'Over limited, most Mem is ' + memLimit;
    return memString;
  } else if (parseInt(numJson.gpuNum) > gpuLimit) {
    const gpuString = 'Over limited, most GPU number is ' + gpuLimit;
    return gpuString;
  }
  return 'OK';

};

module.exports = {
  getJobLimitConfig, taskRolesNum, severalNum, isUserInLimitList, ifOverLimit,
};
