'use strict';

module.exports = agent => {
  agent.beforeStart(async () => {
    agent.model.sync({ force: false });

    if(agent.config.mailer && agent.config.mailer.options){
      const mailer = await agent.component.Utils.mailer.createMailer(agent.config.mailer.options);
      agent.mailer = mailer;
    }
  });

  agent.messenger.on("manager_email_send", data => {
    if(data && agent.mailer){
      agent.mailer.sendMail(data);
    }
  });
};
