

'use strict';

const Subscription = require('egg').Subscription;

class SyncFrameworksSubscription extends Subscription {

  static get schedule() {
    return {
      interval: '60s',
      type: 'worker',
    };
  }

  async subscribe() {
    const { ctx, service } = this;

    try {
      await service.v1JobService.syncFrameworks();
    } catch (e) {
      ctx.logger.error(e);
    }

  }
}

module.exports = SyncFrameworksSubscription;
