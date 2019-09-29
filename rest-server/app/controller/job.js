'use strict';

const LError = require('../error/proto');
const ECode = require('../error/code');
const job_utils = require('../utils/job');
const Controller = require('egg').Controller;

class JobController extends Controller {

  async get() {

    const { ctx, service } = this;

    const jobId = ctx.params.jobId || ctx.request.body.jobId;

    const {user:{admin,user_id,username}} = ctx.state;

    let job = null;

    if (admin === true) {

      job = await service.v1JobService.getFramework(jobId);

    } else {

      job = await service.v1JobService.getFramework(jobId, user_id);
    }

    if(null != job){

      job.jobStatus.username  = username ||  job.jobStatus.username ;

    }

    ctx.success(job);

  }

  async list() {

    const { ctx, service } = this;

    const {user:{admin,user_id}} = ctx.state;

    let {size,offset,job_name,username,job_state,created_at} = ctx.query;
    
    size = parseInt(size);

    offset = parseInt(offset);

    if(isNaN(size)){
      size = 20;
    }
    if(isNaN(offset)){
      offset = 0;
    }

    let rsp = {
        total_size:0,
        jobs:[]
    };

    let condition = {};

    if(job_name){
      condition.job_name = { $like: `${job_name}%` };
    }

    if(created_at){
      condition.created_at = { $gte: created_at };
    }

    if (job_state){
      condition.job_state = job_state;
    }

    if (admin !== true) {

      condition.user_id = user_id;

    } else if(username){
      
      condition.user_id = {$like:`${username}%`};
    }

    rsp = await service.v1JobService.getFrameworkList(condition,size,offset);


    ctx.success(rsp);
  }

  async stop() {

    const { ctx, service } = this;

    const {user:{admin,user_id}} = ctx.state;

    const jobId = ctx.params.jobId || ctx.request.body.jobId;


    if (admin === true) {

      await service.v1JobService.stopFramework(jobId);

    } else {

      await service.v1JobService.stopFramework(jobId, user_id);

    }

    ctx.success();
  }

  async _checkPrivilege(is_admin, username, job_config) {

    if (is_admin === true) {
      return;
    }

    const whiteList = await this.service.user.loadCheckWhiteList();

    // in whitelist
    if (whiteList.indexOf(username) !== -1) {
      return;
    }

    const job_default_limits = await this.service.common.getItem(this.app.config.commonKeys.jobConfig.limitKey);

    const job_resource = job_utils.computeJobResource(job_config, job_default_limits);

    const errors = job_utils.checkJobResourceLimit(job_resource, job_default_limits) || [];

    if (errors.length > 0) {
      throw new LError(ECode.INVALID_PARAM, `${errors.join(',')}`);
    }

  }

  async excute() {

    const { ctx, service } = this;

    const { user: { username, admin: isAdmin, org_id,user_id } } = ctx.state;

    const job_config = ctx.request.body;

    await this._checkPrivilege(isAdmin, username, job_config);

    await service.v1JobService.runFramework({username:username, user_id: user_id, org_id }, job_config);

    ctx.success({}, `update job ${job_config.jobName} successfully`);
  }

