'use strict';

const Service = require('egg').Service;

class AclService extends Service {

  async getPlatformAccessToken(platformName, authorizationCode) {
    const { app } = this;
    const { thirdPlatform, selfApp } = app.config;
    const platformConfig = thirdPlatform[platformName];
    const { oauth2: { protocol, host, client: { id: clientId, secret: clientSecret }, actions: { getToken: getTokenPath } } } = platformConfig;
    let getAccessTokenUrl = `${protocol}${host}${getTokenPath}?code=${authorizationCode}&grant_type=authorization_code&client_id=${clientId}&client_secret=${clientSecret}&redirect_uri=`;
    getAccessTokenUrl += encodeURIComponent(`${selfApp.domain}${selfApp.rootPath}/api/v1/third/oauth/${platformName}/callback`);
    const result = await app.curl(getAccessTokenUrl, {
      method: 'POST',
      dataType: 'json',
    });
    return result.data;
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
