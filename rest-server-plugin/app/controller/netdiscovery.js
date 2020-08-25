const Controller = require('egg').Controller;

class NetdiscoveryController extends Controller {
  async decorator() {
    await this.ctx.service.netdiscovery.decorator();
  }

  async lifehook(){
    const { ctx, service } = this;
    const jobEvent = ctx.request.body;
    const { currentState: jobState, id: jobId, userID: userId } = jobEvent;

    this.logger.info("netdiscovery lifehook event: "+ JSON.stringify(jobEvent));
    if (jobState == "succeeded"
      || jobState == "failed"
      || jobState == "stopped") {
      try {
        await service.netdiscovery.removeJobShareHosts(jobId, userId);
      } catch (e){
        if(e){
          this.logger.error(e)
          ctx.ackLifeHookRetry()
          return
        }
      }
    }

    ctx.ackLifeHookOk()
  }
}
module.exports = NetdiscoveryController;