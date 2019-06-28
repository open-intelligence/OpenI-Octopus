'use strict';

module.exports = (app, router) => {

  /**
   * @api {GET} /api/v1/whiteList ListUserWhiteList
   * @apiSampleRequest off
   * @apiName ListUserWhiteList
   * @apiDescription list the white list of users <code>Administrator Only</code>
   * @apiVersion 1.0.0
   * @apiGroup ACL
   *
   * @apiHeader {String} Authorization Bearer {token} <code>required</code>
   * @apiHeaderExample {json} Header-Example:
   * {
   *  "Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
   * }
   *
   * @apiSuccess {String} code Equal to 'S000' when successfully.
   * @apiSuccess {String} msg Equal to 'success' when successfully.
   * @apiSuccess {String[]} payload The white list of users
   * @apiSuccessExample Success-Response:
   *  HTTP/1.1 200 OK
   *  {
   *   "code": "S000",
   *   "msg": "success",
   *   "payload":[
   *    "test123"
   *   ]
   *  }
   *
   * @apiUse LackParameterError
   * @apiUse OperationForbiddenError
   */
  router.get('/whiteList', 'acl.listUserWhiteList');

  /**
   * @api {POST} /api/v1/whiteList AddUserWhiteList
   * @apiSampleRequest off
   * @apiName AddUserWhiteList
   * @apiDescription add a user to join white list <code>Administrator Only</code>
   * @apiVersion 1.0.0
   * @apiGroup ACL
   *
   * @apiHeader {String} Authorization Bearer {token} <code>required</code>
   * @apiHeaderExample {json} Header-Example:
   * {
   *  "Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
   * }
   *
   * @apiParam {String} username The username of User Account. <code>required</code> <code>min 6</code>
   * @apiParamExample {json} Request-Example:
   * {
   *  "username":"test123"
   * }
   *
   * @apiSuccess {String} code Equal to 'S000' when successfully.
   * @apiSuccess {String} msg Equal to 'success' when successfully.
   * @apiSuccessExample Success-Response:
   *  HTTP/1.1 200 OK
   *  {
   *   "code": "S000",
   *   "msg": "success",
   *  }
   * @apiUse LackParameterError
   * @apiUse OperationForbiddenError
   */
  router.post('/whiteList', 'acl.addUserWhiteList');

  /**
   * @api {DELETE} /api/v1/whiteList RemoveUserWhiteList
   * @apiSampleRequest off
   * @apiName RemoveUserWhiteList
   * @apiDescription remote a user in white list <code>Administrator Only</code>
   * @apiVersion 1.0.0
   * @apiGroup ACL
   *
   * @apiHeader {String} Authorization Bearer {token} <code>required</code>
   * @apiHeaderExample {json} Header-Example:
   * {
   *  "Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
   * }
   *
   * @apiParam {String} username The username of User Account. <code>required</code> <code>min 6</code>
   * @apiParamExample {json} Request-Example:
   *  ?username=test123
   *
   * @apiSuccess {String} code Equal to 'S000' when successfully.
   * @apiSuccess {String} msg Equal to 'success' when successfully.
   * @apiSuccessExample Success-Response:
   *  HTTP/1.1 200 OK
   *  {
   *   "code": "S000",
   *   "msg": "success",
   *  }
   *
   * @apiUse LackParameterError
   * @apiUse OperationForbiddenError
   */
  router.delete('/whiteList', 'acl.removeUserWhiteList');
};
