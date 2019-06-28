'use strict';
const LError = require('../error/proto');
const ECode = require('../error/code');

module.exports = () => {

  return async function(vcName, ctx, next) {
    const { service } = ctx;
    const vcList = await service.vc.getVcList();
    if (!(vcName in vcList)) {

      throw new LError(ECode.NOT_FOUND, `Virtual cluster ${vcName}.`);
    }
    const vc = ctx.state.vc = {};
    for (const key of Object.keys(vcList[vcName])) {
      vc[key] = vcList[vcName][key];
    }
    await next();
  };
};
