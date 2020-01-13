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
const { ECode, LError } = require('../../lib');
const _ = require('lodash');

class UserService extends Service {
  constructor(...args) {
    super(...args);
    this.userModel = this.app.model.User;
    this.organizationModel = this.app.model.Organization;
    this.cryptoUtil = this.app.component.Utils.crypto;
  }

  async fillData(user) {
    if (!user) {
      return;
    }
    const data = {};
    if (!user.uid) {
      data.uid = '_' + this.app.generateId(31);
    }

    if (!_.isEmpty(data)) {
      await this.userModel.update(data, { where: user });
    }
  }

  async check(username, password) {

    if (!username || !password) {

      throw new LError(ECode.LACK_PARAM, !username ? 'username' : 'password');

    }

    const user = await this.userModel.findOne({ where: { username }, raw: true });

    if (!user) {
      throw new LError(ECode.NOT_FOUND, username);
    }
    const passwordKey = this.cryptoUtil.encryptWithSalt(password, username);

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

  async loadCheckWhiteList() {
    let whiteList = await this.service.common.getItem(this.app.config.commonKeys.jobConfig.whiteListKey);
    whiteList = whiteList.split(',');
    return whiteList;
  }

  async updateUserInfo(userInfo, condition) {
    if (userInfo.orgId) {
      const hasOgz = await this.organizationModel.count({ where: { id: userInfo.orgId } });
      if (!hasOgz) {
        throw new LError(ECode.NOT_FOUND, 'not found organization');
      }
    }

    this.toggleUserStatus(userInfo);
    await this.userModel.update(userInfo, { where: condition });
  }

  toggleUserStatus(userInfo) {
    
    userInfo.orgId = userInfo.orgId || "default";

    if (userInfo.email && userInfo.fullName && userInfo.orgId && userInfo.teacher && userInfo.phone) {
      userInfo.status = this.userModel.constants.status.ALLOW_ACTIVE;
    } else {
      userInfo.status = this.userModel.constants.status.ALLOW_NOT_ACTIVE;
    }
  }

  async getUserInfo(condition) {
    const userInfo = await this.userModel.findOne({
      attributes: {
        exclude: [ 'passwordKey' ],
      },
      where: condition,
      include: {
        model: this.organizationModel,
      },
    });
    return userInfo;
  }

  async updatePassword(oldPassword, newPassword, condition) {
    const passwordKey = this.cryptoUtil.encryptWithSalt(oldPassword, condition.username);
    if (condition.passwordKey !== passwordKey) {

      throw new LError(ECode.WRONG_PASSWORD, 'Old password is wrong');

    }

    const newPasswordKey = this.cryptoUtil.encryptWithSalt(newPassword, condition.username),
      newItem = {
        passwordKey: newPasswordKey,
        modifyTime: new Date(),
      };

    await this.userModel.update(newItem, { where: condition });
  }

  async upsertUser(username, password, admin) {
    const derivedKey = this.cryptoUtil.encryptWithSalt(password, username);
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

  async getUserList({ inWhite }, pageIndex = 1, pageSize = 20,searchKey = "") {
    const condition = {};
    const whiteList = await this.loadCheckWhiteList();
    if (inWhite === '0') {
      condition.username = { $notIn: whiteList };
    } else if (inWhite === '1') {
      condition.username = { $in: whiteList };
    }

    searchKey = searchKey || "";

    if(searchKey && searchKey.trim().length > 0){
       searchKey =searchKey+"%";
       condition['$or'] = {username:{$like:searchKey},fullName:{$like:searchKey}}
    }

    const users = await this.userModel.findAndCountAll({
      include: {
        model: this.organizationModel,
        attributes: { exclude: [ 'ids', 'names', 'created_at', 'updated_at' ] },
      },
      attributes: { exclude: [ 'passwordKey' ] },
      where: condition,
      limit: parseInt(pageSize),
      offset: (pageIndex - 1) * pageSize,
    });

    const rows = [];
    
    for (let user of users.rows) {
      user = user.get ? user.get() : user;
      if (whiteList.indexOf(user.username) > -1) {
        user.inWhite = 1;
      } else {
        user.inWhite = 0;
      }
      rows.push(user);
    }
    users.rows = rows;
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
