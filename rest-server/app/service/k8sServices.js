
'use strict';

const Service = require('egg').Service;

const LError = require('../error/proto');
const ECode = require('../error/code');
const KubeClient = require("../utils/k8s_client");
const yaml = require("js-yaml");
const path = require("path");

class K8sServices extends Service {
  constructor(...args){
    super(...args);
    
    const kube_config_file = yaml.safeLoad(fs.readFileSync(this.config.k8sConfigPath));
   
    this.kube_config = {
      ca:kube_config_file.clusters[0].cluster["certificate-authority-data"],
      cert:kube_config_file.users[0].user['client-certificate-data'],
      key:kube_config_file.users[0].user["client-key-data"],
      server:kube_config_file.clusters[0].cluster.server  
    };

    this.kube_client = new KubeClient(this.kube_config,{});
  }

  async getNodes() {

    const opt = {
      "url":path.join(this.kube_config.server,"/api/v1/nodes"),
      "method":"GET"
    };

    let rsp = this.kube_client.Request(opt);

    if(rsp.kind != "NodeList"){
      throw new LError(ECode.FAILURE, 'K8sServices getNodes error:' + rsp.error);
    }

    return rsp.items || [];

  }

  async getPods(namespace) {

    const opt = {
      "url":path.join(this.kube_config.server,`/api/v1/namespaces/${namespace}/pods/`),
      "method":"GET"
    };

    let rsp = this.kube_client.Request(opt);

    if(rsp.kind != "PodList"){
      throw new LError(ECode.FAILURE, 'K8sServices getNodes error:' + rsp.error);
    }

    return rsp.items || [];
  }
}


module.exports = K8sServices;
