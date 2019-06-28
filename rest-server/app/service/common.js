'use strict';

const Service = require('egg').Service;
const LError = require('../error/proto');
const ECode = require('../error/code');
const utils = require('../../util');

class CommonService extends Service {
  constructor(...args) {
    super(...args);
    this.commonTypeModel = this.app.model.CommonType;
    this.commonItemModel = this.app.model.CommonItem;
  }

  getKeys(key) {
    const keys = key.split('.');
    const typeKey = keys.shift();
    const itemKey = keys.join();
    return [ typeKey, itemKey ];
  }

  async getItem(key) {
    const keys = this.getKeys(key);
    const commonItem = await this.getCommonItem.apply(this, keys);
    if (!commonItem) {
      return;
    }
    try {
      return JSON.parse(commonItem.itemValue);
    } catch (e) {
      return commonItem.itemValue;
    }
  }

  async setItem(key, val = '') {
    const keys = this.getKeys(key);
    let value = val;
    let commonItem = await this.getCommonItem.apply(this, keys);
    if (!commonItem) {
      return;
    }
    commonItem = commonItem.get ? commonItem.get() : commonItem;

    if (typeof val === 'object') {
      value = JSON.stringify(val);
    } else {
      value = val + '';
    }
    await this.commonItemModel.update({ itemValue: value }, { where: commonItem });
  }

  async getCommonItem(typeKey, itemKey) {
    if (!typeKey || !itemKey) {
      return;
    }
    const commonType = await this.commonTypeModel.findOne({
      where: { typeKey },
      include: {
        model: this.commonItemModel,
        where: { itemKey },
        attributes: [
          'id', 'itemName', 'itemKey', 'itemValue',
        ],
      },
    });

    return commonType.commonItems[0];
  }

  async getCommonTypeItems(typeKey, condition) {
    const commonType = await this.commonTypeModel.findOne({
      where: { typeKey },
      include: {
        model: this.commonItemModel,
        where: condition,
        attributes: [
          'itemName', 'itemKey', 'itemValue',
        ],
      },
    });

    return commonType.commonItems;
  }

  async createCommonType(commonType) {
    const hasType = await this.commonTypeModel.count({ typeKey: commonType.typeKey });
    if (hasType) {
      throw new LError(ECode.RESOURCE_CONFLICT, 'key already exists');
    }
    return await this.commonTypeModel.create(commonType);
  }

  async createCommonTypeItem(typeKey, commonItem) {
    const commonType = await this.commonTypeModel.findOne({
      raw: true,
      where: { typeKey },
      attributes: [ 'id', 'typeKey' ],
    });
    if (utils.isEmptyObject(commonType)) {
      throw new LError(ECode.NOT_FOUND, 'not found type');
    }
    const item = Object.assign({ typeId: commonType.id }, commonItem);
    return await this.commonItemModel.create(item);
  }

}

module.exports = CommonService;
