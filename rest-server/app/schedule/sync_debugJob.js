// License please refer to: http://www.aitisa.org.cn/uploadfile/2018/0910/20180910031548314.pdf

'use strict';

const Subscription = require('egg').Subscription;


class SyncDebugJobSubscription extends Subscription {
  // 通过 schedule 属性来设置定时任务的执行间隔等配置
  static get schedule() {
    return {
      interval: '60s', // 1 分钟间隔
      type: 'worker', // 指定所有的 worker 都需要执行
    };
  }

  // subscribe 是真正定时任务执行时被运行的函数
  async subscribe() {
    const { ctx, service } = this;

    try {
      await service.debugJobProxy.sync();
    } catch (e) {
      ctx.logger.error(e);
    }

  }
}

module.exports = SyncDebugJobSubscription;
