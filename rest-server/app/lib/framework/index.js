'use strict';

const Framework = require('./framework');
const Container = require('./container');
const TaskRole = require('./task');
const { EmptyDir, HostPath } = require('./volume');

/**
 * @return {Framework}  A new Framework object
 * @api public
 */
function NewFrameWork() {
  return new Framework();
}

/**
 * @return {Container}  A new Container object
 * @api public
 */
function NewContainer() {
  return new Container();
}

/**
 * @return {TaskRole}  A new TaskRole object
 * @api public
 */
function NewTaskRole() {
  return new TaskRole();
}

/**
 * @return {EmptyDir} A new EmptyDir volume object
 * @api public
 */
function NewEmptyDirVolume() {
  return new EmptyDir();
}

/**
 * @return {HostPath} A new HostPath volume object
 * @api public
 */
function NewHostPathVolume() {
  return new HostPath();
}


exports.NewContainer = NewContainer;

exports.NewFrameWork = NewFrameWork;

exports.NewTaskRole = NewTaskRole;

exports.NewEmptyDirVolume = NewEmptyDirVolume;

exports.NewHostPathVolume = NewHostPathVolume;
