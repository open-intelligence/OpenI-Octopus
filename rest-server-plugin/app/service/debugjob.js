const libCore = require('../../libs/libCore')
const _ = require('lodash');
const Service = require('egg').Service;


class DebugjobService extends Service {

  async lifehook() {
    
    try{
      let req = this.ctx.request
    
      if(req.body.currentState == "running"){

          console.log("debugjob running event: " + JSON.stringify(req.body));

          await this.updateJobConfigState(req.body.id, req.body.namespace, Date.now())
      }

      if (req.body.currentState == "succeeded" || req.body.currentState == "failed" || req.body.currentState == "stopped"){

          console.log("debugjob complete event: " + JSON.stringify(req.body));

          await this.service.k8sutil.stopK8sIngressServiceForDebugJob(req.body.id, req.body.namespace);

          this.removeJobConfigState(req.body.id)
      }
      
      this.ctx.status = 200
    }catch(e){
      this.ctx.message = e.message
      this.ctx.status = 500
    }
  }
  
  async syncJobList() {
    let lastDebugJobRunningTimes = await this.ctx.model.Runtime.findAll();
    this.processUserJobs(lastDebugJobRunningTimes);
  }
  
  async updateJobConfigState(jobId, namespace, beginTime){
    const hasJob = await this.ctx.model.Runtime.count({ where: { 'jobId': jobId} });
    if (!hasJob) {
      await this.ctx.model.Runtime.create({'jobId': jobId, 'namespace': namespace, 'beginTime': beginTime }) 
    }
  }
  
  async removeJobConfigState(jobId){

    const jobInfo = await this.ctx.model.Runtime.findOne({ where: { 'jobId': jobId}, raw: true });

    if (!jobInfo) {
      console.log('JobInfo does not exist');
      return
    }
    await this.ctx.model.Runtime.destroy({where: jobInfo,});
  }
  
  async processUserJobs(debugJobRunningTimes) {
    for (const jobInfo of debugJobRunningTimes) {
      try {
        const jobId = jobInfo.jobId;
        const namespace = jobInfo.namespace;
        const beginTime = jobInfo.beginTime
        console.log(jobId, namespace, beginTime)
        await this.stopOvertimeDebugJob(jobId, namespace, beginTime);
      } catch (e) {
        console.error(e);
      }
    }
  }
  
  async stopOvertimeDebugJob(jobId, namespace, beginTime) {
    const nowTimeStamp = Date.now();
    const span = nowTimeStamp - beginTime;
    const debugJobDuration = 1000 * parseInt(this.config.debugJobDurationMsec);
    console.log(span, debugJobDuration)
    if (span > debugJobDuration) {
      const coreClient = libCore.newCoreClient(this.config.pipeline);
      await coreClient.stopJob(jobId, 'stop debug job because of timeout');
      // lifehook will remove the IngressService
      //await this.service.k8sutil.stopK8sIngressServiceForDebugJob(jobId, namespace);
      //this.removeJobConfigState(jobId)
      console.log("stop a debug job because of timeout: " + jobId)
    }
  }

}
module.exports = DebugjobService;