'use strict';

module.exports = (app, router) => {
  const checkUserIsAdmin = app.middleware.checkUserIsAdmin();

  /**
   * @api {GET} /api/v1/job/platform ListJobPlatform
   * @apiSampleRequest off
   * @apiName ListJobPlatform
   * @apiDescription get the job platform list.
   * @apiVersion 1.0.0
   * @apiGroup JobPlatform
   *
   * @apiHeader {String} Authorization Bearer {token} <code>required</code>
   * @apiHeaderExample {json} Header-Example:
   * {
   *  "Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
   * }
   *
   * @apiParam {String} platformKey The unique key of Job platform.
   * @apiParam {String} name The name of Job platform.
   * @apiParamExample {json} Request-Example:
   *  ?platformKey=dgx
   *
   * @apiSuccess {String} code Equal to 'S000' when successfully.
   * @apiSuccess {String} msg Equal to 'success' when successfully.
   * @apiSuccess {Object[]} payload Job platforms.
   * @apiSuccess {Object} payload.standard The standard of Job platform.
   * @apiSuccess {Number} payload.standard.taskNumber Standard number of tasks.
   * @apiSuccess {Number} payload.standard.cpuNumber Standard number of CPUs.
   * @apiSuccess {Number} payload.standard.memoryMB Standard number of Memory.
   * @apiSuccess {Number} payload.standard.gpuNumber Standard number of GPUs.
   * @apiSuccess {String} payload.platformKey The unique key of Job platform.
   * @apiSuccess {String} payload.name Job platform`s name.
   * @apiSuccess {String} payload.description Job description.
   * @apiSuccessExample Success-Response:
   *  HTTP/1.1 200 OK
   *  {
   *   "code": "S000",
   *   "msg": "success",
   *   "payload":[
   *    {
   *     "standard": {
   *      "taskNumber": 1,
   *      "cpuNumber": 4,
   *      "memoryMB": 512,
   *      "gpuNumber": 1
   *     },
   *     "platformKey": "other",
   *     "name": "OTHER类型",
   *     "description": "OTHER类型"
   *    }
   *   ]
   *  }
   *
   * @apiUse InvalidParameterError
   */
  router.get('/', 'jobPlatform.listJobPlatforms');

  /**
   * @api {POST} /api/v1/job/platform CreateJobPlatform
   * @apiSampleRequest off
   * @apiName CreateJobPlatform
   * @apiDescription create a Job Platform. <code>Administrator Only</code>
   * @apiVersion 1.0.0
   * @apiGroup JobPlatform
   *
   * @apiHeader {String} Authorization Bearer {token} <code>required</code>
   * @apiHeaderExample {json} Header-Example:
   * {
   *  "Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
   * }
   *
   * @apiParam {String} platformKey The unique key of Job platform. <code>required</code>
   * @apiParam {String} name Job platform`s name. <code>required</code>
   * @apiParam {String} description Description. <code>required</code>
   * @apiParam {Object} standard Standard of JobPlatform.
   * @apiParam {Number=1} standard.taskNumber Standard number of tasks.
   * @apiParam {Number=1} standard.cpuNumber Standard number of CPUs.
   * @apiParam {Number=100} standard.memoryMB Standard number of memoryMB.
   * @apiParam {Number=64} standard.shmMB Standard number of shmMb.
   * @apiParam {Number=0} standard.gpuNumber Standard number of GPUs.
   * @apiParamExample {json} Request-Example:
   * {
   *  "standard": {
   *   "taskNumber": 1,
   *   "cpuNumber": 4,
   *   "memoryMB": 512,
   *   "gpuNumber": 1
   *  },
   *  "platformKey": "test",
   *  "name": "Test类型",
   *  "description": "Test类型"
   * }
   *
   * @apiSuccess {String} code Equal to 'S000' when successfully.
   * @apiSuccess {String} msg Equal to 'success' when successfully.
   * @apiSuccess {Object} payload Job platforms.
   * @apiSuccess {Object} payload.standard The standard of Job platform.
   * @apiSuccess {Number} payload.standard.taskNumber Standard number of tasks.
   * @apiSuccess {Number} payload.standard.cpuNumber Standard number of CPUs.
   * @apiSuccess {Number} payload.standard.memoryMB Standard number of Memory.
   * @apiSuccess {Number} payload.standard.gpuNumber Standard number of GPUs.
   * @apiSuccess {String} payload.platformKey The unique key of Job platform.
   * @apiSuccess {String} payload.name Job platform`s name.
   * @apiSuccess {String} payload.description Job description.
   * @apiSuccessExample Success-Response:
   *  HTTP/1.1 200 OK
   *  {
   *   "code": "S000",
   *   "msg": "success",
   *   "payload": {
   *    "standard": {
   *     "taskNumber": 1,
   *     "cpuNumber": 4,
   *     "memoryMB": 512,
   *     "gpuNumber": 1
   *    },
   *    "platformKey": "test",
   *    "name": "Test类型",
   *    "description": "Test类型"
   *    "updated_at": "2019-03-11T08:12:39.387Z",
   *    "created_at": "2019-03-11T08:12:39.387Z"
   *   }
   *  }
   *
   * @apiUse LackParameterError
   * @apiUse OperationForbiddenError
   * @apiUse ResourceConflictError
   */
  router.post('/', checkUserIsAdmin, 'jobPlatform.createJobPlatform');

  /**
   * @api {GET} /api/v1/job/platform/imageSet GetImageSetsFromJobPlatform
   * @apiSampleRequest off
   * @apiName GetImageSetsFromJobPlatform
   * @apiDescription get imageSets from jobPlatform
   * @apiVersion 1.0.0
   * @apiGroup JobPlatform
   *
   * @apiHeader {String} Authorization Bearer {token} <code>required</code>
   * @apiHeaderExample {json} Header-Example:
   * {
   *  "Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
   * }
   *
   * @apiSuccess {String} code Equal to 'S000' when successfully.
   * @apiSuccess {String} msg Equal to 'success' when successfully.
   * @apiSuccess {Object[]} payload Job platforms with ImageSets.
   * @apiSuccess {Object} payload.standard The standard of Job platform.
   * @apiSuccess {Number} payload.standard.taskNumber Standard number of tasks.
   * @apiSuccess {Number} payload.standard.cpuNumber Standard number of CPUs.
   * @apiSuccess {Number} payload.standard.memoryMB Standard number of Memory.
   * @apiSuccess {Number} payload.standard.gpuNumber Standard number of GPUs.
   * @apiSuccess {String} payload.platformKey The unique key of Job platform.
   * @apiSuccess {String} payload.name Job platform`s name.
   * @apiSuccess {String} payload.description Job description.
   * @apiSuccess {Object[]} payload.imageSets The ImageSets from Job Platform.
   * @apiSuccess {String} payload.imageSets.id ImageSetId.
   * @apiSuccess {String} payload.imageSets.name ImageSet`s name.
   * @apiSuccess {String} payload.imageSets.place ImageSet`s address.
   * @apiSuccess {String} payload.imageSets.provider ImageSet`s provider.
   * @apiSuccess {String} payload.imageSets.remark remark.
   * @apiSuccess {String} payload.imageSets.description ImageSet`s description.
   * @apiSuccess {String} payload.imageSets.createtime ImageSet`s create time.
   * @apiSuccessExample Success-Response:
   *  HTTP/1.1 200 OK
   *  {
   *   "code": "S000",
   *   "msg": "success",
   *   "payload":[
   *    {
   *     "standard": {
   *      "taskNumber": 1,
   *      "cpuNumber": 4,
   *      "memoryMB": 512,
   *      "gpuNumber": 1
   *     },
   *     "platformKey": "test",
   *     "name": "Test类型",
   *     "description": "Test类型",
   *     "imageSets":[
   *      {
   *       "id": 1000000,
   *       "name": "deepo:v2.0",
   *       "place": "192.168.112.221:5000/user-images/deepo:v2.0",
   *       "description": "# deepo:v2.0镜像\n\n- Deepo是一个几乎包含所有流行深度学习框架的Docker映像，拥有一个完整的可复制的深度学习研究环境。它涵盖了当前最流行的深度学习框架： \n  theano, tensorflow, sonnet, pytorch, keras, lasagne, mxnet, cntk, chainer, caffe, torch。\n- 镜像内容：\n    操作系统      Ubuntu16.04  \n\n    CUDA          8.0.61  \n\n    CUDNN         V6   \n\n    Python        3.6.6    \n\n    PyTorch       0.4.0    \n\n    Tensorflow    1.8.0   \n\n    Keras         2.2.2    \n\n    Theano        1.0.1    \n\n    Sonnet        1.23    \n\n    MxNett        1.2.0    \n\n    Caffe         1.0.0    \n\n    CNTK          2.5.1\r\n   \r\n    jupyter\r\n\r\n- 详情请参考镜像的[github](https://github.com/ufoym/deepo)",
   *       "provider": "admin",
   *       "createtime": "2018-12-03T04:40:27.000Z",
   *       "remark": "good",
   *      }
   *     ]
   *    }
   *   ]
   *  }
   *
   * @apiUse OperationForbiddenError
   */
  router.get('/imageSet', 'jobPlatform.listJobPlatformWithImageSets');
};
