'use strict';

const LError = require('../error/proto');
const ECode = require('../error/code');
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

    let jobList = [];

    try {

      jobList = await service.k8sJobService.getFrameworkList(query);

    } catch (e) {
      throw new LError(ECode.NOT_FOUND, e.message);
    }
    ctx.success(jobList);
  }

  async stop() {
    const { ctx, service } = this;
    const { user, job } = ctx.state;
    const params = Object.assign({}, ctx.request.body, user);

    await service.k8sJobService.stopFramework(job.name, params);

    ctx.success();
  }

  async excute() {

    const { ctx, service } = this;

    const { user: { username, admin: isAdmin, orgId } } = ctx.state;

    const job = ctx.request.body;

    if (!isAdmin) {

      const whiteList = await service.user.loadCheckWhiteList();

      if (whiteList.indexOf(username) == -1) {

        await service.k8sJobService.resourceLimitCheck(job, username);

      }

    }

    await service.k8sJobService.runFramework({user:username,org_id:orgId}, job);

    ctx.success({}, `update job ${job.jobName} successfully`);
  }

  async getConfig() {
    const { ctx, service } = this;
    const { job } = ctx.state;
    const result = await service.k8sJobService.getFrameworkConfig( job.name);
    if (null == result){
      throw new LError(ECode.NOT_FOUND,"config for "+job.name+" not found");
    }
    ctx.success(result);
  }

  async getCheckLimit() {
    const { ctx, service } = this;
    const { user } = ctx.state;
    const limiter = { enabledLimiter: true };
    if (user.admin) {
      limiter.enabledLimiter = false;
      return ctx.success(limiter);
    }
    const whiteList = await service.user.loadCheckWhiteList();

    if (whiteList.indexOf(user.username) > -1) {
      limiter.enabledLimiter = false;
      return ctx.success(limiter);
    }

    const result = await service.k8sJobService.getCheckLimit({ userName: user.username });


    const query = {};

    if (ctx.state.user.admin === false) {
        query.username = ctx.state.user.username;
    }

    let jobList = [];

    try {
        jobList = await service.k8sJobService.getFrameworkResourceList(query);

    } catch (e) {
        throw new LError(ECode.NOT_FOUND, e.message);
    }

    result.jobInfoList = jobList || [];
    ctx.success(Object.assign(limiter, result));
  }



  async commitImage(){

      const { ctx, service } = this;
      const { job,user } = ctx.state;
      const imageInfo = ctx.request.body;

      let gpuType = job.config.gpuType;

      if(gpuType!=="debug")
      {
          throw new LError(ECode.FAILURE, "only debug-type job can commit image");
          return;
      }

      let containerId = imageInfo.taskContainerId;

      let result = {};

      try {
          let imageSizeInfo = await service.dockerCommitService.queryImageSize(imageInfo.ip,containerId);

          if(imageSizeInfo&&imageSizeInfo.success){
              if(imageSizeInfo.size > this.config.docker.maxImageSize){
                  throw new LError(ECode.OVER_MAX_SIZE, "over max image size 20GB");
              }
          }else{
              throw new LError(ECode.FAILURE, "can not query image size");
          }

          let imageStatusInfo = await service.dockerCommitService.queryImageStatus(containerId);

          if(imageStatusInfo && imageStatusInfo.success)
          {
              if(imageStatusInfo.commit.status !== "SUCCEEDED" &&
                  imageStatusInfo.commit.status !== "FAILED"){

                  ctx.success({success:true,msg:"commit task is processing!"});

                  return;
              }
          }

          result = await service.dockerCommitService.commitImage(
              user.username,
              imageInfo.ip,
              containerId,
              imageInfo.imageDescription);

          if(result && !result.success){
              throw new LError(ECode.FAILURE, result.msg);
          }

      } catch (e) {
          throw new LError(ECode.FAILURE, e.message);
      }
      ctx.success(result);
  }

  async queryImageStatus() {
      const {ctx, service} = this;
      const { job } = ctx.state;

      let gpuType = job.config.gpuType;

      if(gpuType!=="debug")
      {
          throw new LError(ECode.FAILURE, "only query debug-type job image status");
          return;
      }

      const imageInfo = ctx.request.query;

      let result = {};

      let containerId = imageInfo.taskContainerId;

      try {
          result = await service.dockerCommitService.queryImageStatus(containerId);

      } catch (e) {
          throw new LError(ECode.FAILURE, e.message);
      }

      ctx.success(result);
  }
}

module.exports = JobController;
