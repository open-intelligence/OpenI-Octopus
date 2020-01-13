'use strict';

const ECode = require('./code');

class LError extends Error {
  constructor(cobj, msg) {
    if (typeof msg === 'object') {
      msg = msg.message;
    }
    msg = msg || '';

    if (typeof cobj !== 'object') {
      cobj = Object.assign(ECode.FAILURE,{msg :cobj});
    }

    super('[' + cobj.msg + ']' + (msg?`-${msg}`:''));
    this._code = cobj;
    this._msg = msg || cobj.msg;
  }

  toJson() {
    // if (!this._msg) {
    //   return this._code;
    // }
    // return Object.assign({ payload: this._msg }, this._code);
    return {
      code: this._code.code,
      msg: this._msg,
      payload: this._code.msg
    };
  }
}

module.exports = LError;

