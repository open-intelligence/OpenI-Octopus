'use strict';

const Controller = require('egg').Controller;

class CommonController extends Controller {
  async getCommonTypeItems() {
    const { ctx, service } = this;
    const { typeKey } = ctx.query;

    const items = await service.common.getCommonTypeItems(typeKey);
    ctx.success(items);
  }

  async createCommonTypeItem() {
    const { ctx, service } = this;
    const { itemKey, itemValue, itemName, typeKey, description } = ctx.request.body;

    const commonItem = await service.common.createCommonTypeItem(typeKey, { itemKey, itemValue, itemName, description });

    ctx.success(commonItem);
  }

  async createCommonType() {
    const { ctx, service } = this;
    const { typeName, typeKey, description } = ctx.request.body;
    const commonType = await service.common.createCommonType({ typeName, typeKey, description });
    ctx.success(commonType);
  }
}

module.exports = CommonController;
