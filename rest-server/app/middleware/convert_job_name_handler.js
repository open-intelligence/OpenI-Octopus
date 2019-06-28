'use strict';

// const LError = require('../error/proto');
// const ECode = require('../error/code');

module.exports = () => {
  return async function(...args) {
    const _arg = [].concat(args);
    const next = _arg.pop();
    const ctx = _arg.pop();
    const { service } = ctx;
    const jobName = ctx.params.jobName || ctx.request.body.jobName;
    let job;
    try {
      job = await service.k8sJobService.getFramework(jobName);
    } catch (e) {
      ctx.logger.error('job middleware error:', e);
    }
    if (job) {
      ctx.state.job = job;
    } else {
      ctx.state.job = { name: jobName };
    }

    await next();
  };
};