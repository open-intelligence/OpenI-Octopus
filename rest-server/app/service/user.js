// Copyright (c) Microsoft Corporation
// All rights reserved.
//
// MIT License
//
// Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated
// documentation files (the "Software"), to deal in the Software without restriction, including without limitation
// the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and
// to permit persons to whom the Software is furnished to do so, subject to the following conditions:
// The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING
// BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
// NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

'use strict';

const Service = require('egg').Service;
const CryptoUtil = require('../../util/crypto.js');
const LError = require('../error/proto');
const ECode = require('../error/code');

class UserService extends Service {
  constructor(...args) {
    super(...args);
    this.userModel = this.app.model.User;
  }

  async check(username, password) {

    if (!username || !password) {

      throw new LError(ECode.LACK_PARAM, !username ? 'username' : 'password');

    }

    const user = await this.userModel.findOne({ where: { username }, raw: true });

    if (!user) {
      throw new LError(ECode.NOT_FOUND, username);
    }
    const passwordKey = CryptoUtil.encryptWithSalt(password, username);

    if (passwordKey !== user.passwordKey) {

      throw new LError(ECode.WRONG_PASSWORD, 'wrong password');

    }

    user.admin = !!user.admin;
    return user;
  }

  async getUserInfoByIdOrUserName(idOrUserName) {
    const condition = {};
    if (typeof idOrUserName === 'number') {
      condition.id = idOrUserName;
    } else if (typeof idOrUserName === 'string') {
      condition.username = idOrUserName;
    } else {
      return;
    }

    const user = await this.userModel.findOne({ where: condition, raw: true });
    return user;
  }

  async updatePassword(oldPassword, newPassword, condition) {
    const passwordKey = CryptoUtil.encryptWithSalt(oldPassword, condition.username);
    if (condition.passwordKey !== passwordKey) {

      throw new LError(ECode.WRONG_PASSWORD, 'Old password is wrong');

    }

    const newPasswordKey = CryptoUtil.encryptWithSalt(newPassword, condition.username),
      newItem = {
        passwordKey: newPasswordKey,
        modifyTime: new Date(),
      };

    await this.userModel.update(newItem, { where: condition });
  }

  async upsertUser(username, password, admin) {
    const derivedKey = CryptoUtil.encryptWithSalt(password, username);
    const userInfo = {
      username,
      passwordKey: derivedKey,
      admin,
      virtualCluster: 'default',
      modifyTime: new Date(),
    };

    await this.userModel.upsert(userInfo);
  }

  async removeUser(username) {
    const userInfo = await this.getUserInfoByIdOrUserName(username);

    if (!userInfo) {
      throw new LError(ECode.NOT_FOUND, 'User does not exist');
    }

    if (userInfo.admin) {
      throw new LError(ECode.OPERATION_FORBIDDEN, 'Can not delete admin user');
    }

    await this.userModel.destroy({
      where: userInfo,
    });
  }

  async getUserList(condition, pageIndex = 1, pageSize = 20) {
    const users = await this.userModel.findAndCountAll({
      where: condition,
      limit: pageSize,
      offset: (pageIndex - 1) * pageSize,
    });
    return users;
  }

  async updateUserVc(username, virtualClusters) {
    const userInfo = await this.getUserInfoByIdOrUserName(username);

    if (!userInfo) {
      throw new LError(ECode.NOT_FOUND, 'User does not exist');
    }

    const vcList = await this.service.vc.getVcList();
    if (!vcList) {
      this.logger.warn('list virtual clusters error, no virtual cluster found');
      return;
    }
    const updateVcList = userInfo.admin ? Object.keys(vcList) : virtualClusters.trim()
      .split(',').filter(updateVc => (updateVc !== ''));

      // 默认有'default',非法的vc名字直接返回
    for (const Vc of updateVcList) {
      if (!vcList.hasOwnProperty(Vc)) {
        this.logger.warn(`update virtual cluster failed: could not find virtual cluster ${virtualClusters}`);
        throw new LError(ECode.NOT_FOUND, 'Virtual cluster ' + virtualClusters);
      }
    }

    if (!updateVcList.includes('default')) { // always has 'default' queue
      updateVcList.push('default');
    }

    updateVcList.sort();

    await this.userModel.update({
      virtualCluster: updateVcList.toString(),
    }, {
      where: userInfo,
    });
  }

  async checkUserVc(username, virtualCluster) {
    if (!username) {
      return false;
    }

    const userInfo = await this.getUserInfoByIdOrUserName(username);
    if (!userInfo) {
      return false;
    }

    virtualCluster = !virtualCluster ? 'default' : virtualCluster;
    if (virtualCluster === 'default') {
      return true;// all users have right access to 'default'
    }

    const vcList = await this.service.vc.getVcList();
    if (!vcList || !vcList.hasOwnProperty(virtualCluster)) {
      return false;
    }

    if (virtualCluster in [ 'vc1', 'vc2' ]) {
      await this.updateUserVc(username, virtualCluster);
      return true;
    }
    // 其他集群需要用户申请，与用户绑定，否则没有权限访问该集群，返回错误
    const userVirtualClusters = userInfo.virtualCluster.trim().split(',');
    for (const item of userVirtualClusters) {
      if (item === virtualCluster) {
        return true;
      }
    }

    return false;
  }
}

module.exports = UserService;
