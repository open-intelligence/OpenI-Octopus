
'use strict';

const Service = require('egg').Service;
const fs = require('fs');
const LError = require('../error/proto');
const ECode = require('../error/code');
const K8sFrameworkClient = require('../lib/k8sFrameworkClient');
const yaml = require('js-yaml');

class K8sServices extends Service {
  constructor(...args) {
    super(...args);

    const kube_config_file = yaml.safeLoad(fs.readFileSync(this.config.k8sConfigPath));

    const kube_config = {
      ca: kube_config_file.clusters[0].cluster['certificate-authority-data'],
      cert: kube_config_file.users[0].user['client-certificate-data'],
      key: kube_config_file.users[0].user['client-key-data'],
      server: kube_config_file.clusters[0].cluster.server,
    };

    const Authorization = {
      ca: Buffer.from(kube_config.ca, 'base64').toString(),
      cert: Buffer.from(kube_config.cert, 'base64').toString(),
      key: Buffer.from(kube_config.key, 'base64').toString(),
    };


    this.k8sFrameworkClient = new K8sFrameworkClient();

    this.k8sFrameworkClient.setApiServer(kube_config.server);

    this.k8sFrameworkClient.setAuthCtxProvider(opt => Object.assign(opt, Authorization));

  }

  async getNodes() {

    const opt = {
      url: `${this.k8sFrameworkClient.getApiServer()}/api/v1/nodes`,
      method: 'GET',
      json: true,
    };

    const rsp = this.k8sFrameworkClient.request(opt);

    if (rsp.kind !== 'NodeList') {
      throw new LError(ECode.FAILURE, 'K8sServices getNodes error:' + rsp.error);
    }

    return rsp.items || [];

  }

  async getPods(namespace) {

    const opt = {
      url: `${this.k8sFrameworkClient.getApiServer()}/api/v1/namespaces/${namespace}/pods/`,
      method: 'GET',
      json: true,
    };

    const rsp = this.k8sFrameworkClient.Request(opt);

    if (rsp.kind !== 'PodList') {
      throw new LError(ECode.FAILURE, 'K8sServices getNodes error:' + rsp.error);
    }

    return rsp.items || [];
  }
}


module.exports = K8sServices;
