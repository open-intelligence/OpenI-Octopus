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
const xTemplate = require('art-template');
const CryptoUtil = require('../../util/crypto.js');
const JobUtil = require('../../util/job.js');
const Controller = require('egg').Controller;

class JobController extends Controller {

  async get() {
    const { ctx } = this;
    const { job } = ctx.state;
    ctx.success(job);
  }

  async list() {
    const { ctx, service } = this;
    const query = {};

    if (ctx.state.user.admin === false) {
      query.username = ctx.state.user.username;
    }
    const jobList = await service.job.getJobList(query);
    ctx.success(jobList);
  }

  async remove() {
    const { ctx, service } = this;
    const { user, job } = ctx.state;
    const params = Object.assign({}, ctx.request.body, user);

    await service.job.deleteJob(job.name, params);
    ctx.success();
  }

  async execute() {
    const { ctx, service } = this;
    const { user, job } = ctx.state;
    const params = Object.assign({}, ctx.request.body, user);

    await service.job.putJobExecutionType(job.name, params);
    ctx.success();
  }

  async update() {
    const { ctx, service } = this;
    const { user, job } = ctx.state;
    if (job.taskRoles) {
      await service.job.checkMinTaskNumber(job);
    }

    const name = job.name;
    const data = ctx.request.body;
    data.originalData = ctx.state.originalBody;
    data.userName = user.username;

    const jobLimitDb = JobUtil.getJobLimitConfig(this.config.jobLimit);
    const numJson = JobUtil.severalNum(data);
    const isResOver = JobUtil.ifOverLimit(numJson, jobLimitDb);
    const isUserLimit = JobUtil.isUserInLimitList(jobLimitDb, ctx.request.req);
    this.logger.info('[update Job]: does user in limit list? %d', isUserLimit);
    // Limit all users when islimit is true. Limit single user when islimit is false and username in limit list.
    if (jobLimitDb.get('islimit').value() === true || isUserLimit) {
      if (isResOver !== 'OK') {
        return ctx.notImplemented().failure(isResOver, isResOver);
      }
    }

    await service.job.putJob(name, data);
    ctx.success({}, `update job ${name} successfully`);
  }

  async getConfig() {
    const { ctx, service } = this;
    const { job } = ctx.state;
    const result = await service.job.getJobConfig(job.jobStatus.username, job.name);
    ctx.success(result);
  }

  async getSshInfo() {
    const { ctx, service } = this;
    const { job } = ctx.state;
    const result = await service.job.getJobSshInfo(
      job.jobStatus.username,
      job.name,
      job.jobStatus.appId);
    ctx.success(result);
  }

  async getSshFile() {
    const { ctx, service } = this;
    const { job } = ctx.state;
    let ext = ctx.query.e;
    const isWin = ext === 'bat';
    ext = isWin ? 'bat' : 'sh';
    const result = await service.job.getJobSshInfo(job.jobStatus.username, job.name, job.jobStatus.appId);

    const sshAuthScript = xTemplate(path.resolve(__dirname + `/../tpl/jobContainerSsh2${ext}.tpl`), {
      privateKeyFileName: result.keyPair.privateKeyFileName,
      privateKey: CryptoUtil.formatPrivateKey(result.keyPair.privateKey, isWin),
      sshIp: result.containers[0].sshIp,
      sshPort: result.containers[0].sshPort,
    });
    // Content-Disposition: attachment; filename="logo.png"
    // Content-Type: image/png
    ctx.set('Content-Disposition', 'attachment; filename="' + result.keyPair.privateKeyFileName + (isWin ? ext : '') + '"');
    ctx.set('Content-Type', 'application/octet-stream');
    ctx.body = sshAuthScript;
  }
}

module.exports = JobController;
