'use strict';

module.exports = (app, router) => {

  /**
   * @api {GET} /api/v1/dataset/ ListDataSet
   * @apiSampleRequest off
   * @apiName ListDataSet
   * @apiDescription list data sets.
   * @apiVersion 1.0.0
   * @apiGroup DataSet
   *
   * @apiHeader {String} Authorization Bearer {token} <code>required</code>
   * @apiHeaderExample {json} Header-Example:
   * {
   *  "Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
   * }
   *
   * @apiSuccess {String} code Equal to 'S000' when successfully.
   * @apiSuccess {String} msg Equal to 'success' when successfully.
   * @apiSuccess {Object} payload The map of DataSets.
   * @apiSuccess {Object} payload.:DataSetId DataSet.
   * @apiSuccess {String} payload.:DataSetId.id DataSetId.
   * @apiSuccess {String} payload.:DataSetId.name DataSet`s name.
   * @apiSuccess {String} payload.:DataSetId.place DataSet`s address.
   * @apiSuccess {String} payload.:DataSetId.provider DataSet`s provider.
   * @apiSuccess {String} payload.:DataSetId.remark remark.
   * @apiSuccess {String} payload.:DataSetId.description DataSet`s description.
   * @apiSuccess {String} payload.:DataSetId.create_time DataSet`s create time.
   * @apiSuccess {String} payload.:DataSetId.update_time DataSet`s update time.
   * @apiSuccessExample Success-Response:
   *  HTTP/1.1 200 OK
   *  {
   *   "code": "S000",
   *   "msg": "success",
   *   "payload":{
   *    "1000000":{
   *      "description": "data set data set",
   *      "id": 1000000,
   *      "name": "data set name",
   *      "place": "172.168.1.1:5000/user-data/set:v2.0",
   *      "provider": "admin",
   *      "remark": "good",
   *      "create_time": "2018-12-03T04:40:27.000Z",
   *      "update_time": "2018-12-03T04:40:27.000Z"
   *    }
   *   }
   *  }
   *
   * @apiUse OperationForbiddenError
   */
  router.get('/', 'dataSet.list');
};
