'use strict';

const Controller = require('egg').Controller;
const LError = require('../../error/proto');
const ECode = require('../../error/code');


class AclController extends Controller {
  async authCallBack() {
    const { ctx, service, app } = this;
    const { platform } = ctx.params;
    const { code } = ctx.query;
    ctx.temporarilyMoved();
    if (!code) {
      return ctx.redirect('/');
    }

    const tokenObj = await service.third.oauth.getPlatformAccessToken(platform, code);
    const userInfo = await service.third.oauth.getPlatformUserInfo(platform, tokenObj.access_token);
    let user;
    try {
      user = await service.third.user.addUserFromPlatform(platform, userInfo);
    } catch (e) {
      if (e._code === ECode.OPERATION_FORBIDDEN) {
        return ctx.redirect('/exception/403/');
      }
      ctx.logger.error(e);
      return ctx.redirect('/exception/500/');
    }

    const tokenPayload = user.get ? user.get() : user;

    const token = await service.token.generate(tokenPayload, { expiresIn: (user.status !== app.model.User.constants.status.ZERO_HOUR) ? 7200 : 180 });
    ctx.redirect(`/user/register?platform=${platform}&token_3rd=${token}`);
  }

  async authorize() {
    const { ctx, app } = this;
    const { thirdPlatform, selfApp } = app.config;
    const { platform } = ctx.params;
    const platformConfig = thirdPlatform[platform];
    ctx.temporarilyMoved();
    if (!platformConfig) {
      return ctx.redirect('/exception/403/');
    }

    const { oauth2: { protocol, host, client: { id: clientId }, actions: { authorize: authorizePath } } } = platformConfig;
    let authorizeUrl = `${protocol}${host}${authorizePath}?client_id=${clientId}&response_type=code&redirect_uri=`;
    authorizeUrl += encodeURIComponent(`${selfApp.domain}/rest-server/api/v1/third/oauth/${platform}/callback`);
    ctx.redirect(authorizeUrl);
  }
}

module.exports = AclController;
