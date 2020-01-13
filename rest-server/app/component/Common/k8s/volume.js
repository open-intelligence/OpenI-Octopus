'use strict';

class EmptyDir {
  constructor() {
    this._name = '';
    this._to = '';
  }
  /**
      *
      * @param {String} name  name of this volume
      * @return {EmptyDir} this
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
      *
      * @param {String} to  the path where this volume mount to
      * @return {EmptyDir} this
      * @api public
      */
  SetMountTo(to) {
    this._to = to;
    return this;
  }

  /**
      * @return {String}  to ,the path where this volume mount to
      * @api public
      */
  GetMountTo() {
    return this._to;
  }
}


class HostPath {

  constructor() {
    this._name = '';
    this._from = '';
    this._to = '';
    this._readOnly = false;
    this._type = "";
  }

  SetType(type){
    this._type = type;
    return this
  }

  GetType(){
    return this._type;
  }

  /**
      *
      * @param {String} name   name of this volume
      * @return {HostPath} this
      * @api public
      */
  SetName(name) {
    this._name = name;
    return this;
  }
  /**
      * @return {String}  name of this volume
      * @api public
      */
  GetName() {
    return this._name;
  }
  /**
      *
      * @param {String} from the path where this volume mount from
      * @return {HostPath} this
      * @api public
      */
  SetMountFrom(from) {
    this._from = from;
    return this;
  }

  /**
      * @return {String} from ,the path where this volume mount from
      * @api public
      */
  GetMountFrom() {
    return this._from;
  }

  /**
      *
      * @param {String} to  the path where this volume mount to
      * @return {HostPath} this
      * @api public
      */
  SetMountTo(to) {
    this._to = to;
    return this;
  }

  /**
      * @return  {String} to , the path where this volume mount to
      * @api public
      */
  GetMountTo() {
    return this._to;
  }

  /**
      *
      * @param {Boolean} readOnly  if the volume is read-only
      * @return {HostPath}  this
      * @api public
      */
  SetReadOnly(readOnly) {
    this._readOnly = readOnly;
    return this;
  }

  /**
      * @return {Boolean}  if the volume is read-only
      * @api public
      */
  GetReadOnly() {
    return this._readOnly;
  }
}


exports.EmptyDir = EmptyDir;

exports.HostPath = HostPath;
