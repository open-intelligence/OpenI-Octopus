'use strict';

const Controller = require('egg').Controller;


class JobPlatformController extends Controller {
  async listJobPlatforms() {
    const { ctx, service } = this;
    const condition = ctx.query;

    const jobPlatforms = await service.jobPlatform.listJobPlatforms(condition);
    ctx.success(jobPlatforms);
  }

  async createJobPlatform() {
    const { ctx, service } = this;
    const { platformKey, name, standard, description } = ctx.request.body;

    const jobPlatform = await service.jobPlatform.createJobPlatform({ platformKey, name, standard, description });
    ctx.success(jobPlatform);
  }

  async listJobPlatformWithImageSets() {
    const { ctx, service } = this;
      const { user } = ctx.state;
    const jobPlatform = await service.jobPlatform.listJobPlatformWithImageSets(user);
    ctx.success(jobPlatform);
  }
}

module.exports = JobPlatformController;
