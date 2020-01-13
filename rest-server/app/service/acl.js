'use strict';

const Service = require('egg').Service;
const { ECode, LError } = require('../../lib');

class AclService extends Service {

  async loadUserWhileList(username) {
    const user = await this.service.user.getUserInfoByIdOrUserName(username);
    if (!user) {
      throw new LError(ECode.NOT_FOUND, 'user is not found');
    }
    if (user.admin) {
      throw new LError(ECode.OPERATION_FORBIDDEN, 'user id admin account');
    }
    const whiteList = await this.service.user.loadCheckWhiteList();
    return whiteList;
  }

  async addUserWhiteList(username) {
    const whiteList = await this.loadUserWhileList(username);
    if (whiteList.indexOf(username) > -1) {
      return;
    }
    whiteList.push(username);
    whiteList.sort();
    await this.service.common.setItem(this.app.config.commonKeys.jobConfig.whiteListKey, whiteList.join());
  }

  async removeUserWhiteList(username) {
    const whiteList = await this.loadUserWhileList(username);
    const userIndex = whiteList.indexOf(username);
    if (userIndex < 0) {
      return;
    }
    whiteList.splice(userIndex, 1);
    await this.service.common.setItem(this.app.config.commonKeys.jobConfig.whiteListKey, whiteList.join());
  }
}

module.exports = AclService;
