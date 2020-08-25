'use strict';
const { EmptyDir, HostPath } = require('./volume');

const utils = require('./utils');

class Role {

  constructor() {
    this._name = 'role' + Math.ceil(Math.random() * 1000) + '_' + Date.now();
    this._replicas = 0;
    this._maxfailed = 1;
    this._minsucceeded = -1;
    this._container = null;
    this._eventPolicies = [];
    this._initContainers = [];
    this._nodeSelector = {};
    this._annotations = {};
    this._maxRetryAmount = 0;
    this._schedulerName = "default"
  }

  SetSchedulerName(name){
    if (!name) {
      return this
    }
    this._schedulerName = name;
    return this;
  }

  GetSchedulerName(){
    return this._schedulerName;
  }
  SetMaxRetryAmount(amount){
     this._maxRetryAmount = amount;
     return this;
  }

  GetMaxRetryAmount(){
      return this._maxRetryAmount
  }

  AddEventPolicy(event,action){
      this._eventPolicies.push({
          event:event,
          action:action
      });
      return this
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
  /** SetReplicaAmount
     * @param {Number} amount   The copy number of this role
     * @return {Role} this task role
     * @api public
     */
  SetReplicaAmount(amount) {
    this._replicas = amount;
    return this;
  }

  /**
     * @return {Number} replicas
     * @api public
     */

  GetReplicaAmount() {
    return this._replicas;
  }

  /**
     * @param {Number} maxFailed    max failed copy number of this task
     * @return {Role} this
     * @api public
     */
  SetMaxFailed(minFailed) {
    this._maxfailed = minFailed;
    return this;
  }

  /**
     * @return {Number} maxFailed
     * @api public
     */
  GetMaxFailed() {
    return this._maxfailed;
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
   * @return {Role} this
   * @api public
   */
  SetNodeSelector(key, value) {
    this._nodeSelector[key] = value;
    return this;
  }

  /**
   *
   * @param {String} key  selector name
   * @return {String}  selector value
   * @api public
   */
  GetNodeSelector(key) {
    return this._nodeSelector[key];
  }

  /**
   *
   * @param {String} key selector name
   * @api public
   */
  DeleteNodeSelector(key) {
    delete this._nodeSelector[key];
  }

  SetAnnotation(key,value){
      this._annotations[key] = value;
      return this
  }

  GetAnnotation(key){
      return this._annotations[key]
  }

  DeleteAnnotation(key){
      delete this._annotations[key]
  }

  /**
   * @return {JSON} resource_usage
   * @api public
   */
  GetResourceUsage() {
    const replica_amount = this.GetReplicaAmount();
    const container_resource_usage = this.GetContainer().GetResourceUsage();
    for (const name in container_resource_usage) {
      container_resource_usage[name] = utils.resource_multiply(container_resource_usage[name], replica_amount);
    }
    return container_resource_usage;
  }

  _bindNodeSelector(role){
    if(Object.keys(this._nodeSelector).length  == 0){
        return 
    }
    
    role.template.spec.nodeSelector = role.template.spec.nodeSelector || {};
    for (const selector in this._nodeSelector) {
        if (undefined !== this._nodeSelector[selector]) {
            role.template.spec.nodeSelector[selector] = this._nodeSelector[selector];
        }
    }
     
  }

  _bindVolumes(role){

    let mounts = this.GetContainer().GetMountList();

    for (let i = 0; i < this._initContainers.length; i++) {

      const initContainer = this._initContainers[i];

      mounts = mounts.concat(initContainer.GetMountList());
    }

    utils.allocate_uniq_name_for_volumes(mounts);

    const filter_map = {};

    for (let i = 0; i < mounts.length; i++) {

      const volume = mounts[i];

      const mount = {};

      if (volume instanceof EmptyDir) {

        mount.emptyDir = {};

        if (volume.GetMedium() != ''){
          mount.emptyDir.medium = volume.GetMedium()
        }

        if (volume.GetSizeLimit() > 0){
          mount.emptyDir.sizeLimit = volume.GetSizeLimit() + "Mi"
        }

        mount.name = volume.GetName();

      }

      if (volume instanceof HostPath) {

        if (!volume.GetMountFrom() || !volume.GetMountTo()) {
          continue;
        }

        mount.name = volume.GetName();

        mount.hostPath = {
          path: volume.GetMountFrom(),
        };

        if ("" != volume.GetType() && undefined != volume.GetType()){
          mount.hostPath.type = volume.GetType();
        }
        
      }

      if (mount.name === undefined) {
        continue;
      }

      if (mount.name in filter_map) {
        continue;
      }

      filter_map[mount.name] = true;

      if (!Array.isArray(role.template.spec.volumes)) {
        role.template.spec.volumes = [];
      }

      role.template.spec.volumes.push(mount);
    }

  }

  _bindAnnotations(role){

      if( Object.keys(this._annotations).length == 0){
          return 
      }
       
      role.template.metadata =  role.template.metadata || {};
      role.template.metadata.annotations =  role.template.metadata.annotations || {};

      for(let key in this._annotations){
        role.template.metadata.annotations[key] = this._annotations[key];
      }
  }
   /**
     * @return {JSON} task  k8s json format of this task
     * @api public
     */
  toJson(){

    const role = {
        name:this.GetName(),
        replicas:this.GetReplicaAmount(),
        eventPolicy:this._eventPolicies.map(it=>{
            return {
                action:it.action,
                event:it.event
            }
        }),
        completionPolicy:{
            maxFailed:this.GetMaxFailed(),
            minSucceeded: this.GetMinSucceeded()
        },
        retryPolicy:{
            retry:this.GetMaxRetryAmount() > 0,
            maxRetryCount:this.GetMaxRetryAmount()
        },
        template:{
            spec:{
                //serviceAccountName:"poddiscovery",
                //schedulerName:this.GetSchedulerName(),
                restartPolicy: 'Never',
                hostNetwork: false,
                containers: [],
            }
        },
    };

    this._bindNodeSelector(role);

    this._bindAnnotations(role);

    this._bindVolumes(role);

    this.GetContainer().SetName(this.GetName() + '-container');

    role.template.spec.containers.push(this.GetContainer().toJson());

    for (let i = 0; i < this._initContainers.length; i++) {

      const initContainer = this._initContainers[i];

      initContainer.SetName(this._name + 'init-container-' + i);

      if (!Array.isArray(role.template.spec.initContainers)) {
        role.template.spec.initContainers = [];
      }

      role.template.spec.initContainers.push(initContainer.toJson());
    }

    return role;
  }
}


module.exports = Role;
