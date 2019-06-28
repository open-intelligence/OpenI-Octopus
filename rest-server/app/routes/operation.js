'use strict';

module.exports = (app, router) => {

  /**
   * @api {POST} /api/v1/operation/ RecordOperation
   * @apiSampleRequest off
   * @apiName RecordOperation
   * @apiDescription
   * @apiVersion 1.0.0
   * @apiGroup Operation
   *
   * @apiHeader {String} Authorization Bearer {token} <code>required</code>
   * @apiHeaderExample {json} Header-Example:
   * {
   *  "Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
   * }
   *
   * @apiParam {String="userLogin","createJob"} action The type of action operation <code>required</code>
   * @apiParam {Object} actionInfo The unique id of superior organizational structure.
   * @apiParam {String} actionInfo.jobId jobId is the name of job, it is required when the action is "createJob"
   * @apiParamExample {json} Request-Example:
   * {
   *  "action":"createJob",
   *  "actionInfo":{
   *    "jobId":"JOB-1111111"
   *  }
   * }
   *
   * @apiSuccess {String} code Equal to 'S000' when successfully.
   * @apiSuccess {String} msg Equal to 'success' when successfully.
   * @apiSuccessExample Success-Response:
   *  HTTP/1.1 200 OK
   *  {
   *   "code": "S000",
   *   "msg": "success"
   *  }
   *
   * @apiUse NotFoundError
   * @apiUse RemoteInvokeError
   * @apiUse InvalidParameterError
   */
  router.post('/', 'operation.recordOperation');
};
