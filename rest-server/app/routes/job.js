// Copyright (c) Microsoft Corporation
// All rights reserved.
//
// MIT License
//
// Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated
// documentation files (the "Software"), to deal in the Software without restriction, including without limitation
// the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and
// to permit persons to whom the Software is furnished to do so, subject to the following conditions:
// The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING
// BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
// NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

'use strict';

module.exports = (app, router) => {

  router.get('/', 'job.list'); // /api/v1/jobs - Get list of jobs
  router.post('/', 'job.update'); // POST /api/v1/jobs - Update job


  router.get('/:jobName', 'job.get'); // /api/v1/jobs/:jobName - Get job status
  router.put('/:jobName', 'job.update'); // PUT /api/v1/jobs/:jobName - Update job
  router.delete('/:jobName', 'job.remove'); // DELETE /api/v1/jobs/:jobName - Remove job


  router.put('/:jobName/executionType', 'job.execute');
  router.get('/:jobName/config', 'job.getConfig');
  router.get('/:jobName/ssh', 'job.getSshInfo');
  router.get('/:jobName/ssh/file', 'job.getSshFile');


  /** Load job when API with jobName route parameter is hit */
  const convertJobNameHandler = app.middleware.convertJobNameHandler();
  router.param('jobName', convertJobNameHandler);

};
