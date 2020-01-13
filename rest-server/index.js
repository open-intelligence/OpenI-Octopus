'use strict';
const path = require('path');
const libs = require('./lib')
const eggOpener = require('egg-opener');
const EGG_PATH = Symbol.for('egg#eggPath');

class Application extends eggOpener.Application {
  get [EGG_PATH]() {
    return __dirname;
  }
}

class Agent extends eggOpener.Agent {
  get [EGG_PATH]() {
    return __dirname;
  }
}

module.exports = Object.assign(eggOpener, {
  Application,
  Agent
},libs);