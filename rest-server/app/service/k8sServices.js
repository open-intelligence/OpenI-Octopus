
'use strict';

const Service = require('egg').Service;
const { ECode, LError } = require('../../lib');

class K8sServices extends Service {
  constructor(...args) {
    super(...args);
    this.k8sTaskSetClient = this.app.k8sTaskSetClient;
  }

  async getNodes() {

    const opt = {
      url: `${this.k8sTaskSetClient.getApiServer()}/api/v1/nodes`,
      method: 'GET',
      json: true,
    };

    const rsp = this.k8sTaskSetClient.request(opt);

    if (rsp.kind !== 'NodeList') {
      throw new LError(ECode.FAILURE, 'K8sServices getNodes error:' + rsp.error);
    }

    return rsp.items || [];

  }

  async getPods(namespace) {

    const opt = {
      url: `${this.k8sTaskSetClient.getApiServer()}/api/v1/namespaces/${namespace}/pods/`,
      method: 'GET',
      json: true,
    };

    const rsp = this.k8sTaskSetClient.Request(opt);

    if (rsp.kind !== 'PodList') {
      throw new LError(ECode.FAILURE, 'K8sServices getNodes error:' + rsp.error);
    }

    return rsp.items || [];
  }
}


module.exports = K8sServices;
