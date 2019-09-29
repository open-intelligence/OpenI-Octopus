'use strict';

module.exports = (app, router) => {

  // const checkUserIsAdmin = app.middleware.checkUserIsAdmin();
  // const checkUserWhiteList = app.middleware.checkUserWhiteList();

  /**
   * @api {GET} /api/v1/jobs ListJobs
   * @apiSampleRequest off
   * @apiName ListJobs
   * @apiDescription get the job list.
   * @apiVersion 1.0.0
   * @apiGroup Job
   *
   * @apiHeader {String} Authorization Bearer {token} <code>required</code>
   * @apiHeaderExample {json} Header-Example:
   * {
   *  "Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
   * }
   *
   * @apiSuccess {String} code Equal to 'S000' when successfully.
   * @apiSuccess {String} msg Equal to 'success' when successfully.
   * @apiSuccess {Object[]} payload Jobs.
   * @apiSuccess {String} payload.name Job name.
   * @apiSuccess {String} payload.state Current status of Job.
   * @apiSuccess {String} payload.subState Current status of SubJob.
   * @apiSuccess {String} payload.userId username.
   * @apiSuccess {String} payload.virtualCluster VirtualCluster`s name.
   * @apiSuccess {String} payload.executionType The execution type to Job.
   * @apiSuccess {Number} payload.createdTime The createdTime of Job.
   * @apiSuccess {Number} payload.completedTime The completedTime of Job.
   * @apiSuccess {Number} payload.appExitCode The code when Job exit.
   * @apiSuccessExample Success-Response:
   *  HTTP/1.1 200 OK
   *  {
   *   "code": "S000",
   *   "msg": "success",
   *   "payload":{
   *    "appExitCode": null
   *    "completedTime": null
   *    "createdTime": 1552296231877
   *    "executionType": "START"
   *    "name": "Video-111111"
   *    "retries": 0
   *    "state": "RUNNING"
   *    "subState": "APPLICATION_RUNNING"
   *    "userId": "username_01"
   *    "virtualCluster": "default"
   *   }
   *  }
   *
   * @apiUse NotFoundError
   * @apiUse OperationForbiddenError
   */
  router.get('/', 'job.list');


  /**/
  router.post('/:jobId/commitImage', 'job.commitImage');
  router.get('/:jobId/queryImage', 'job.queryImageStatus');


  /**
   * @api {POST} /api/v1/jobs CreateJob
   * @apiSampleRequest off
   * @apiName CreateJob
   * @apiDescription create a job.
   * @apiVersion 1.0.0
   * @apiGroup Job
   *
   * @apiHeader {String} Authorization Bearer {token} <code>required</code>
   * @apiHeaderExample {json} Header-Example:
   * {
   *  "Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
   * }
   *
   * @apiParam {String} jobName The name of Job. <code>required</code>
   * @apiParam {String} image The imageSet of docker. <code>required</code>
   * @apiParam {String} gpuType The type of GPU.
   * @apiParam {Number} retryCount The retry count of job task. <code>required</code>
   * @apiParam {Object[]} taskRoles Task of Job <code>required</code>
   * @apiParam {String} taskRoles.command Task command which to run. <code>required</code>
   * @apiParam {Number} taskRoles.cpuNumber The number of CPUs. <code>required</code>
   * @apiParam {Number} taskRoles.gpuNumber The number of GPUs. <code>required</code>
   * @apiParam {Number} taskRoles.memoryMB The number of memoryMB. <code>required</code>
   * @apiParam {Number} taskRoles.minFailedTaskCount Minimum number of task failures.
   * @apiParam {Number} taskRoles.minSucceededTaskCount Minimum number of task Succeeded.
   * @apiParam {String} taskRoles.name The name of task. <code>required</code>
   * @apiParam {Number} taskRoles.shmMB The number of shmMB. <code>required</code>
   * @apiParam {Number} taskRoles.taskNumber The number of task. <code>required</code>
   * @apiParamExample {json} Request-Example:
   * {
   *  "gpuType": "debug",
   *  "image": "192.168.1.1:5000/user-images/deepo.all-1111-1111",
   *  "jobName": "gpu-1111",
   *  "retryCount": 0,
   *  "taskRoles":[{
   *   "command": "sleep 100",
   *   "cpuNumber": 16,
   *   "gpuNumber": 1,
   *   "memoryMB": 128000,
   *   "minFailedTaskCount": null,
   *   "minSucceededTaskCount": null,
   *   "name": "gpu_1222",
   *   "shmMB": 64,
   *   "taskNumber": 1,
   *  }]
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
   *
   * @apiUse ResourceOverloadError
   * @apiUse LackParameterError
   * @apiUse OperationForbiddenError
   * @apiUse InvalidParameterError
   */
  router.post('/', 'job.excute');

  /**
   * @api {GET} /api/v1/jobs/limit GetJobLimit
   * @apiSampleRequest off
   * @apiName GetJobLimit
   * @apiDescription create the limit of job.
   * @apiVersion 1.0.0
   * @apiGroup Job
   *
   * @apiHeader {String} Authorization Bearer {token} <code>required</code>
   * @apiHeaderExample {json} Header-Example:
   * {
   *  "Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
   * }
   *
   * @apiSuccess {String} code Equal to 'S000' when successfully.
   * @apiSuccess {String} msg Equal to 'success' when successfully.
   * @apiSuccess {Object} payload The limiter of job.
   * @apiSuccess {Boolean} payload.enabledLimiter Whether to Open Restrictions.
   * @apiSuccess {Number} payload.cpuNumber The max number of CPUs.
   * @apiSuccess {Number} payload.gpuNumber The max number of GPUs.
   * @apiSuccess {Number} payload.maxAvailableJob The max number of Job count which is running or waiting.
   * @apiSuccess {Number} payload.memoryMB The max number of memoryMB.
   * @apiSuccess {Number} payload.shmMB The max number of shmMB.
   * @apiSuccess {Object} payload.jobInfo Status Number of Tasks Submitted by Users.
   * @apiSuccessExample Success-Response:
   *  HTTP/1.1 200 OK
   *  {
   *   "code": "S000",
   *   "msg": "success",
   *   "payload":{
   *     "cpuNumber": 16
   *     "enabledLimiter": true
   *     "gpuNumber": 1
   *     "jobInfo": {
   *      "RUNNING":1
   *     }
   *     "maxAvailableJob": 2
   *     "memoryMB": 256000
   *     "shmMB": 128000
   *   }
   *  }
   *
   * @apiUse OperationForbiddenError
   */
  router.get('/limit', 'job.getCheckLimit');

  /**
   * @api {GET} /api/v1/jobs/:jobId GetJobInfo
   * @apiSampleRequest off
   * @apiName GetJobInfo
   * @apiDescription get the info of a job. <code>Administrator Only</code>
   * @apiVersion 1.0.0
   * @apiGroup Job
   *
   * @apiHeader {String} Authorization Bearer {token} <code>required</code>
   * @apiHeaderExample {json} Header-Example:
   * {
   *  "Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
   * }
   *
   * @apiParam {String} jobId The id of job. <code>required</code>
   * @apiParamExample {json} Request-Example:
   *  GET /api/v1/jobs/job-11111
   *
   * @apiSuccess {String} code Equal to 'S000' when successfully.
   * @apiSuccess {String} msg Equal to 'success' when successfully.
   * @apiSuccess {Object} payload JobInfo.
   * @apiSuccess {String} payload.name Equal to 'success' when successfully.
   * @apiSuccess {Object} payload.jobStatus Current status info of Job.
   * @apiSuccess {Number} payload.jobStatus.appCompletedTime The completedTime of Job.
   * @apiSuccess {String} payload.jobStatus.appExitCode The code when Job exit.
   * @apiSuccess {String} payload.jobStatus.appExitDiagnostics The message when Job exit.
   * @apiSuccess {String} payload.jobStatus.appExitType The type when Job exit.
   * @apiSuccess {String} payload.jobStatus.appId The code when Job exit.
   * @apiSuccess {Number} payload.jobStatus.appLaunchedTime The time when Job launched.
   * @apiSuccess {Number} payload.jobStatus.appProgress Current progress count of Job.
   * @apiSuccess {String} payload.jobStatus.appTrackingUrl TrackingUrl.
   * @apiSuccess {String} payload.jobStatus.executionType The execution type to Job.
   * @apiSuccess {Number} payload.jobStatus.retries Number of Job retries.
   * @apiSuccess {String} payload.jobStatus.state Current status of Job.
   * @apiSuccess {String} payload.jobStatus.subState Current status of Sub Job.
   * @apiSuccess {String} payload.jobStatus.username Username.
   * @apiSuccess {String} payload.jobStatus.virtualCluster VirtualCluster`s name.
   * @apiSuccess {Number} payload.jobStatus.createdTime The createdTime of Job.
   * @apiSuccess {Number} payload.jobStatus.completedTime The completedTime of Job.
   * @apiSuccess {Object[]} payload.taskRoles Task of Job.
   * @apiSuccess {String} payload.taskRoles.command Task command which to run.
   * @apiSuccess {Number} payload.taskRoles.cpuNumber The number of CPUs.
   * @apiSuccess {Number} payload.taskRoles.gpuNumber The number of GPUs.
   * @apiSuccess {Number} payload.taskRoles.memoryMB The number of memoryMB.
   * @apiSuccess {Number} payload.taskRoles.minFailedTaskCount Minimum number of task failures.
   * @apiSuccess {Number} payload.taskRoles.minSucceededTaskCount Minimum number of task Succeeded.
   * @apiSuccess {String} payload.taskRoles.name The name of task.
   * @apiSuccess {Number} payload.taskRoles.shmMB The number of shmMB.
   * @apiSuccess {Number} payload.taskRoles.taskNumber The number of task.
   * @apiSuccessExample Success-Response:
   *  HTTP/1.1 200 OK
   *  {
   *   "code": "S000",
   *   "msg": "success",
   *   "payload":{
   *    "name":"gpu-111111",
   *    "jobStatus":{
   *     "username":"test",
   *     "state":"STOPPED",
   *     "subState":"FRAMEWORK_COMPLETED",
   *     "executionType":"STOP",
   *     "retries":0,
   *     "createdTime":1552297102463,
   *     "completedTime":1552297116591,
   *     "appId":"application_1552194866059_0111",
   *     "appProgress":0,
   *     "appTrackingUrl":null,
   *     "appLaunchedTime":null,
   *     "appCompletedTime":1552297116591,
   *     "appExitCode":214,
   *     "appExitDiagnostics":"UserApplication killed due to StopFrameworkRequest",
   *     "appExitType":"NON_TRANSIENT",
   *     "virtualCluster":"default"},
   *    "taskRoles":{
   *    }
   *   }
   *  }
   *
   * @apiUse OperationForbiddenError
   */
  router.get('/:jobId', 'job.get');

  /**
   * @api {PUT} /api/v1/jobs/:jobName CreateJob_v2
   * @apiSampleRequest off
   * @apiName CreateJob_v2
   * @apiDescription create a job.
   * @apiVersion 1.0.0
   * @apiGroup Job
   *
   * @apiHeader {String} Authorization Bearer {token} <code>required</code>
   * @apiHeaderExample {json} Header-Example:
   * {
   *  "Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
   * }
   *
   * @apiParam {String} jobName The name of Job. <code>required</code>
   * @apiParam {String} image The imageSet of docker. <code>required</code>
   * @apiParam {String} gpuType The type of GPU.
   * @apiParam {Number} retryCount The retry count of job task. <code>required</code>
   * @apiParam {Object[]} taskRoles Task of Job <code>required</code>
   * @apiParam {String} taskRoles.command Task command which to run. <code>required</code>
   * @apiParam {Number} taskRoles.cpuNumber The number of CPUs. <code>required</code>
   * @apiParam {Number} taskRoles.gpuNumber The number of GPUs. <code>required</code>
   * @apiParam {Number} taskRoles.memoryMB The number of memoryMB. <code>required</code>
   * @apiParam {Number} taskRoles.minFailedTaskCount Minimum number of task failures.
   * @apiParam {Number} taskRoles.minSucceededTaskCount Minimum number of task Succeeded.
   * @apiParam {String} taskRoles.name The name of task. <code>required</code>
   * @apiParam {Number} taskRoles.shmMB The number of shmMB. <code>required</code>
   * @apiParam {Number} taskRoles.taskNumber The number of task. <code>required</code>
   * @apiParamExample {json} Request-Example:
   * PUT /api/v1/jobs/gpu-1111
   * {
   *  gpuType: "debug",
   *  image: "192.168.1.1:5000/user-images/deepo.all-1111-1111",
   *  jobName: "gpu-1111",
   *  retryCount: 0,
   *  taskRoles:[{
   *   command: "sleep 100",
   *   cpuNumber: 16,
   *   gpuNumber: 1,
   *   memoryMB: 128000,
   *   minFailedTaskCount: null,
   *   minSucceededTaskCount: null,
   *   name: "gpu_1222",
   *   shmMB: 64,
   *   taskNumber: 1,
   *  }]
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
   *
   * @apiUse ResourceOverloadError
   * @apiUse LackParameterError
   * @apiUse OperationForbiddenError
   * @apiUse InvalidParameterError
   */
  router.put('/:jobName', 'job.excute');

  /**
   * @api {DELETE} /api/v1/jobs/:jobId DeleteJob
   * @apiSampleRequest off
   * @apiName DeleteJob
   * @apiDescription delete a job. <code>Administrator Only</code>
   * @apiVersion 1.0.0
   * @apiGroup Job
   *
   * @apiHeader {String} Authorization Bearer {token} <code>required</code>
   * @apiHeaderExample {json} Header-Example:
   * {
   *  "Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
   * }
   *
   * @apiParam {String} jobId The id of Job. <code>required</code>
   * @apiParamExample {json} Request-Example:
   *  DELETE /api/v1/jobs/job-1111
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
   * @apiUse OperationForbiddenError
   */
  router.delete('/:jobId', 'job.stop');

  /**
   * @apiDeprecated
   * @api {PUT} /api/v1/jobs/:jobName/executionType ExecJob
   * @apiSampleRequest off
   * @apiName ExecJob
   * @apiDescription send a executionType to Job
   * @apiVersion 1.0.0
   * @apiGroup Job
   *
   * @apiHeader {String} Authorization Bearer {token} <code>required</code>
   * @apiHeaderExample {json} Header-Example:
   * {
   *  "Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
   * }
   *
   * @apiParam {String} jobName The name of Job. <code>required</code>
   * @apiParam {String="START","STOP"} value The value of execution. <code>required</code>
   * @apiParamExample {json} Request-Example:
   * PUT /api/v1/jobs/job-1111/executionType
   * {
   *  value: "STOP"
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
   *
   * @apiUse LackParameterError
   * @apiUse OperationForbiddenError
   */
  // router.put('/:jobName/executionType', 'job.execute');

  /**
   * @api {GET} /api/v1/jobs/:jobId/config GetJobConfig
   * @apiSampleRequest off
   * @apiName GetJobConfig
   * @apiDescription get the config of Job.
   * @apiVersion 1.0.0
   * @apiGroup Job
   *
   * @apiHeader {String} Authorization Bearer {token} <code>required</code>
   * @apiHeaderExample {json} Header-Example:
   * {
   *  "Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
   * }
   *
   * @apiParam {String} jobId The jobId of  job. <code>required</code>
   * @apiParamExample {json} Request-Example:
   * GET /api/v1/jobs/job-1111/config
   *
   * @apiSuccess {String} code Equal to 'S000' when successfully.
   * @apiSuccess {String} msg Equal to 'success' when successfully.
   * @apiSuccess {Object} payload The config of Job.
   * @apiSuccess {String} payload.jobName The name of Job.
   * @apiSuccess {String} payload.image The imageSet of docker.
   * @apiSuccess {String} payload.gpuType The type of GPU.
   * @apiSuccess {Number} payload.retryCount The retry count of job task..
   * @apiSuccess {Object[]} payload.taskRoles Task of Job.
   * @apiSuccess {String} payload.taskRoles.command Task command which to run.
   * @apiSuccess {Number} payload.taskRoles.cpuNumber The number of CPUs.
   * @apiSuccess {Number} payload.taskRoles.gpuNumber The number of GPUs.
   * @apiSuccess {Number} payload.taskRoles.memoryMB The number of memoryMB.
   * @apiSuccess {Number} payload.taskRoles.minFailedTaskCount Minimum number of task failures.
   * @apiSuccess {Number} payload.taskRoles.minSucceededTaskCount Minimum number of task Succeeded.
   * @apiSuccess {String} payload.taskRoles.name The name of task.
   * @apiSuccess {Number} payload.taskRoles.shmMB The number of shmMB.
   * @apiSuccess {Number} payload.taskRoles.taskNumber The number of task.
   * @apiSuccessExample Success-Response:
   *  HTTP/1.1 200 OK
   *  {
   *   "code": "S000",
   *   "msg": "success",
   *   "payload":{
   *    gpuType: "debug",
   *    image: "192.168.1.1:5000/user-images/deepo.all-1111-1111",
   *    jobName: "gpu-1111",
   *    retryCount: 0,
   *    taskRoles:[{
   *     command: "sleep 100",
   *     cpuNumber: 16,
   *     gpuNumber: 1,
   *     memoryMB: 128000,
   *     minFailedTaskCount: null,
   *     minSucceededTaskCount: null,
   *     name: "gpu_1222",
   *     shmMB: 64,
   *     taskNumber: 1,
   *    }]
   *   }
   *  }
   *
   * @apiUse LackParameterError
   * @apiUse OperationForbiddenError
   */
  router.get('/:jobId/config', 'job.getConfig');

  /**
   * @apiDeprecated
   * @api {GET} /api/v1/jobs/:jobName/ssh GetJobSshInfo
   * @apiSampleRequest off
   * @apiName GetJobSshInfo
   * @apiDescription get the ssh info of Job.
   * @apiVersion 1.0.0
   * @apiGroup Job
   *
   * @apiHeader {String} Authorization Bearer {token} <code>required</code>
   * @apiHeaderExample {json} Header-Example:
   * {
   *  "Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
   * }
   *
   * @apiParam {String} jobName The username of User Account. <code>required</code>
   * @apiParamExample {json} Request-Example:
   * GET /api/v1/jobs/job-1111/ssh
   *
   * @apiSuccess {String} code Equal to 'S000' when successfully.
   * @apiSuccess {String} msg Equal to 'success' when successfully.
   * @apiSuccess {Object} payload. The ssh info of Job.
   * @apiSuccess {Object[]} payload.containers The containers of Job running.
   * @apiSuccess {String} payload.containers.id Container id.
   * @apiSuccess {String} payload.containers.sshIp Container ip.
   * @apiSuccess {Number} payload.containers.sshPort Container port.
   * @apiSuccess {Object} payload.keyPair The RSA Key.
   * @apiSuccess {String} payload.keyPair.privateKey Key Value.
   * @apiSuccess {String} payload.keyPair.privateKeyFileName Key FileName.
   * @apiSuccessExample Success-Response:
   *  HTTP/1.1 200 OK
   *  {
   *   "code": "S000",
   *   "msg": "success",
   *   "payload":{
   *    "containers":[{
   *     "id":"container_e14_111111",
   *     "sshIp":"192.168.1.1",
   *     "sshPort":10000
   *    }],
   *    "keyPair":{
   *     "privateKey":"-----BEGIN RSA PRIVATE KEY-----...-----END RSA PRIVATE KEY-----",
   *     "privateKeyFileName":"application_111111"}
   *    }
   *   }
   *  }
   *
   * @apiUse NotFoundError
   * @apiUse LackParameterError
   * @apiUse OperationForbiddenError
   */
  // router.get('/:jobName/ssh', 'job.getSshInfo');

  /**
   * @apiDeprecated
   * @api {GET} /api/v1/jobs/:jobName/:containerId/ssh/file DownloadJobSshFile
   * @apiSampleRequest off
   * @apiName DownloadJobSshFile
   * @apiDescription download the ssh file of Job.
   * @apiVersion 1.0.0
   * @apiGroup Job
   *
   * @apiHeader {String} Authorization Bearer {token} <code>required</code>
   * @apiHeaderExample {json} Header-Example:
   * {
   *  "Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
   * }
   *
   * @apiParam {String} jobName The name of job. <code>required</code>
   * @apiParam {String} containerId The containerId of sub job. <code>required</code>
   * @apiParam {String="bat","sh"} e The suffix name of file.
   * @apiParamExample {json} Request-Example:
   * GET /api/v1/jobs/job-1111/container_e15_1552463696557_3187_01_000005/ssh/file?e=bat
   *
   * @apiSuccessExample Success-Response:
   *  HTTP/1.1 200 OK
   *  Content-Disposition:attachment; filename="application_111111.bat"
   *  Content-Type:application/octet-stream
   *
   * @apiUse NotFoundError
   * @apiUse LackParameterError
   * @apiUse OperationForbiddenError
   */
  // router.get('/:jobName/:containerId/ssh/file', 'job.getSshFile');

  router.get('/status/summary', 'job.getSummaryStatus');
};
