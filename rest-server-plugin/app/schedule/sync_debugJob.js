'use strict';

const Subscription = require('egg').Subscription;

class SyncDebugJobSubscription extends Subscription {
  // 通过 schedule 属性来设置定时任务的执行间隔等配置
  static get schedule() {
    return {
      interval: '60s', 
      type: 'worker',
      disable: false
    };
  }

  // subscribe 是真正定时任务执行时被运行的函数
  async subscribe() {
    const { ctx, service } = this;
    try {
      await service.debugjob.syncJobList();
    } catch (e) {
      ctx.logger.error(e);
    }

  }
}

module.exports = SyncDebugJobSubscription;
