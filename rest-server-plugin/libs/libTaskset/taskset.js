'use strict';

const utils = require('./utils');


class TaskSet {
  constructor() {
    this._name = 'taskset' + Math.ceil(Math.random() * 1000) + '_' + Date.now();
    this._maxRetryCount = 0;
    this._roles = [];
    this._labels = {};
    this._config = {};
    this._namespace = "default";
  }
  SetNamespace(space){
    this._namespace = space;
    return this;
  }

  GetNamespace(){
    return this._namespace;
  }
  /**
   *
   * @param {JSON} config config of this TaskSet
   * @return {TaskSet} this
   * @api public
   */
  SetConfig(config) {
    this._config = config;
    return this;
  }

  /**
   * @return {JSON} config ,config of this TaskSet
   * @api public
   */
  GetConfig() {
    return this._config;
  }

  /**
     *
     * @param {String} name  name of the TaskSet
     * @return {TaskSet}  this TaskSet
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
     * @return {TaskSet} this
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
     * @return {TaskSet} this TaskSet
     * @api public
     */
  SetRetryAmount(amount) {
    this._maxRetryCount = amount;
    return this;
  }

  /**
     * @return {Number} retry amount
     * @api public
     */
  GetRetryAmount() {
    return this._maxRetryCount;
  }

  /**
     *
     * @param {Role} role  The task role
     * @return {TaskSet} this TaskSet
     * @api public
     */
  AddRole(role) {
    this._roles.push(role);
    return this;
  }


  /**
   * @return {JSON} resource_usage
   * @api public
   */
  GetResourceUsage() {

    const usage = {};

    for (let i = 0; i < this._roles.length; i++) {

      const task_usage = this._roles[i].GetResourceUsage();

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
     * @return {JSON} taskset, the k8s json format of this taskset
     * @api public  
     */
  toJson(){
      const taskset = {
        apiVersion:"octopus.openi.pcl.cn/v1alpha1",
        kind:"TaskSet",
        metadata:{
            namespace: this.GetNamespace(),
            name:this.GetName(),
            labels:this.GetLabels(),
        },
        spec:{
            retryPolicy:{
                retry:this.GetRetryAmount()>0,
                maxRetryCount:this.GetRetryAmount(),
            },
            roles:[]
        }
      };

      for (let i = 0; i < this._roles.length; i++) {
        taskset.spec.roles.push(this._roles[i].toJson());
      }
  
      return taskset;
  }
}


module.exports = TaskSet;
