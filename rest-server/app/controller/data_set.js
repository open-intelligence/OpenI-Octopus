'use strict';

const Controller = require('egg').Controller;

class DataSetController extends Controller {
  async list() {
    const { ctx, service } = this;
    const dataSets = await service.dataSet.getDataSetList({});
    ctx.success(dataSets);
  }
}

module.exports = DataSetController;
