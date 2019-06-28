'use strict';
const _ = require('lodash');
const Service = require('egg').Service;
const marked = require('marked');
// const LError = require('../error/proto');
// const ECode = require('../error/code');
// const utils = require('../../util');

class DataSetService extends Service {
  constructor(...args) {
    super(...args);
    this.dataSetModel = this.app.model.DataSet;
  }

  async getDataSetList(condition) {
    const filter = condition;
    const dataSets = await this.dataSetModel.findAll({
      raw: true,
      where: filter,
    });
    const setMap = {};
    if (_.isEmpty(dataSets)) {
      return setMap;
    }

    for (const dataSet of dataSets) {
      dataSet.description = marked(dataSet.description);
      setMap[dataSet.id] = dataSet;
    }
    return setMap;
  }

}

module.exports = DataSetService;
