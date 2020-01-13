'use strict';
const os = require('os');
const path = require('path');
const assert = require('assert');
const nanoid = require('nanoid');
const generate = require('nanoid/generate');
const DANDAREA = '1234567890abcdefghijklmnopqrstuvwxyz';
const fs = require('fs-extra');
const low = require('lowdb');
const FileAsync = require('lowdb/adapters/FileAsync');

const InitApplicationK8sClientSets = Symbol('Application#init_k8s_clientsets');

const ApplicationK8sTaskSetClient = Symbol('Application#k8s_taskset_client');
const ApplicationK8sPodGroupClient = Symbol('Application#k8s_podgroup_client');

module.exports = {
  disableFileLoggers(){
    for(const logger of this.loggers.values()){
      const fileTransport = logger.get('file');
      if(fileTransport){
        fileTransport.disable()
      }
    }
  },
  get idGenerator() {
    return nanoid;
  },
  generateId(len = 32) {
    return generate(DANDAREA, len);
  },
  async initProxyDB() {
    // init proxy db
    const { proxyDB: { fileDB: { filePath, fileName } } } = this.config;
    await fs.ensureDir(filePath);
    const adapter = new FileAsync(path.join(path.resolve(filePath), fileName));
    return await low(adapter);
  },
  async initJobConifgDB() {
    // init proxy db
    const { jobConfigDB: { fileDB: { filePath, fileName } } } = this.config;
    await fs.ensureDir(filePath);
    const adapter = new FileAsync(path.join(path.resolve(filePath), fileName));
    return await low(adapter);
  },
  [InitApplicationK8sClientSets](){
    const {Utils: { k8s:k8sUtils },K8sClient} = this.component;

    assert(k8sUtils,"component.utils.k8s nofound");

    let kubeConfig;
    if(process.env.WORK_IN_K8S_CLUSTER){
      kubeConfig = k8sUtils.loadContextFromServiceAccount(process.env.KUBERNETES_CLIENT_SERVICEACCOUNT_ROOT);
    }else {
      kubeConfig = k8sUtils.loadContextFromLocalPath(process.env.CUSTOM_KUBE_CONFIG_PATH
        || path.join(os.homedir(), '.kube/config'));
    }
    assert(kubeConfig,"kube config init failure");

    this[ApplicationK8sTaskSetClient] = new K8sClient();
    this[ApplicationK8sTaskSetClient].setKind("tasksets");
    this[ApplicationK8sTaskSetClient].setApiVersion("octopus.openi.pcl.cn/v1alpha1");
    this[ApplicationK8sTaskSetClient].setApiServer(kubeConfig.server);
    this[ApplicationK8sTaskSetClient].setAuthCtxProvider(opt => Object.assign(opt, kubeConfig.authorization));

    this[ApplicationK8sPodGroupClient] = new K8sClient();
    this[ApplicationK8sPodGroupClient].setKind("podgroups");
    this[ApplicationK8sPodGroupClient].setApiVersion("scheduling.incubator.k8s.io/v1alpha1");
    this[ApplicationK8sPodGroupClient].setApiServer(kubeConfig.server);
    this[ApplicationK8sPodGroupClient].setAuthCtxProvider(opt => Object.assign(opt, kubeConfig.authorization));
  
  },
  get k8sTaskSetClient() {
    if(this[ApplicationK8sTaskSetClient]){
      return this[ApplicationK8sTaskSetClient];
    }
    
    this[InitApplicationK8sClientSets]();

    return this[ApplicationK8sTaskSetClient];
  },

  get k8sPodGroupClient() {
    if(this[ApplicationK8sPodGroupClient]){
      return this[ApplicationK8sPodGroupClient];
    }
    
    this[InitApplicationK8sClientSets]();

    return this[ApplicationK8sPodGroupClient];
  },

  sendMail({ from, to, title, context }){
    this.messenger.sendToAgent("manager_email_send", {
      from,
      to,
      subject: title,
      html: context
    });
  }
};
