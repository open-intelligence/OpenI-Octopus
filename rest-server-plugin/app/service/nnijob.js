const libCore = require('../../libs/libCore')
const _ = require('lodash');
const Service = require('egg').Service;


class NNIjobService extends Service {

  async lifehook() {

    try{
      
      let req = this.ctx.request

      if (req.body.currentState == "succeeded" || req.body.currentState == "failed" || req.body.currentState == "stopped"){        
        
        console.log("nnijob complete event: " + JSON.stringify(req.body));

        await this.service.k8sutil.stopK8sIngressServiceForNNIJob(req.body.id, req.body.namespace);
      
      }
      
      this.ctx.status = 200
    }catch(e){
      this.ctx.message = e.message
      this.ctx.status = 500
  }
}
}

module.exports = NNIjobService;