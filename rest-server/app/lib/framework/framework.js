'use strict';

const utils = require('./utils');


class Framework {
  constructor() {
    this._name = 'framework' + Math.ceil(Math.random() * 1000) + '_' + Date.now();
    this._retry_count = 0;
    this._tasks = [];
    this._labels = {};
    this._config = {};
  }
  /**
   *
   * @param {JSON} config config of this framework
   * @return {Framework} this
   * @api public
   */
  SetConfig(config) {
    this._config = config;
    return this;
  }

  /**
   * @return {JSON} config ,config of this framework
   * @api public
   */
  GetConfig() {
    return this._config;
  }

  /**
     *
     * @param {String} name  name of the framework
     * @return {Framework}  this framework
     * @api public
     */
  SetName(name) {
    this._name = name.replace(/-/g, '0');
    return this;
  }

  /**
     * @return {String} name
     * @api public
     */
  GetName() {
    return this._name;
  }

  /**
     * @return {JSON} labels
     * @api public
     */
  GetLabels() {
    return JSON.parse(JSON.stringify(this._labels));
  }

  /**
     *
     * @param {String} key  key of the label
     * @param {String} value  value of the label
     * @return {Framework} this
     * @api public
     */
  SetLabel(key, value) {
    this._labels[key] = value;
    return this;
  }

  /**
     *
     * @param {String} key  key of the label
     * @return {String} value of the label
     * @api public
     */
  GetLabel(key) {
    return this._labels[key];
  }

  /**
     * @param {Number} amount try how many times ?
     * @return {Framework} this framework
     * @api public
     */
  SetRetryAmount(amount) {
    this._retry_count = amount;
    return this;
  }

  /**
     * @return {Number} retry amount
     * @api public
     */
  GetRetryAmount() {
    return this._retry_count;
  }

  /**
     *
     * @param {TaskRole} task  The task role
     * @return {Framework} this framework
     * @api public
     */
  AddTask(task) {
    this._tasks.push(task);
    return this;
  }


  /**
   * @return {JSON} resource_usage
   * @api public
   */
  GetResourceUsage() {

    const usage = {};

    for (let i = 0; i < this._tasks.length; i++) {

      const task_usage = this._tasks[i].GetResourceUsage();

      for (const name in task_usage) {
        if (undefined === usage[name]) {
          usage[name] = task_usage[name];
        } else {
          usage[name] = utils.resource_add(usage[name], task_usage[name]);
        }
      }

    }


    return usage;
  }

  /**
     * @return {JSON} framework, the k8s json format of this framework
     * @api public
     */
  toJson() {
    const framework = {
      apiVersion: 'frameworkcontroller.microsoft.com/v1',
      kind: 'Framework',
      metadata: {
        name: this.GetName(),
        labels: this.GetLabels(),
      },
      spec: {
        executionType: 'Start',
        retryPolicy: {
          fancyRetryPolicy: true,
          maxRetryCount: this.GetRetryAmount(),
        },
        taskRoles: [],
      },
    };

    for (let i = 0; i < this._tasks.length; i++) {
      framework.spec.taskRoles.push(this._tasks[i].toJson());
    }

    return framework;
  }
}


module.exports = Framework;
