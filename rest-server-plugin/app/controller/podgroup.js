const Controller = require('egg').Controller;

class PodgroupController extends Controller {
  async lifehook() {
    await this.ctx.service.podgroup.lifehook();
  }

  async scheduler() {
    const {ctx, service} = this;
    const {header, job} = ctx.request.body;

    let result;
    try {
      result = await service.podgroup.createPodGroupFromTaskSet(job, header);
    } catch (e) {
      ctx.logger.error(e)
      ctx.failure(e.message)
      return
    }
    ctx.simpleSuccess(result)
  }
}

module.exports = PodgroupController;