'use strict';

const { HostPath, EmptyDir } = require('./volume');

/**
 * @param {Array} volume_list  volume list
 * @api private
 */
const allocate_uniq_name_for_volumes = function(volume_list) {

  const name_used = {};

  const host_path_map = {};

  for (let i = 0; i < volume_list.length; i++) {

    const volume = volume_list[i];

    if (volume instanceof EmptyDir) {

      const name = volume.GetName() || 'v';

      name_used[name] = true;

      continue;
    }

    if (volume instanceof HostPath && undefined !== volume.GetMountFrom() && volume.GetMountFrom() !== '') {
      const mount_from = volume.GetMountFrom();
      host_path_map[mount_from] = true;
    }
  }

  const path_list = Object.keys(host_path_map);

  function uniq_name() {
    let seed = Date.now();
    let max_try = 10 * 10000;
    let name = '';
    while (max_try > 0) {
      name = 'mount-' + seed;
      if (name in name_used) {
        seed += 1;
      } else {
        name_used[name] = true;
        break;
      }
      max_try -= 1;
    }
    return name;
  }

  for (let i = 0; i < path_list.length; i++) {
    host_path_map[path_list[i]] = uniq_name();
  }

  for (let i = 0; i < volume_list.length; i++) {

    const volume = volume_list[i];

    if (volume instanceof EmptyDir) {

      const name = volume.GetName() || 'v';

      name_used[name] = true;

      continue;
    }

    if (volume instanceof HostPath && undefined !== volume.GetMountFrom() && volume.GetMountFrom() !== '') {
      const mount_from = volume.GetMountFrom();
      const name = host_path_map[mount_from];
      volume.SetName(name);
    }
  }
};


/**
 *
 * @param {JSON} container The container json data
 * @param {String} command  The command that will be executed
 * @api private
 */
function assign_command_to_json_container(container, command) {

  if (command !== '') {
    if (!Array.isArray(container.command)) {
      container.command = [ 'sh', '-c' ];
    }

    if (container.command.length > 2) {
      container.command[2] = container.command[2] + ' & ' + command;
    } else {
      container.command.push(command);
    }
  }
}

/**
   *
   * @param {JSON} container the container json data
   * @param {JSON} resource the resource that the container will use
   * @api private
   */
function assign_resource_to_json_container(container, resource) {
  const resource_list = Object.keys(resource);
  for (let i = 0; i < resource_list.length; i++) {
    const resource_name = resource_list[i];
    if (undefined === resource[resource_name] || resource[resource_name] === null) {
      continue;
    }
    container.resources = container.resources || { limits: {} };
    const resource_amount = parseFloat(resource[resource_name]);
    if (!isNaN(resource_amount) && resource_amount > 0) {
      container.resources.limits[resource_name] = resource[resource_name];
    }
  }
}

/**
   * @param {JSON} container  the container json data
   * @param {Array} mounts  the volume list which you mount to the container
   * @api private
   */
function assign_volumes_to_json_container(container, mounts) {

  if (!Array.isArray(mounts)) {
    return;
  }

  for (let i = 0; i < mounts.length; i++) {

    const volume = mounts[i];

    if (volume instanceof HostPath) {
      if (!volume.GetMountFrom() || !volume.GetMountTo()) {
        continue;
      }
    }

    const mount = {
      name: volume.GetName(),
      mountPath: volume.GetMountTo(),
    };

    if (volume instanceof HostPath) {
      if (volume.GetReadOnly() === true) {
        mount.readOnly = true;
      }
    }

    if (!Array.isArray(container.volumeMounts)) {
      container.volumeMounts = [];
    }

    container.volumeMounts.push(mount);
  }
}

/**
 * @param {*} value value
 * @param {Number} times  times
 * @return {*} value
 * @api private
 */
function resource_multiply(value, times) {
  if (Object.prototype.toString.call(value) === '[object Number]') {
    return value * times;
  }
  value = value + '';
  const pattern = /\d+([.]\d+)*(\w*)/;
  const matcher = pattern.exec(value);
  const unit = matcher !== null ? matcher[2] : null;
  value = parseFloat(value);
  if (isNaN(value)) {
    return '';
  }
  return value * times + (unit ? unit : 0);
}

/**
   *
   * @param {*} value1 value1
   * @param {*} value2  value2
   * @return {*} value
   * @api private
   */
function resource_add(value1, value2) {
  if (Object.prototype.toString.call(value1) === '[object Number]') {
    return value1 + value2;
  }

  value1 = value1 + '';
  value2 = value2 + '';

  const pattern = /\d+([.]\d+)*(\w*)/;
  let matcher = pattern.exec(value1);
  matcher = matcher !== null ? matcher : pattern.exec(value2);
  const unit = matcher !== null ? matcher[2] : null;
  value1 = parseFloat(value1);
  value2 = parseFloat(value2);
  if (isNaN(value1) || isNaN(value2)) {
    return '';
  }

  return value1 + value2 + (unit ? unit : 0);
}


exports.allocate_uniq_name_for_volumes = allocate_uniq_name_for_volumes;

exports.assign_command_to_json_container = assign_command_to_json_container;

exports.assign_resource_to_json_container = assign_resource_to_json_container;

exports.assign_volumes_to_json_container = assign_volumes_to_json_container;

exports.resource_multiply = resource_multiply;

exports.resource_add = resource_add;
