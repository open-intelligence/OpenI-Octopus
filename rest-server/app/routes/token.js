'use strict';

module.exports = (app, router) => {
  /**
   * @api {POST} /api/v1/token GetToken
   * @apiSampleRequest off
   * @apiName GetToken
   * @apiDescription get a JWT Token
   * @apiVersion 1.0.0
   * @apiGroup Token
   *
   * @apiParam {String} username The username of User Account. <code>required</code>
   * @apiParam {String} password The password of User Account. <code>required</code> <code>min 6</code>
   * @apiParam {Number} expiration=7200  The expired sec. of token.
   * @apiParamExample {json} Request-Example:
   *  {
   *   "username":"test123",
   *   "password":"123456",
   *   "expiration":6000,
   *  }
   *
   * @apiSuccess {String} code Equal to 'S000' when successfully.
   * @apiSuccess {String} msg Equal to 'success' when successfully.
   * @apiSuccess {Object} payload  Mount data.
   * @apiSuccess {String} payload.username The username of User Account.
   * @apiSuccess {String} payload.token JWT token of user.
   * @apiSuccess {Boolean} payload.admin Is it a admin account.
   * @apiSuccessExample Success-Response:
   * 	HTTP/1.1 200 OK
   *  {
   *   "code": "S000",
   *   "msg": "success",
   *   "payload":
   *   {
   *    "username": "admin777777",
   *    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
   *    "admin": false,
   *   }
   *  }
   *
   * @apiUse LackParameterError
   * @apiUse WrongPasswordError
   */
  router.post('/', 'token.get');
};
