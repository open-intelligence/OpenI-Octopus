// License please refer to: http://www.aitisa.org.cn/uploadfile/2018/0910/20180910031548314.pdf

'use strict';

module.exports = (app, router) => {

  /**
   * @api {GET} /api/v1/third/oauth/:platform/callback Oauth2Callback
   * @apiSampleRequest off
   * @apiName Oauth2Callback
   * @apiDescription Oauth2.0 authorize callback.
   * @apiVersion 1.0.0
   * @apiGroup Third
   *
   * @apiParam {String} platform The authorize platform. <code>required</code>
   * @apiParam {String} code The authorize code. <code>required</code>
   * @apiParamExample {json} Request-Example:
   *  ?code=123456789
   *
   * @apiSuccessExample Success-Response:
   *  HTTP/1.1 302 TemporarilyMoved
   *  Location /user/register?platform=${platform}&token_3rd=${token}
   */
  router.get('/oauth/:platform/callback', 'third.oauth.authCallBack');

  /**
   * @api {GET} /api/v1/third/oauth/:platform/authorize Oauth2Enter
   * @apiSampleRequest off
   * @apiName Oauth2Enter
   * @apiDescription Oauth2.0 authorize enter.
   * @apiVersion 1.0.0
   * @apiGroup Third
   *
   * @apiParam {String} platform The authorize platform. <code>required</code>
   *
   * @apiSuccessExample Success-Response:
   *  HTTP/1.1 302 TemporarilyMoved
   *  Location ${ThirdPlatformAuthorizePath}?client_id=${clientId}&response_type=code&redirect_uri=/api/v1/third/oauth/${platform}/callback
   */
  router.get('/oauth/:platform/authorize', 'third.oauth.authorize');

  /**
   * @api {POST} /api/v1/third/user/register CreateThirdPlatformUser
   * @apiSampleRequest off
   * @apiName CreateThirdPlatformUser
   * @apiDescription create a user account from the third party of platform.
   * @apiVersion 1.0.0
   * @apiGroup Third
   *
   * @apiHeader {String} Authorization Bearer {token} which from Oauth2 callback. <code>required</code>
   * @apiHeaderExample {json} Header-Example:
   * {
   *  "Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
   * }
   *
   * @apiParam {String} username The username of User Account. <code>required</code> <code>min 6</code>
   * @apiParam {String} password The password of User Account. <code>required</code> <code>min 6</code>
   * @apiParamExample {json} Request-Example:
   * {
   *  "username":"test123",
   *  "password":"123456",
   * }
   *
   * @apiSuccess {String} code Equal to 'S000' when successfully.
   * @apiSuccess {String} msg Equal to 'success' when successfully.
   * @apiSuccess {Object} payload Mount data.
   * @apiSuccess {String} payload.username The username of User Account.
   * @apiSuccess {String} payload.token JWT token of user.
   * @apiSuccess {Boolean} payload.admin Is it a admin account.
   * @apiSuccessExample Success-Response:
   *  HTTP/1.1 200 OK
   *  {
   *   "code": "S000",
   *   "msg": "success",
   *   "payload":
   *   {
   *    "username": "test123",
   *    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
   *    "admin": false,
   *   }
   *  }
   *
   * @apiUse LackParameterError
   * @apiUse OperationForbiddenError
   * @apiUse InvalidParameterError
   */
  router.post('/user/register', 'third.user.register');
};
