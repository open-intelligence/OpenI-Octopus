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


class K8sFrameworkClient {

  constructor() {
    this._authCtxProvider = opt => { return opt; };// 权限验证上下文提供者
    this._apiServer = '';
    this._namespace = 'default';
    this._apiVersion = 'frameworkcontroller.microsoft.com/v1';
    this._resourceName = 'frameworks';
  }

  /**
     *
     * @param {Function} func function which set the auth context to request option before request
     * @return {K8sFrameworkHelper} this
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
     * @return {K8sFrameworkHelper} this;
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
     * @param {String} namespace  the namespace of framework
     * @return {K8sFrameworkHelper} this
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
     * @param {String} apiVersion  apiVersion of frameworks
     * @return {K8sFrameworkHelper} this
     * @api public
     */
  setApiVersion(apiVersion) {
    this._apiVersion = apiVersion || 'frameworkcontroller.microsoft.com/v1';
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
  _api() {
    return `${this._apiServer}/apis/${this._apiVersion}/namespaces/${this._namespace}/${this._resourceName}`;
  }

  /**
     *
     * @param {JSON} framework   the framework config
     * @return {Promise} promise
     * @api public
     */
  async create(framework) {

    const opt = {
      url: this._api(),
      method: 'POST',
      body: framework,
      json: true,
    };

    return this.request(opt);
  }

  /**
     *
     * @param {JSON} labelSelector labelSelector
     * @return {Promise} promise
     * @api public
     */
  async getByLabelSelector(labelSelector) {

    let url = this._api();

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
     * @param {String} name  name of framework
     * @return {Promise} promise
     * @api public
     */
  async getByName(name) {

    const opt = {
      url: `${this._api()}/${name}`,
      method: 'GET',
      json: true,
    };

    return this.request(opt);
  }

  /**
     *
     * @param {String} name  name of the framework
     * @return {Promise} promise
     * @api public
     */
  async deleteByName(name) {
    const opt = {
      url: `${this._api()}/${name}`,
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


module.exports = K8sFrameworkClient;
