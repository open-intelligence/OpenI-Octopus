'use strict';

module.exports = {
  ackLifeHookOk() {
    this.textPlain()
    this.body = "OK"
  },
  ackLifeHookRetry() {
    this.textPlain()
    this.body = "RE"
  },
  ackLifeHookException() {
    this.textPlain()
    this.body = "EX"
  },
  textPlain() {
    this.set('Content-Type', 'text/plain')
    this.status =200
  },
  simpleSuccess(result) {
    this.textPlain();
    this.body = result || "success"
  },
  failure(result){
    this.status = 500
    this.body = result
  }
};
