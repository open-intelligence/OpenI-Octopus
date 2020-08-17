const sharehosts = require("./sharehosts");
const fs = require("fs-extra")
const Service = require('egg').Service;
const path = require("path");

class NetdiscoveryService extends Service {

  decorator() {

    try{
      let req = this.ctx.request

      const headers = req.body.header;
      const taskset = req.body.job;
      const policy = "sharehosts"//(headers || {net:{}}).net.discoveryStrategy;

      let err = null;
      let job = null;

      
      switch (policy){
          case "sharehosts": job = sharehosts.bind(taskset, headers, this.config);break;
      }
      

      if (null == job){
          this.ctx.status = 400
          this.ctx.message = "Unsupported Policy:"+ policy
          return
      } 

      this.ctx.status = 200
      this.ctx.body = job
    }catch(e){
      this.ctx.message = e.message
      this.ctx.status = 500
    }
  }

  async removeJobShareHosts(jobId, userId){
    const { sharehosts: ShareHostsConfig } = this.app.config;

    const shareHostsPath = path.join(ShareHostsConfig.shareDirectory, ".otp_workspaces", userId, "share_hosts");
    const shareHostsFrom = path.join(shareHostsPath, jobId);
    const shareHostsTempFrom = path.join(shareHostsPath, `${jobId}.json`);

    await fs.remove(shareHostsFrom);
    await fs.remove(shareHostsTempFrom);
  }
}

module.exports = NetdiscoveryService;