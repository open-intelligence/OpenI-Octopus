'use strict';

module.exports = (app, router) => {
  const convertVcNameHandler = app.middleware.convertVcNameHandler();

  /**
   * @api {GET} /api/v1/virtual-clusters ListVirtualClusters
   * @apiSampleRequest off
   * @apiName ListVirtualClusters
   * @apiDescription get virtual cluster list.
   * @apiVersion 1.0.0
   * @apiGroup VirtualCluster
   *
   * @apiHeader {String} Authorization Bearer {token} <code>required</code>
   * @apiHeaderExample {json} Header-Example:
   * {
   *  "Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
   * }
   *
   * @apiSuccess {String} code Equal to 'S000' when successfully.
   * @apiSuccess {String} msg Equal to 'success' when successfully.
   * @apiSuccess {Object} payload Virtual clusters.
   * @apiSuccess {Object} payload.:vcName Virtual cluster.
   * @apiSuccess {Number} payload.:vcName.capacity capacity.
   * @apiSuccess {Number} payload.:vcName.maxCapacity maxCapacity.
   * @apiSuccess {Number} payload.:vcName.numJobs number of Jobs.
   * @apiSuccess {Number} payload.:vcName.numActiveJobs number of ActiveJobs.
   * @apiSuccess {Number} payload.:vcName.numPendingJobs number of PendingJobs.
   * @apiSuccess {Number} payload.:vcName.usedCapacity usedCapacity.
   * @apiSuccess {Object} payload.:vcName.resourcesUsed
   * @apiSuccess {Number} payload.:vcName.resourcesUsed.GPUs GPUs.
   * @apiSuccess {Number} payload.:vcName.resourcesUsed.memory Memory.
   * @apiSuccess {Number} payload.:vcName.resourcesUsed.vCores CPUs.
   * @apiSuccessExample Success-Response:
   *  HTTP/1.1 200 OK
   *  {
   *   "code": "S000",
   *   "msg": "success",
   *   "payload":{
   *    "default": {
   *     "capacity": 100,
   *     "maxCapacity": 100,
   *     "numActiveJobs": 11,
   *     "numJobs": 11,
   *     "numPendingJobs": 0,
   *     "resourcesUsed": {
   *      "GPUs": 39,
   *      "memory": 1525760,
   *      "vCores": 189,
   *      "usedCapacity": 32.5
   *     }
   *    }
   *   }
   *  }
   *
   * @apiUse InternalError
   * @apiUse RemoteInvokeError
   * @apiUse OperationForbiddenError
   */
  router.get('/', 'vc.list');

  /**
   * @api {GET} /api/v1/virtual-clusters/:vcName GetVirtualCluster
   * @apiSampleRequest off
   * @apiName GetVirtualCluster
   * @apiDescription get a virtual cluster info.
   * @apiVersion 1.0.0
   * @apiGroup VirtualCluster
   *
   * @apiHeader {String} Authorization Bearer {token} <code>required</code>
   * @apiHeaderExample {json} Header-Example:
   * {
   *  "Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
   * }
   *
   * @apiParam {String} vcName The name of Virtual-Cluster. <code>required</code>
   * @apiParamExample {json} Request-Example:
   *  GET /api/v1/virtual-clusters/default
   *
   * @apiSuccess {String} code Equal to 'S000' when successfully.
   * @apiSuccess {String} msg Equal to 'success' when successfully.
   * @apiSuccess {Object} payload Virtual cluster.
   * @apiSuccess {Number} payload.capacity capacity.
   * @apiSuccess {Number} payload.maxCapacity maxCapacity.
   * @apiSuccess {Number} payload.numJobs number of Jobs.
   * @apiSuccess {Number} payload.numActiveJobs number of ActiveJobs.
   * @apiSuccess {Number} payload.numPendingJobs number of PendingJobs.
   * @apiSuccess {Number} payload.usedCapacity usedCapacity.
   * @apiSuccess {Object} payload.resourcesUsed
   * @apiSuccess {Number} payload.resourcesUsed.GPUs GPUs.
   * @apiSuccess {Number} payload.resourcesUsed.memory Memory.
   * @apiSuccess {Number} payload.resourcesUsed.vCores CPUs.
   * @apiSuccessExample Success-Response:
   *  HTTP/1.1 200 OK
   *  {
   *   "code": "S000",
   *   "msg": "success",
   *   "payload":{
   *    "capacity": 100,
   *    "maxCapacity": 100,
   *    "numActiveJobs": 11,
   *    "numJobs": 11,
   *    "numPendingJobs": 0,
   *    "resourcesUsed": {
   *     "GPUs": 39,
   *     "memory": 1525760,
   *     "vCores": 189,
   *     "usedCapacity": 32.5
   *    }
   *   }
   *  }
   *
   * @apiUse InternalError
   * @apiUse NotFoundError
   * @apiUse RemoteInvokeError
   * @apiUse OperationForbiddenError
   */
  router.get('/:vcName', 'vc.get');

  router.param('vcName', convertVcNameHandler);
};
