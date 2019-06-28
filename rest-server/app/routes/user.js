'use strict';

module.exports = (app, router) => {
  /**
   * @api {POST} /api/v1/user/info GetUserSimpleInfo
   * @apiSampleRequest off
   * @apiName GetUserSimpleInfo
   * @apiDescription get user simple info
   * @apiVersion 1.0.0
   * @apiGroup User
   *
   * @apiHeader {String} Authorization Bearer {token} <code>required</code>
   * @apiHeaderExample {json} Header-Example:
   *  {
   *   "Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
   *  }
   *
   * @apiSuccess {String} code Equal to 'S000' when successfully.
   * @apiSuccess {String} msg Equal to 'success' when successfully.
   * @apiSuccess {Object} payload  Mount data.
   * @apiSuccess {String} payload.username The username of User Account.
   * @apiSuccess {String} payload.orgId The unique id of organization.
   * @apiSuccess {Boolean} payload.admin Is it a admin account.
   * @apiSuccessExample Success-Response:
   *  HTTP/1.1 200 OK
   *  {
   *   "code": "S000",
   *   "msg": "success",
   *   "payload":
   *   {
   *    "username": "admin777777",
   *    "admin": false,
   *    "orgId":"1111111"
   *   }
   *  }
   *
   * @apiUse AccessDeniedError
   */
  router.get('/info', 'user.getUserSimpleInfo');

  /**
   * @api {PUT} /api/v1/user UpdatePassword
   * @apiSampleRequest off
   * @apiName UpdatePassword
   * @apiDescription reset user password
   * @apiVersion 1.0.0
   * @apiGroup User
   *
   * @apiHeader {String} Authorization Bearer {token} <code>required</code>
   * @apiHeaderExample {json} Header-Example:
   *  {
   *   "Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
   *  }
   *
   * @apiParam {String} username The username of User Account. <code>required</code>
   * @apiParam {String} oldPassword The password of User Account. <code>required</code> <code>min 6</code>
   * @apiParam {String} newPassword  The expired sec. of token.  <code>required</code> <code>min 6</code>
   * @apiParamExample {json} Request-Example:
   *  {
   *   "username":"test123",
   *   "oldPassword":"123456",
   *   "newPassword":"12345678",
   *  }
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
   * @apiUse WrongPasswordError
   * @apiUse NotFoundError
   */
  router.put('/', 'user.updatePassword');

  /**
   * @api {POST} /api/v1/user CreateUser
   * @apiSampleRequest off
   * @apiName CreateUser
   * @apiDescription create a user account. <code>Administrator Only</code>
   * @apiVersion 1.0.0
   * @apiGroup User
   *
   * @apiHeader {String} Authorization Bearer {token} <code>required</code>
   * @apiHeaderExample {json} Header-Example:
   *  {
   *   "Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
   *  }
   *
   * @apiParam {String} username The username of User Account. <code>required</code> <code>min 6</code>
   * @apiParam {String} password The password of User Account. <code>required</code> <code>min 6</code>
   * @apiParamExample {json} Request-Example:
   *  {
   *   "username":"test123",
   *   "password":"123456",
   *  }
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
  router.post('/', 'user.update');

  /**
   * @api {DELETE} /api/v1/token RemoteUser
   * @apiSampleRequest off
   * @apiName RemoteUser
   * @apiDescription remote a user account. <code>Administrator Only</code>
   * @apiVersion 1.0.0
   * @apiGroup User
   *
   * @apiHeader {String} Authorization Bearer {token} <code>required</code>
   * @apiHeaderExample {json} Header-Example:
   *  {
   *   "Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
   *  }
   *
   * @apiParam {String} username The username of User Account. <code>required</code>
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
   * @apiUse NotFoundError
   * @apiUse LackParameterError
   * @apiUse OperationForbiddenError
   */
  router.delete('/', 'user.remove');

  /**
   * @api {GET} /api/v1/user GetUserLists
   * @apiSampleRequest off
   * @apiName GetUserLists
   * @apiDescription get user lists. <code>Administrator Only</code>
   * @apiVersion 1.0.0
   * @apiGroup User
   *
   * @apiHeader {String} Authorization Bearer {token} <code>required</code>
   * @apiHeaderExample {json} Header-Example:
   *  {
   *   "Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
   *  }
   *
   * @apiParam {String} search It can be username or fullName. <code>required</code>
   * @apiParam {String="0","1"} inw Is it a white list user? "1" is yes,"0" is no.
   * @apiParam {Number} ps=100 The size of page.
   * @apiParam {Number} pi=1 The index of page.
   * @apiParamExample {json} Request-Example:
   *  ?search=test123&inw=1&ps=100&pi=1
   *
   * @apiSuccess {String} code Equal to 'S000' when successfully.
   * @apiSuccess {String} msg Equal to 'success' when successfully.
   * @apiSuccess {Object} payload  Mount data.
   * @apiSuccess {Number} payload.count Total number of users.
   * @apiSuccess {Object[]} payload.rows Users.
   * @apiSuccess {Number} payload.rows.id Unique id.
   * @apiSuccess {String} payload.rows.username Account name.
   * @apiSuccess {String} payload.rows.email Email address.
   * @apiSuccess {String} payload.rows.fullName The name of user.
   * @apiSuccess {Number} payload.rows.orgId Organization unique id.
   * @apiSuccess {Number} payload.rows.status Status:{0:forbidden,9:zero hour,10:allow not active,11:allow active}
   * @apiSuccess {String} payload.rows.teacher The teacher name of user.
   * @apiSuccess {String} payload.rows.phone Phone number.
   * @apiSuccess {String} payload.rows.uid Unique id.
   * @apiSuccess {Boolean} payload.rows.admin Is it a admin account.
   * @apiSuccess {Number} payload.rows.inWhite Is it a white list user? "1" is yes,"0" is no.
   * @apiSuccess {String} payload.rows.virtualCluster The virtual cluster which user is.
   * @apiSuccess {String} payload.rows.modifyTime The modify time of user info.
   * @apiSuccess {String} payload.rows.created_at The created time of user info.
   * @apiSuccess {String} payload.rows.updated_at The updated time of user info.
   * @apiSuccess {Object} payload.rows.organization The organization of user.
   * @apiSuccess {String} payload.rows.organization.id Unique id .
   * @apiSuccess {String} payload.rows.organization.name The name of organization.
   * @apiSuccess {String} payload.rows.organization.pid The parent of organization.
   * @apiSuccess {String} payload.rows.organization.typ The typ of organization.
   * @apiSuccess {String} payload.rows.organization.description The description of organization.
   * @apiSuccessExample Success-Response:
   *  HTTP/1.1 200 OK
   *  {
   *   "code": "S000",
   *   "msg": "success",
   *   "payload":
   *   {
   *    "count": 144,
   *    "rows": [
   *     {
   *      "id": 1000,
   *      "username": "user123",
   *      "email": "111111@11.com",
   *      "fullName": "测试账号",
   *      "orgId": "vc811111",
   *      "status": 11,
   *      "teacher": "老师",
   *      "phone": "+86-13211111111",
   *      "uid": "_posnetz32deu4hddk4g0a9ntd9joedv",
   *      "admin": false,
   *      "virtualCluster": "default",
   *      "modifyTime": "2019-03-05T06:25:49.000Z",
   *      "created_at": "2019-03-05T06:25:49.000Z",
   *      "updated_at": "2019-03-05T06:25:49.000Z",
   *      "organization": {
   *       "id": "22222222",
   *       "name": "平台",
   *       "pid": "111111111",
   *       "typ": "default",
   *       "description": "平台"
   *      },
   *      "inWhite": 0
   *     }
   *    ]
   *   }
   *  }
   *
   * @apiUse LackParameterError
   * @apiUse OperationForbiddenError
   */
  router.get('/', 'user.getUserList');

  /**
   * @api {PUT} /api/v1/user/:username/virtualClusters UpdateUserVirtualClusters
   * @apiSampleRequest off
   * @apiName UpdateUserVirtualClusters
   * @apiDescription update the virtual clusters of user <code>Administrator Only</code>
   * @apiVersion 1.0.0
   * @apiGroup User
   *
   * @apiHeader {String} Authorization Bearer {token} <code>required</code>
   * @apiHeaderExample {json} Header-Example:
   *  {
   *   "Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
   *  }
   *
   * @apiParam {String} username User Account name. <code>required</code>
   * @apiParam {String} virtualClusters The name of virtual cluster. <code>required</code>
   * @apiParamExample {json} Request-Example:
   *  PUT /api/v1/user/test123/virtualClusters
   *  {
   *   "virtualClusters":"default"
   *  }
   *
   * @apiSuccess {String} code Equal to 'S000' when successfully.
   * @apiSuccess {String} msg Equal to 'success' when successfully.
   * @apiSuccessExample Success-Response:
   *  HTTP/1.1 201 OK
   *  {
   *   "code": "S000",
   *   "msg": "success",
   *  }
   *
   * @apiUse NotFoundError
   * @apiUse LackParameterError
   * @apiUse OperationForbiddenError
   */
  router.put('/:username/virtualClusters', 'user.updateUserVc');

  /**
   * @api {PUT} /api/v1/user/:username UpdateUserInfo
   * @apiSampleRequest off
   * @apiName UpdateUserInfo
   * @apiDescription update the info of user. <code>Administrator Only</code>
   * @apiVersion 1.0.0
   * @apiGroup User
   *
   * @apiHeader {String} Authorization Bearer {token} <code>required</code>
   * @apiHeaderExample {json} Header-Example:
   *  {
   *   "Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
   *  }
   *
   * @apiParam {String} username User Account name. <code>required</code>
   * @apiParam {String} email Email address.
   * @apiParam {String} fullName The name of user.
   * @apiParam {String} orgId Organization unique id.
   * @apiParam {String} teacher The teacher of user.
   * @apiParam {String} phone Phone number.
   * @apiParamExample {json} Request-Example:
   *  PUT /api/v1/user/test123
   *  {
   *   "email":"xiaoming@pcl.ac.cn",
   *   "fullName":小明",
   *   "orgId":"987654321",
   *   "teacher":"老师",
   *   "phone":"+86-13512345679"
   *  }
   *
   * @apiSuccess {String} code Equal to 'S000' when successfully.
   * @apiSuccess {String} msg Equal to 'success' when successfully.
   * @apiSuccessExample Success-Response:
   *  HTTP/1.1 201 OK
   *  {
   *   "code": "S000",
   *   "msg": "success",
   *  }
   *
   * @apiUse NotFoundError
   * @apiUse LackParameterError
   * @apiUse OperationForbiddenError
   */
  router.put('/:username', 'user.updateUserInfo');

  /**
   * @api {GET} /api/v1/user/:username GetUserInfo
   * @apiSampleRequest off
   * @apiName GetUserInfo
   * @apiDescription get a user info.
   * @apiVersion 1.0.0
   * @apiGroup User
   *
   * @apiHeader {String} Authorization Bearer {token} <code>required</code>
   * @apiHeaderExample {json} Header-Example:
   *  {
   *   "Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
   *  }
   *
   * @apiParam {String} username User Account name. <code>required</code>
   * @apiParamExample {json} Request-Example:
   *  GET /api/v1/user/test123
   *
   * @apiSuccess {String} code Equal to 'S000' when successfully.
   * @apiSuccess {String} msg Equal to 'success' when successfully.
   * @apiSuccess {Object} payload Users.
   * @apiSuccess {Number} payload.id Unique id.
   * @apiSuccess {String} payload.username Account name.
   * @apiSuccess {String} payload.email Email address.
   * @apiSuccess {String} payload.fullName The name of user.
   * @apiSuccess {Number} payload.orgId Organization unique id.
   * @apiSuccess {Number} payload.status Status:{0:forbidden,9:zero hour,10:allow not active,11:allow active}
   * @apiSuccess {String} payload.teacher The teacher name of user.
   * @apiSuccess {String} payload.phone Phone number.
   * @apiSuccess {String} payload.uid Unique id.
   * @apiSuccess {Boolean} payload.admin Is it a admin account.
   * @apiSuccess {Number} payload.inWhite Is it a white list user? "1" is yes,"0" is no.
   * @apiSuccess {String} payload.virtualCluster The virtual cluster which user is.
   * @apiSuccess {String} payload.modifyTime The modify time of user info.
   * @apiSuccess {String} payload.created_at The created time of user info.
   * @apiSuccess {String} payload.updated_at The updated time of user info.
   * @apiSuccess {Object} payload.organization The organization of user.
   * @apiSuccess {String} payload.organization.id Unique id .
   * @apiSuccess {String} payload.organization.name The name of organization.
   * @apiSuccess {String} payload.organization.pid The parent of organization.
   * @apiSuccess {String} payload.organization.typ The typ of organization.
   * @apiSuccess {String} payload.organization.description The description of organization.
   * @apiSuccessExample Success-Response:
   *  HTTP/1.1 200 OK
   *  {
   *   "code": "S000",
   *   "msg": "success",
   *   "payload":
   *   {
   *     "id": 1000,
   *     "username": "user123",
   *     "email": "111111@11.com",
   *     "fullName": "测试账号",
   *     "orgId": "vc811111",
   *     "status": 11,
   *     "teacher": "老师",
   *     "phone": "+86-13211111111",
   *     "uid": "_posnetz32deu4hddk4g0a9ntd9joedv",
   *     "admin": false,
   *     "virtualCluster": "default",
   *     "modifyTime": "2019-03-05T06:25:49.000Z",
   *     "created_at": "2019-03-05T06:25:49.000Z",
   *     "updated_at": "2019-03-05T06:25:49.000Z",
   *     "organization":
   *     {
   *      "id": "22222222",
   *      "name": "平台",
   *      "pid": "111111111",
   *      "typ": "default",
   *      "description": "平台"
   *     }
   *    }
   *   }
   *  }
   *
   * @apiUse LackParameterError
   * @apiUse OperationForbiddenError
   */
  router.get('/:username', 'user.getUserInfo');
};
