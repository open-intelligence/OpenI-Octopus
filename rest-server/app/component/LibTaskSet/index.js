'use strict';

const TaskSet = require('./taskset');
const Container = require('../Common/k8s/container');
const Role = require('./role');
const PodGroup = require("./podgroup");
const { EmptyDir, HostPath } = require('../Common/k8s/volume');

/**
 * @return {TaskSet}  A new TaskSet object
 * @api public
 */
function NewTaskSet() {
  return new TaskSet();
}

/**
 * @return {Container}  A new Container object
 * @api public
 */
function NewContainer() {
  return new Container();
}

/**
 * @return {Role}  A new Role object
 * @api public
 */
function NewRole() {
  return new Role();
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


function NewPodGroup(){
    return new PodGroup();
}

exports.NewPodGroup = NewPodGroup;

exports.NewContainer = NewContainer;

exports.NewTaskSet = NewTaskSet;

exports.NewRole = NewRole;

exports.NewEmptyDirVolume = NewEmptyDirVolume;

exports.NewHostPathVolume = NewHostPathVolume;