  async getConfig() {

    const { ctx, service } = this;

    const { user: { user_id, admin } } = ctx.state;

    const jobId = ctx.params.jobId || ctx.request.body.jobId;

    let result = null;

    if (admin === true) {
      result = await service.v1JobService.getFrameworkConfig(jobId);

    } else {

      result = await service.v1JobService.getFrameworkConfig(jobId, user_id);
    }

    if (result == null) {
      throw new LError(ECode.NOT_FOUND, 'config for ' + jobId + ' not found');
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

    let inWhiteList = false;

    const whiteList = await this.service.user.loadCheckWhiteList();

    inWhiteList = whiteList.indexOf(user.username) !== -1;

    if(inWhiteList === true){

      limiter.enabledLimiter = false;
      return ctx.success(limiter);
    }

    const job_default_limits = await service.common.getItem(this.app.config.commonKeys.jobConfig.limitKey);

    const result =  job_default_limits || {};

    const query = {};

    if (ctx.state.user.admin === false) {
        query.user_id = ctx.state.user.user_id;
    }

    const jobList = await service.v1JobService.getWaitingAndRunningFrameworks(query.user_id);

    result.jobInfoList = jobList || [];

    ctx.success(Object.assign(limiter, result));
  }

  async commitImage() {

    const { ctx, service } = this;

    const { user: { user_id,username, admin } } = ctx.state;

    const jobId = ctx.params.jobId || ctx.request.body.jobId;

    let job_config = null;

    if (admin === true) {

      job_config = await service.v1JobService.getFrameworkConfig(jobId);

    } else {

      job_config = await service.v1JobService.getFrameworkConfig(jobId, user_id);

    }

    if (job_config === null) {
      throw new LError(ECode.NOT_FOUND, 'config for ' + jobId + ' not found');
    }

    const imageInfo = ctx.request.body;

    const gpuType = job_config.gpuType;

    if (gpuType !== 'debug') {
      throw new LError(ECode.FAILURE, 'only debug-type job can commit image');
    }

    const containerId = imageInfo.taskContainerId;

    let result = {};

    try {
      const imageSizeInfo = await service.dockerCommitService.queryImageSize(imageInfo.ip, containerId);

      if (imageSizeInfo && imageSizeInfo.success) {
        if (imageSizeInfo.size > this.config.docker.maxImageSize) {
          throw new LError(ECode.OVER_MAX_SIZE, 'over max image size 20GB');
        }
      } else {
        throw new LError(ECode.FAILURE, 'can not query image size');
      }

      const imageStatusInfo = await service.dockerCommitService.queryImageStatus(containerId);

      if (imageStatusInfo && imageStatusInfo.success) {
        if (imageStatusInfo.commit.status !== 'SUCCEEDED' &&
                imageStatusInfo.commit.status !== 'FAILED') {

          ctx.success({ success: true, msg: 'commit task is processing!' });

          return;
        }
      }

      result = await service.dockerCommitService.commitContainer(
        username,
        imageInfo.ip,
        containerId,
        imageInfo.imageDescription);

      if (result && !result.success) {
        throw new LError(ECode.FAILURE, result.msg);
      }

    } catch (e) {
      throw new LError(ECode.FAILURE, e.message);
    }
    ctx.success(result);

  }

  async getSummaryStatus(){
    const { ctx, service } = this;
    const { user: {user_id, admin } } = ctx.state;
    let queryParams = {};
    if(admin !== true){
      queryParams.user_id = user_id;
    }
    const frameworkStatus = await service.v1JobService.getSummaryFrameworkStatus(queryParams);
    ctx.success(frameworkStatus);
  }

  async queryImageStatus() {

    const { ctx, service } = this;

    const { user: {user_id, admin } } = ctx.state;

    const jobId = ctx.params.jobId || ctx.request.body.jobId;

    let job_config = null;

    if (admin === true) {

      job_config = await service.v1JobService.getFrameworkConfig(jobId);

    } else {

      job_config = await service.v1JobService.getFrameworkConfig(jobId, user_id);

    }

    if (job_config === null) {
      throw new LError(ECode.NOT_FOUND, 'config for ' + jobId + ' not found');
    }

    const gpuType = job_config.gpuType;

    if (gpuType !== 'debug') {
      throw new LError(ECode.FAILURE, 'only query debug-type job image status');
    }

    const imageInfo = ctx.request.query;

    let result = {};

    const containerId = imageInfo.taskContainerId;

    try {
      result = await service.dockerCommitService.queryImageStatus(containerId);

    } catch (e) {
      throw new LError(ECode.FAILURE, e.message);
    }

    ctx.success(result);
  }

}

module.exports = JobController;
