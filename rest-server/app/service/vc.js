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

const Service = require('egg').Service;

class VCService extends Service {
  async getVcList() {
    const yarnConfig = this.config.yarnConfig;

    const options = {
      headers: yarnConfig.webserviceRequestHeaders,
    };
    
    let {err,res,data} = await this.app.curl(yarnConfig.yarnVcInfoPath, options);

    if (err){
      throw err;
    }
 
    if (data instanceof Buffer){
       data = data.toString();
    }

    if ("string" == typeof data){
      data = JSON.parse(data);
    }

    const resJson =  data;

    const schedulerInfo = resJson.scheduler.schedulerInfo;

    if (schedulerInfo.type === 'capacityScheduler') {
      const vcInfo = this.getCapacitySchedulerInfo(schedulerInfo);
      return vcInfo;
    }

    this.logger.warn(`unsupported scheduler type: ${schedulerInfo.type}`);
    throw new Error('Internal Server Error', 'BadConfigurationError',
      `Scheduler type ${schedulerInfo.type} is not supported.`);
  }

  getCapacitySchedulerInfo(queueInfo) {
    const queues = {};
    function traverse(queueInfo, queueDict) {
      if (queueInfo.type === 'capacitySchedulerLeafQueueInfo') {
        queueDict[queueInfo.queueName] = {
          capacity: queueInfo.absoluteCapacity,
          maxCapacity: queueInfo.absoluteMaxCapacity,
          usedCapacity: queueInfo.absoluteUsedCapacity,
          numActiveJobs: queueInfo.numActiveApplications,
          numJobs: queueInfo.numApplications,
          numPendingJobs: queueInfo.numPendingApplications,
          resourcesUsed: queueInfo.resourcesUsed,
        };
      } else {
        for (let i = 0; i < queueInfo.queues.queue.length; i++) {
          traverse(queueInfo.queues.queue[i], queueDict);
        }
      }
    }
    traverse(queueInfo, queues);
    return queues;
  }
}

module.exports = VCService;
