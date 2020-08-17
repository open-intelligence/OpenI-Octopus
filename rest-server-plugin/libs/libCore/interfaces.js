const CoreType = require("./type")

module.exports = {
  submitJob: function(job) {
    if (!job instanceof CoreType.CoreJob) {
      throw new TypeError("job must be instance of CoreJob")
    }
    return this.request({
      method: "POST",
      uri: "/v1/job/",
      body: job.toJson()
    })
  },
  stopJob: function(jobId, reason) {
    if(!jobId) {
      throw new TypeError("jobId can not be null")
    }
    return this.request({
      method: "PUT",
      uri: "/v1/job/stop/" + jobId,
      body: {
        jobID: jobId,
        reason: reason
      }
    })
  },
  resumeJob: function(jobId, reason) {
    if(!jobId) {
      throw new TypeError("jobId can not be null")
    }
    return this.request({
      method: "PUT",
      uri: "/v1/job/resume/" + jobId,
      body: {
        jobID: jobId,
        reason: reason
      }
    })
  },
  getJobConfig: function(jobId){
    if (!jobId) {
      throw new TypeError("job id is null")
    }
    return this.request({
      method: "GET",
      uri: "/v1/job/config/" + jobId,
    })
  },
  getJobDetail: function(jobId){
    if (!jobId) {
      throw new TypeError("job id is null")
    }
    return this.request({
      method: "GET",
      uri: "/v1/job/detail/" + jobId,
    })
  },
  getJobTaskset: function(jobId){
    if (!jobId) {
      throw new TypeError("job id is null")
    }
    return this.request({
      method: "GET",
      uri: "/v1/job/taskset/" + jobId,
    })
  },
  getJobList: function({userId: userID, jobName: name,jobType: kind, jobState: state, order, pageNumber, pageSize, startAt, endAt}){
    return this.request({
      method: "GET",
      uri: "/v1/job/list",
      qs: {userID, name, kind, state, order, pageNumber, pageSize, startAt, endAt},
    })
  },
  GetJobCount: function({userId: userID, jobName: name, jobType: kind, jobState: state, order, pageNumber, pageSize, startAt, endAt}){
    return this.request({
      method: "GET",
      uri: "/v1/job/count",
      qs: {userID, name, kind, state, order, pageNumber, pageSize, startAt, endAt},
    })
  }
}