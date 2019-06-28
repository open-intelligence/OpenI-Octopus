'use strict';

const Controller = require('egg').Controller;


class ServicesController extends Controller {
  async get() {
    const { ctx, service } = this;
    const nodes = await service.k8sServices.getNodes();

    const namespace = 'default';

    const pods = await service.k8sServices.getPods(namespace);

    const services = { nodes, pods };

    ctx.success(services);
  }
}

module.exports = ServicesController;
