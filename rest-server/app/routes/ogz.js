'use strict';

module.exports = (app, router) => {
  const checkUserIsAdmin = app.middleware.checkUserIsAdmin();

  /**
   * @api {POST} /api/v1/ogz AddOrganization
   * @apiSampleRequest off
   * @apiName AddOrganization
   * @apiDescription create a organization. <code>Administrator Only</code>
   * @apiVersion 1.0.0
   * @apiGroup Organization
   *
   * @apiHeader {String} Authorization Bearer {token} <code>required</code>
   * @apiHeaderExample {json} Header-Example:
   * {
   *  "Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
   * }
   *
   * @apiParam {String} name The name of Organization. <code>required</code>
   * @apiParam {String} pid The unique id of superior organizational structure.
   * @apiParam {String} typ The type of Organization.
   * @apiParam {String} description description.
   * @apiParamExample {json} Request-Example:
   * {
   *  "name":"test",
   *  "description":"test",
   *  "pid":"4v967izytvp",
   *  "typ":"default"
   * }
   *
   * @apiSuccess {String} code Equal to 'S000' when successfully.
   * @apiSuccess {String} msg Equal to 'success' when successfully.
   * @apiSuccess {Object} payload Organization.
   * @apiSuccess {String} payload.id Unique id.
   * @apiSuccess {String} payload.name The name of organization.
   * @apiSuccess {String} payload.ids Cumulative unique ids.
   * @apiSuccess {String} payload.names Cumulative names.
   * @apiSuccess {String} payload.pid The unique id of superior organizational structure.
   * @apiSuccess {String} payload.typ The type of Organization.
   * @apiSuccess {String} payload.description description.
   * @apiSuccessExample Success-Response:
   *  HTTP/1.1 200 OK
   *  {
   *   "code": "S000",
   *   "msg": "success",
   *   "payload":{
   *    "name": "test",
   *    "description": "test",
   *    "pid": "4v967izytvp",
   *    "id": "2tg66yqlr63",
   *    "ids": "4v967izytvp,2tg66yqlr63",
   *    "names": "testparent,test",
   *    "updated_at": "2019-03-11T06:35:38.032Z",
   *    "created_at": "2019-03-11T06:35:38.032Z"
   *   }
   *  }
   *
   * @apiUse LackParameterError
   * @apiUse OperationForbiddenError
   */
  router.post('/', checkUserIsAdmin, 'organization.addOrganization');

  /**
   * @api {GET} /api/v1/ogz ListOrganizations
   * @apiSampleRequest off
   * @apiName ListOrganizations
   * @apiDescription get a organization list.
   * @apiVersion 1.0.0
   * @apiGroup Organization
   *
   * @apiHeader {String} Authorization Bearer {token} <code>required</code>
   * @apiHeaderExample {json} Header-Example:
   * {
   *  "Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
   * }
   *
   * @apiSuccess {String} code Equal to 'S000' when successfully.
   * @apiSuccess {String} msg Equal to 'success' when successfully.
   * @apiSuccess {Object[]} payload Organization Tree.
   * @apiSuccess {String} payload.id Unique id.
   * @apiSuccess {String} payload.name The name of organization.
   * @apiSuccess {String} payload.pid The unique id of superior organizational structure.
   * @apiSuccess {String} payload.typ The type of Organization.
   * @apiSuccess {String} payload.description Organization Tree.
   * @apiSuccess {Object[]} payload.children Organization Tree.
   * @apiSuccessExample Success-Response:
   *  HTTP/1.1 200 OK
   *  {
   *   "code": "S000",
   *   "msg": "success",
   *   "payload: [
   *    {
   *     "id": "2qxhziamnup",
   *     "name": "test_parent",
   *     "pid": "",
   *     "typ": "default",
   *     "description": "test_parent",
   *     "children":[
   *      {
   *       "id": "7hjyatedvaj",
   *       "name": "test",
   *       "pid": "2qxhziamnup",
   *       "typ": "default",
   *       "description": "test"
   *      }
   *     ]
   *    }
   *   ]
   *  }
   *
   * @apiUse OperationForbiddenError
   */
  router.get('/', 'organization.listOrganizations');
};
