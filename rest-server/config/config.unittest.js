'use strict';

module.exports = () => {
  const config = exports = require('./config.local')();

  return config;
};
