'use strict';

const utils = require('./utils');


class Container {
  constructor() {
    this._name = '';

    this._resource = {
      cpu: 0,
      memory: 0,
    };

    this._env = {}

    this._command = '';

    this._image = '';

    this._mounts = [];

    this._securityCapabilities = [];
  }
  /**
     * @param {String} name  name of this container
     * @return {Container} this
     * @api public
     */
  SetName(name) {
    this._name = name;
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
     * @return {JSON} resource
     * @api public
     */
  GetResourceUsage() {
    return JSON.parse(JSON.stringify(this._resource));
  }

  /**
   *
   * @param {String} name custome resource name
   * @param {*} amount  amount of this kind of resource
   * @return {Container} this;
   * @api public
   */
  SetCustomResource(name, amount) {
    this._resource[name] = amount;
    return this;
  }

  /**
   *
   * @param {String} name custom resource name
   * @return {*} resource
   * @api private
   */
  GetCustomResouce(name) {
    return this._resource[name];
  }

   /**
   *
   * @param {String} name env name
   * @param {*} val  value of this env
   * @return {Container} this;val
   * @api public
   */
  SetEnv(name, val) {
    this._env[name] = val;
    return this;
  }

  /**
   *
   * @return {*} env value
   * @api private
   */
  GetEnv() {
    return this._env;
  }

  /**
     *
     * @param {Number} amount  the cpu amount of this container
     * @return {Container} this
     * @api public
     */
  SetCpu(amount) {
    this._resource.cpu = amount;
    return this;
  }
  /**
     * @return {Number} cpu
     * @api public
     */
  GetCpu() {
    return this._resource.cpu;
  }

  /**
     * @param {Number} memory  the memory (MB) usage of this container
     * @return {Container} this;
     * @api public
     */
  SetMemoryMb(memory) {

    if (!Number.isInteger(memory)) {
      memory = parseInt(memory);
    }

    if (!Number.isInteger(memory) || Number.isNaN(memory) || memory < 1024) {
      memory = 1024;
    }

    this._resource.memory = memory + 'Mi';

    return this;
  }

  /**
     * @return {Number} memory
     * @api public
     */
  GetMemoryMb() {
    return this._resource.memory;
  }

  /**
     * @param {String} image   docker image
     * @return {Container} this
     * @api public
     */
  SetImage(image) {
    this._image = image;
    return this;
  }

  /**
     * @return {String} image
     * @api public
     */
  GetImage() {
    return this._image;
  }

  /**
     * @param {String} command  The command that will be executed when the container start
     * @return {Container} this
     * @api public
     */
  SetCommand(command) {
    this._command = command;
    return this;
  }

  /**
     * @return {String} command
     * @api public
     */
  GetCommand() {
    return this._command;
  }

  /**
     *
     * @param {Volume} volume  The volume that you mount to this container
     * @return {Container} this
     * @api public
     */
  Mount(volume) {
    this._mounts.push(volume);
    return this;
  }

  /**
   * @return {Array} mounts  The volume list that you mount to this container
   * @api public
   */
  GetMountList() {
    return this._mounts;
  }

  AddSecurityCapabilities(securityCapability){
    this._securityCapabilities.push(securityCapability);
    return this;
  }

  GetSecurityCapabilities() {
    return this._securityCapabilities;
  }


  /**
     * @return {JSON} container the k8s json format of container
     * @api public
     */
  toJson() {

    const container = {
      name: this._name,
      image: this._image,
    };

    utils.assign_env_to_json_container(container, this.GetEnv());

    utils.assign_command_to_json_container(container, this.GetCommand());

    utils.assign_resource_to_json_container(container, this.GetResourceUsage());

    utils.assign_volumes_to_json_container(container, this.GetMountList());

    utils.assign_securityCapabilities_to_json_container(container, this.GetSecurityCapabilities());

    return container;
  }

}


module.exports = Container;
