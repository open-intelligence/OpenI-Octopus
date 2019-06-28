'use strict';

class LError extends Error {
  constructor(code, msg) {
    if (typeof msg === 'object') {
      msg = msg.message;
    }

    msg = msg || '';

    super('[' + code.msg + '] - ' + msg);
    this._code = code;
    this._msg = msg;
  }

  toJson() {
    if (!this._msg) {
      return this._code;
    }
    return Object.assign({ payload: this._msg }, this._code);
    // return {
    //   code: this._code.code,
    //   msg: '[' + this._code.msg + '] - ' + this._msg,
    // };
  }
}

module.exports = LError;

