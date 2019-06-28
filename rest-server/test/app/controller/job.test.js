'use strict';

const { app, assert, assertFn, getToken } = require('../common');
const job = {
  jobName: 'test-bu241r',
  image: '10.11.3.8:5000/pai-images/pai.run.deepo:v1.1',
  gpuType: '',
  retryCount: 0,
  taskRoles: [{
    name: 'test_demo',
    memoryMB: 512,
    shmMB: 64,
    taskNumber: 1,
    cpuNumber: 4,
    gpuNumber: 1,
    minFailedTaskCount: null,
    minSucceededTaskCount: null,
    command: 'sleep 120',
  }],
};
let authorizationToken = 'Bearer ';

describe('test/app/controller/job.test.js', () => {

  before('Init Authorization Token', async function() {
    authorizationToken += await getToken();
  });

  describe('GET /api/v1/jobs - list the jobs', () => {
    it('should status 200', async () => {
      const result = await app.httpRequest()
        .get('/api/v1/jobs')
        .set('Authorization', authorizationToken);

      assertFn.responseSuccess(result);
      assert(result.body.payload instanceof Array && result.body.payload.length > -1, 'failure to get Jobs');
    });
  });

  describe('POST /api/v1/jobs - create or update a job', () => {
    it('should status 200');
    // it('should status 200', async () => {
    //   const result = await app.httpRequest()
    //     .post('/api/v1/jobs')
    //     .set('Authorization', authorizationToken)
    //     .send(job);
    //   assertFn.responseSuccess(result);
    // });
  });

  describe('PUT /api/v1/jobs/:jobName - create or update a job', () => {
    it('should status 200', async () => {
      const result = await app.httpRequest()
        .put('/api/v1/jobs/' + job.jobName)
        .set('Authorization', authorizationToken)
        .send(job);
      assertFn.responseSuccess(result);
    });
  });

  describe('GET /api/v1/jobs/:jobName - get a job', () => {
    it('should status 200 and get the job just created', async () => {
      const result = await app.httpRequest()
        .get('/api/v1/jobs/' + job.jobName)
        .set('Authorization', authorizationToken);

      assertFn.responseSuccess(result);
      assert(result.body.payload.name === job.jobName, 'can not find the job ' + job.jobName);
    });
  });

  describe('PUT /api/v1/jobs/:jobName/executionType - execute a job', () => {
    it('should status 200 after put a stop command', async () => {
      const result = await app.httpRequest()
        .put('/api/v1/jobs/' + job.jobName + '/executionType')
        .set('Authorization', authorizationToken)
        .send({ value: 'STOP' });
      assertFn.responseSuccess(result);
    });
  });

  describe('GET /api/v1/jobs/:jobName/config - get a job config', () => {
    it('should status 200 and get the job config', async () => {
      const result = await app.httpRequest()
        .get('/api/v1/jobs/' + job.jobName + '/config')
        .set('Authorization', authorizationToken);

      assertFn.responseSuccess(result);
      assert(result.body.payload.jobName === job.jobName, 'can not find the job config of ' + job.jobName);
    });
  });

  describe('GET /api/v1/jobs/:jobName/ssh- remove a job ssh info', () => {
    it('should status 200 and get the job ssh info', async () => {
      const result = await app.httpRequest()
        .get('/api/v1/jobs/' + job.jobName + '/ssh')
        .set('Authorization', authorizationToken);

      assertFn.responseSuccess(result);
      assert(result.body.payload.jobName === job.jobName, 'can not find the job ssh info of ' + job.jobName);
    });
  });

  describe('GET /api/v1/jobs/:jobName/ssh/file - download a job ssh file', () => {
    it('should status 200');
  });

  describe('DELETE /api/v1/jobs/:jobName - remove a job', () => {
    it('should status 200', async () => {
      const result = await app.httpRequest()
        .delete('/api/v1/jobs/' + job.jobName)
        .set('Authorization', authorizationToken);
      assertFn.responseSuccess(result);
    });
  });
});
