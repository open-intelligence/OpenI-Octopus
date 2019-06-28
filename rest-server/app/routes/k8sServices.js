'use strict';

module.exports = (app, router) => {
  /**
   * @api {POST} /api/v1/services GetK8SNodes
   * @apiSampleRequest off
   * @apiName GetK8SNodes
   * @apiDescription get the k8s`s nodes info. <code>Administrator Only</code>
   * @apiVersion 1.0.0
   * @apiGroup Services
   *
   * @apiHeader {String} Authorization Bearer {token} <code>required</code>
   * @apiHeaderExample {json} Header-Example:
   * {
   *  "Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
   * }
   *
   * @apiSuccess {String} code Equal to 'S000' when successfully.
   * @apiSuccess {String} msg Equal to 'success' when successfully.
   * @apiSuccess {Object} payload Nodes and Pods.
   * @apiSuccess {Object[]} payload.nodes Nodes and Pods.
   * @apiSuccess {Object} payload.nodes.metadata Metadata of k8s node.
   * @apiSuccess {Object} payload.nodes.spec Spec of k8s node.
   * @apiSuccess {Object} payload.nodes.status Status of k8s node.
   * @apiSuccess {Object[]} payload.pods Nodes and Pods.
   * @apiSuccess {Object} payload.pods.metadata Metadata of k8s pod.
   * @apiSuccess {Object} payload.pods.spec Spec of k8s pod.
   * @apiSuccess {Object} payload.pods.status Status of k8s pod.
   * @apiSuccessExample Success-Response:
   *  HTTP/1.1 200 OK
   *  {
   *   "code": "S000",
   *   "msg": "success",
   *   "payload":{
   *    "nodes":[
   *     {
   *      "metadata":{},
   *      "spec":{},
   *      "status":{}
   *     }
   *    ],
   *    "pods":[
   *     {
   *      "metadata":{},
   *      "spec":{},
   *      "status":{}
   *     }
   *    ]
   *   }
   *  }
   *
   * @apiUse FailureError
   * @apiUse OperationForbiddenError
   */
  router.get('/', 'k8sServices.get');
};
