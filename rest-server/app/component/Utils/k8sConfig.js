'use strict';
const fs = require('fs');
const yaml = require('js-yaml');
const path = require('path');

function isHttps(port){
  return port==443
}

function loadContextFromServiceAccount(k8sClientServiceAccountRoot){
  const host = process.env.KUBERNETES_SERVICE_HOST
  const port = process.env.KUBERNETES_SERVICE_PORT
  if (!host || !port) {
    throw new TypeError(
      'Unable to load in-cluster configuration, KUBERNETES_SERVICE_HOST' +
      ' and KUBERNETES_SERVICE_PORT must be defined')
  }
  const root = k8sClientServiceAccountRoot || '/var/run/secrets/kubernetes.io/serviceaccount/';
  const caPath = path.join(root, 'ca.crt');
  const tokenPath = path.join(root, 'token');
  const namespacePath = path.join(root, 'namespace');

  const ca = fs.readFileSync(caPath, 'utf8')
  const bearer = fs.readFileSync(tokenPath, 'utf8')
  const namespace = fs.readFileSync(namespacePath, 'utf8')

  return {
    namespace,
    server: `${isHttps(port) ? "https" : "http"}://${host}:${port}/`,
    authorization: {
      ca,
      headers:{
        Authorization:`Bearer ${bearer}`
      },
      rejectUnauthorized:isHttps(port)?true:false,
    }
  };
}

function loadContextFromLocalPath(k8sConfigLocalPath){
  const k8sLocalConfig = yaml.safeLoad(fs.readFileSync(k8sConfigLocalPath));
  const kubeConfig = {
    ca: k8sLocalConfig.clusters[0].cluster['certificate-authority-data'],
    cert: k8sLocalConfig.users[0].user['client-certificate-data'],
    key: k8sLocalConfig.users[0].user['client-key-data'],
    server: k8sLocalConfig.clusters[0].cluster.server,
  };

  const kubeContext = {
    authorization:{
      ca: Buffer.from(kubeConfig.ca, 'base64').toString(),
      cert: Buffer.from(kubeConfig.cert, 'base64').toString(),
      key: Buffer.from(kubeConfig.key, 'base64').toString(),
    },
    server: k8sLocalConfig.clusters[0].cluster.server,
  };

  return kubeContext
}

module.exports = {loadContextFromLocalPath,loadContextFromServiceAccount};