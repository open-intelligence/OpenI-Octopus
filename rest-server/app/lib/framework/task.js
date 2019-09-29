'use strict';
const { EmptyDir, HostPath } = require('./volume');

const utils = require('./utils');

class TaskRole {
  constructor() {
    this._name = 'task' + Math.ceil(Math.random() * 1000) + '_' + Date.now();
    this._task_number = 0;
    this._minfailed = 1;
    this._minsucceeded = -1;
    this._container = null;
    this._initContainers = [];
    this._node_selector = {};
  }
  /**
     * @param {String} name   Name  of  this Task
     * @return {TaskRole} this task role
     * @api public
     *
    */
  SetName(name) {
    this._name = (name || '').toLowerCase().replace(/[^a-z0-9]/g, 'a');
    return this;
  }
  /**
     * @return {String} name
     * @api public
     */
  GetName() {
    return this._name;
  }
  /** SetName
     * @param {Number} amount   The copy number of this task
     * @return {TaskRole} this task role
     * @api public
     */
  SetTaskNumber(amount) {
    this._task_number = amount;
    return this;
  }

  /**
     * @return {Number} task_number
     * @api public
     */

  GetTaskNumber() {
    return this._task_number;
  }

  /**
     * @param {Number} minFailed    min failed copy number of this task
     * @return {TaskRole} this
     * @api public
     */
  SetMinFailed(minFailed) {
    this._minfailed = minFailed;
    return this;
  }

  /**
     * @return {Number} minFailed
     * @api public
     */
  GetMinFailed() {
    return this._minfailed;
  }

  /**
     *
     * @param {Number} minSucceeded  min succeeded number of this task
     * @return {TaskRole} this
     * @api public
     */
  SetMinSucceeded(minSucceeded) {
    this._minsucceeded = minSucceeded;
    return this;
  }

  /**
     * @return {Number} minSucceeded
     * @api public
     */
  GetMinSucceeded() {
    return this._minsucceeded;
  }

  /**
     *
     * @param {Container} container container setting
     * @return {TaskRole} this
     * @api public
     */
  SetContainer(container) {
    this._container = container;
    return this;
  }

  /**
     * @return {Container} task container of this task
     * @api public
    */
  GetContainer() {
    return this._container;
  }
  /** *
     * @param {Container} container  an initcontainer
     * @return {TaskRole} this
     * @api public
     */
  AddInitContainer(container) {
    this._initContainers.push(container);
    return this;
  }

  /**
   *
   * @param {String} key selector name
   * @param {String} value  selector value
   * @return {Framework} this
   * @api public
   */
  SetNodeSelector(key, value) {
    this._node_selector[key] = value;
    return this;
  }

  /**
   *
   * @param {String} key  selector name
   * @return {String}  selector value
   * @api public
   */
  GetNodeSelector(key) {
    return this._node_selector[key];
  }

  /**
   *
   * @param {String} key selector name
   * @api public
   */
  DeleteNodeSelector(key) {
    delete this._node_selector[key];
  }

  /**
   * @return {JSON} resource_usage
   * @api public
   */
  GetResourceUsage() {
    const task_number = this.GetTaskNumber();
    const container_resource_usage = this.GetContainer().GetResourceUsage();
    for (const name in container_resource_usage) {
      container_resource_usage[name] = utils.resource_multiply(container_resource_usage[name], task_number);
    }
    return container_resource_usage;
  }

  /**
     * @return {JSON} task  k8s json format of this task
     * @api public
     */
  toJson() {

    const task = {
      name: this.GetName(),
      taskNumber: this.GetTaskNumber(),
      frameworkAttemptCompletionPolicy: {
        minFailedTaskCount: this.GetMinFailed(),
        minSucceededTaskCount: this.GetMinSucceeded(),
      },
      task: {
        retryPolicy: {
          fancyRetryPolicy: false,
          maxRetryCount: 0,
        },
        pod: {
          spec: {
            restartPolicy: 'Never',
            hostNetwork: false,
            serviceAccountName: 'frameworkbarrier',
            containers: [],
          },
        },
      },
    };

    if (Object.keys(this._node_selector).length > 0) {
      task.task.pod.spec.nodeSelector = {};
      for (const selector in this._node_selector) {
        if (undefined !== this._node_selector[selector]) {
          task.task.pod.spec.nodeSelector[selector] = this._node_selector[selector];
        }
      }
    }

    let mounts = this.GetContainer().GetMountList();

    for (let i = 0; i < this._initContainers.length; i++) {

      const initContainer = this._initContainers[i];

      mounts = mounts.concat(initContainer.GetMountList());

      initContainer.SetName(this._name + 'init-container-' + i);

      if (!Array.isArray(task.task.pod.spec.initContainers)) {
        task.task.pod.spec.initContainers = [];
      }

      task.task.pod.spec.initContainers.push(initContainer.toJson());
    }

    utils.allocate_uniq_name_for_volumes(mounts);

    const filter_map = {};

    for (let i = 0; i < mounts.length; i++) {

      const volume = mounts[i];

      const mount = {};

      if (volume instanceof EmptyDir) {

        mount.emptyDir = {};

        mount.name = volume.GetName();

      }

      if (volume instanceof HostPath) {

        if (!volume.GetMountFrom() || !volume.GetMountTo()) {
          continue;
        }

        mount.name = volume.GetName();

        mount.HostPath = {
          path: volume.GetMountFrom(),
        };
      }

      if (mount.name === undefined) {
        continue;
      }

      if (mount.name in filter_map) {
        continue;
      }

      filter_map[mount.name] = true;

      if (!Array.isArray(task.task.pod.spec.volumes)) {
        task.task.pod.spec.volumes = [];
      }

      task.task.pod.spec.volumes.push(mount);
    }

    this.GetContainer().SetName(this.GetName() + '-container');

    task.task.pod.spec.containers.push(this.GetContainer().toJson());

    return task;
  }

}


module.exports = TaskRole;
