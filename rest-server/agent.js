'use strict';

module.exports = agent => {
  agent.beforeStart(async () => {
    agent.model.sync({ force: false });
  });
};
