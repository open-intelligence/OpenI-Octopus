'use strict';

const Service = require('egg').Service;
const LError = require('../../error/proto');
const ECode = require('../../error/code');
const CryptoUtil = require('../../../util/crypto.js');

const UserFormats = {
  trustie: {
    formatThirdUser(platform, userInfo) {
      if (!userInfo.allow) {
        throw new LError(ECode.OPERATION_FORBIDDEN, 'not power to login');
      }
      return {
        thirdId: userInfo.token,
        platform,
        originData: userInfo,
      };
    },
    formatUser(thirdUser) {
      const { originData } = thirdUser;
      return {
        fullName: originData.name,
        email: originData.email,
      };
    },
  },
};

class AclService extends Service {
  constructor(...args) {
    super(...args);
    this.userModel = this.app.model.User;
    this.thirdUserModel = this.app.model.ThirdUser;
    this.organizationModel = this.app.model.Organization;
  }

  async register(userId, username, password) {
    const hasUser = await this.service.user.getUserInfoByIdOrUserName(username);
    if (hasUser) {
      throw new LError(ECode.INVALID_PARAM, 'username already exists');
    }
    const derivedKey = CryptoUtil.encryptWithSalt(password, username);
    const userInfo = {
      username,
      passwordKey: derivedKey,
      modifyTime: new Date(),
      status: this.userModel.constants.status.ALLOW_NOT_ACTIVE,
    };

    await this.userModel.update(userInfo, { where: { id: userId } });
    return await this.userModel.findOne({
      raw: true,
      where: { id: userId },
      attributes: {
        exclude: [ 'passwordKey' ],
      },
    });
  }

  async addUserFromPlatform(platformName, userInfo) {
    const format = UserFormats[platformName];
    if (!format) {
      throw new LError(ECode.NOT_FOUND, 'Platform is not found');
    }
    const thirdUser = format.formatThirdUser.call(this, platformName, userInfo);
    let hadThirdUser = await this.thirdUserModel.findOne({
      where: {
        thirdId: thirdUser.thirdId,
        platform: thirdUser.platform,
      },
      include: {
        model: this.userModel,
        attributes: {
          exclude: [ 'passwordKey', 'orgId', 'modifyTime', 'created_at', 'updated_at' ],
        },
      },
    });
    if (hadThirdUser && hadThirdUser.userId && hadThirdUser.user) {
      return hadThirdUser.user;
    } else if (hadThirdUser) {
      return await this.addUserFromThirdUser(hadThirdUser);
    }
    hadThirdUser = await this.thirdUserModel.create(thirdUser);
    return await this.addUserFromThirdUser(hadThirdUser);
  }

  async addUserFromThirdUser(thirdUser) {
    const format = UserFormats[thirdUser.platform];
    if (!format) {
      throw new LError(ECode.NOT_FOUND, 'Platform is not found');
    }
    const organizations = await this.organizationModel.findAll({
      raw: true,
      where: { typ: thirdUser.platform },
      attributes: [ 'id', 'pid' ],
    });
    if (!organizations || organizations.length < 1) {
      throw new LError(ECode.NOT_FOUND, 'Platform organization is not found');
    }
    const organization = organizations.find(org => {
      if (org.pid) {
        return true;
      }
      return false;
    });

    const defaultUser = {
      username: `${thirdUser.platform}-${this.app.generateId(8)}`,
      admin: false,
      orgId: organization.id,
      status: this.userModel.constants.status.ZERO_HOUR,
      teacher: '其他',
    };

    let user = format.formatUser.call(this, thirdUser);
    user = Object.assign(user, defaultUser);
    user = await this.userModel.create(user, { raw: true });
    await this.thirdUserModel.update({ userId: user.id }, {
      where: {
        thirdId: thirdUser.thirdId,
        platform: thirdUser.platform,
      },
    });
    return user;
  }

  async getPlatformUserInfo(platformName, accessToken) {
    const { app } = this;
    const { thirdPlatform } = app.config;
    const platformConfig = thirdPlatform[platformName];
    const { oauth2: { protocol, host, actions: { getUserInfo: getUserInfoPath } } } = platformConfig;
    const getUserInfoUrl = `${protocol}${host}${getUserInfoPath}?access_token=${accessToken}`;
    const result = await app.curl(getUserInfoUrl, {
      method: 'GET',
      dataType: 'json',
    });
    return result.data;
  }
}


module.exports = AclService;
