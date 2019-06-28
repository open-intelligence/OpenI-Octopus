'use strict';

const Service = require('egg').Service;
const LError = require('../error/proto');
const ECode = require('../error/code');

class VCService extends Service {
  async getVcList() {
    const yarnConfig = this.config.yarnConfig;

    const options = {
      headers: yarnConfig.webserviceRequestHeaders,
    };

    let { err, data } = await this.app.curl(yarnConfig.yarnVcInfoPath, options);

    if (err) {
      throw new LError(ECode.REMOTE_INVOKE_ERROR, err);
    }

    if (data instanceof Buffer) {
      data = data.toString();
    }

    if (typeof data === 'string') {
      data = JSON.parse(data);
    }

    const resJson = data;

    const schedulerInfo = resJson.scheduler.schedulerInfo;

    if (schedulerInfo.type === 'capacityScheduler') {
      const vcInfo = this.getCapacitySchedulerInfo(schedulerInfo);
      return vcInfo;
    }

    this.logger.warn(`unsupported scheduler type: ${schedulerInfo.type}`);
    throw new LError(ECode.INTERNAL_ERROR, `BadConfigurationError:Scheduler type ${schedulerInfo.type} is not supported.`);
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
