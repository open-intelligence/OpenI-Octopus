'use strict';

const Controller = require('egg').Controller;

class VCController extends Controller {
  async get() {
    const { ctx } = this;
    ctx.success(ctx.state.vc);
  }

  async list() {
    const { ctx, service } = this;
    const vcList = await service.vc.getVcList();
    if (!vcList) {
      ctx.logger.info("Cant't find virtual cluster list");
      ctx.internalServerError().failure();
      return;
    }

    ctx.success(vcList);
  }
}

module.exports = VCController;
