'use strict';


const request = require('request');

/**
 *
 * @param {JSON} opt request option
 * @return {Promise} promise
 * @api private
 */
const promise_request = function(opt) {
  return new Promise(function(resolve, reject) {
    request(opt, function(err, res, body) {
      if (err) {
        reject(err);
      } else {
        resolve(body);
      }
    });
  });
};


class K8sClient {

  constructor() {
    console.log("k8s client create.")
    this._authCtxProvider = opt => { return opt; };// 权限验证上下文提供者
    this._apiServer = '';
    this._namespace = 'default';
    this._apiVersion = '';
    this._kind = "";
    this._instance = null
  }

  static getInstance(){
     if (!this._instance){
      this._instance = new K8sClient()
     }
     return this._instance
  }

  setKind(kind){
    this._kind = kind;
    return this
  }

  getKind(){
      return this._kind;
  }

  /**
     *
     * @param {Function} func function which set the auth context to request option before request
     * @return {K8sClient} this
     * @api public
     */
  setAuthCtxProvider(func) {
    typeof func === 'function' && (this._authCtxProvider = func);
    return this;
  }

  /**
     * @return {Function} _authCtxProvider
     * @api public
     */
  getAuthCtxProvider() {
    return this.__authCtxProvider;
  }

  /**
     *
     * @param {String} server address of  api server
     * @return {K8sClient} this;
     * @api public
     */
  setApiServer(server) {

    server = server || '';

    server = server.endsWith('/') ? server.slice(0, server.length - 1) : server;

    this._apiServer = server;

    return this;
  }

  /**
     * @return {String} apiServer
     * @api public
     */
  getApiServer() {
    return this._apiServer;
  }

  /**
     *
     * @param {String} namespace  the namespace 
     * @return {K8sClient} this
     * @api public
     */
  setNamespace(namespace) {
    this._namespace = namespace;
    return this;
  }

  /**
     * @return {String} namespace
     * @api public
     */
  getNamespace() {
    return this._namespace;
  }

  /**
     *
     * @param {String} apiVersion  apiVersion 
     * @return {K8sClient} this
     * @api public
     */
  setApiVersion(apiVersion) {
    this._apiVersion = apiVersion;
    return this;
  }

  /**
     * @return {String} apiversion
     * @api public
     */
  getApiVersion() {
    return this._apiVersion;
  }
  /**
     * @return {String} api
     * @api private
     */
  _api(namespace) {
    const space = namespace || this._namespace;
    return `${this._apiServer}/apis/${this._apiVersion}/namespaces/${space}/${this._kind}`;
  }

  /**
     *
     * @param {JSON}   crd
     * @param {String} namespace 
     * @return {Promise} promise
     * @api public
     */
  async create(crd,namespace) {

    const opt = {
      url: this._api(namespace),
      method: 'POST',
      body: crd,
      json: true,
    };

    return this.request(opt);
  }

  /**
     *
     * @param {JSON} labelSelector labelSelector
     * @param {String} namespace
     * @return {Promise} promise
     * @api public
     */
  async getByLabelSelector(labelSelector,namespace) {

    let url = this._api(namespace);

    let query = '';

    if (typeof labelSelector !== 'object') {
      labelSelector = {};
    }

    for (const key in labelSelector) {
      if (query === '') {
        query = key + '=' + labelSelector[key];
      } else {
        query = query + ',' + key + '=' + labelSelector[key];
      }
    }

    url = query !== '' ? url + '?labelSelector=' + encodeURIComponent(query) : url;

    const opt = {
      url,
      method: 'GET',
      json: true,
    };

    return this.request(opt);

  }

  /**
     *
     * @param {String} name   
     * @param {String} namespace +optional
     * @return {Promise} promise
     * @api public
     */
  async getByName(name,namespace) {

    const opt = {
      url: `${this._api(namespace)}/${name}`,
      method: 'GET',
      json: true,
    };

    return this.request(opt);
  }

  /**
     *
     * @param {String} name  name 
     * @param {String} namespace +optional
     * @return {Promise} promise
     * @api public
     */
  async deleteByName(name,namespace) {
    const opt = {
      url: `${this._api(namespace)}/${name}`,
      method: 'DELETE',
      json: true,
    };

    return this.request(opt);
  }

  /**
     *
     * @param {JSON} opt request option
     * @return {Promise} promise
     * @api public
     */
  request(opt) {
    opt = typeof this._authCtxProvider === 'function' ? this._authCtxProvider(opt) : opt;
    return promise_request(opt);
  }

}


module.exports = K8sClient;
