const CoreJobAttributeUserId = Symbol('CoreJob#attribute_userid');
const CoreJobAttributeJobKind = Symbol('CoreJob#attribute_jobkind');
const CoreJobAttributeJobName = Symbol('CoreJob#attribute_jobname');
const CoreJobAttributeHeader = Symbol('CoreJob#attribute_header');
const CoreJobAttributeJobDetail = Symbol('CoreJob#attribute_jobdetail');
const CoreJobAttributeJobNamespace = Symbol('CoreJob#attribute_jobNamespace');

class CoreJob {
  constructor() {
    this[CoreJobAttributeUserId] = "";
    this[CoreJobAttributeJobKind] = "";
    this[CoreJobAttributeJobName] = "";
    this[CoreJobAttributeHeader] = {};
    this[CoreJobAttributeJobDetail] = {};
    this[CoreJobAttributeJobNamespace] = "";
  }

  getUserId(){
    return this[CoreJobAttributeUserId]
  }

  setUserId(userId){
    this[CoreJobAttributeUserId] = userId
    return this
  }

  getJobKind(){
    return this[CoreJobAttributeJobKind]
  }

  setJobKind(jobKind){
    this[CoreJobAttributeJobKind] = jobKind
    return this
  }

  getJobName(){
    return this[CoreJobAttributeJobName]
  }

  setJobName(jobName){
    this[CoreJobAttributeJobName] = jobName
    return this
  }

  getHeader(){
    return this[CoreJobAttributeHeader]
  }

  setHeader(header){
    this[CoreJobAttributeHeader] = header
    return this
  }

  getJobDetail(){
    return this[CoreJobAttributeJobDetail]
  }

  setJobDetail(jobDetail){
    this[CoreJobAttributeJobDetail] = jobDetail
    return this
  }

  getJobNamespace(){
    return this[CoreJobAttributeJobNamespace]
  }

  setJobNamespace(jobNamespace){
    this[CoreJobAttributeJobNamespace] = jobNamespace
    return this
  }

  toJson() {
    let job = Object.create(null)
    job['userId'] = this.getUserId()
    job['jobKind'] = this.getJobKind()
    job['jobName'] = this.getJobName()
    job['header'] = this.getHeader()
    job['jobNamespace'] = this.getJobNamespace()
    job['job'] = this.getJobDetail()
    return job
  }
}

module.exports.CoreJob = CoreJob

const CoreJobRecordAttributeJobId = Symbol('CoreJobRecord#attribute_jobId');
const CoreJobRecordAttributeJobType = Symbol('CoreJobRecord#attribute_jobType');
const CoreJobRecordAttributeJobName = Symbol('CoreJobRecord#attribute_jobName');
const CoreJobRecordAttributeUserId = Symbol('CoreJobRecord#attribute_userId');
const CoreJobRecordAttributeOrgId = Symbol('CoreJobRecord#attribute_orgId');
const CoreJobRecordAttributeJobState = Symbol('CoreJobRecord#attribute_jobState');
const CoreJobRecordAttributeJobConfig = Symbol('CoreJobRecord#attribute_jobConfig');
const CoreJobRecordAttributeJobDetail = Symbol('CoreJobRecord#attribute_jobDetail');
const CoreJobRecordAttributeJobNamespace = Symbol('CoreJobRecord#attribute_jobNamespace');
const CoreJobRecordAttributeCreatedAt = Symbol('CoreJobRecord#attribute_createdAt');
const CoreJobRecordAttributeCompletedAt = Symbol('CoreJobRecord#attribute_completedAt');
const CoreJobRecordAttributeResourceUsage = Symbol('CoreJobRecord#attribute_resourceUsage');

class CoreJobRecord {
  constructor() {
    this[CoreJobRecordAttributeJobId] = "";
    this[CoreJobRecordAttributeJobType] = "";
    this[CoreJobRecordAttributeJobName] = "";
    this[CoreJobRecordAttributeOrgId] = "";
    this[CoreJobRecordAttributeUserId] = "";
    this[CoreJobRecordAttributeJobState] = "";
    this[CoreJobRecordAttributeJobConfig] = {};
    this[CoreJobRecordAttributeJobDetail] = {};
    this[CoreJobRecordAttributeJobNamespace] = "";
    this[CoreJobRecordAttributeCreatedAt] = null;
    this[CoreJobRecordAttributeCompletedAt] = null;
    this[CoreJobRecordAttributeResourceUsage] = {};
  }

  get jobId() {return this[CoreJobRecordAttributeJobId]}
  set jobId(v) {this[CoreJobRecordAttributeJobId] = v}

  get jobType() {return this[CoreJobRecordAttributeJobType]}
  set jobType(v) {this[CoreJobRecordAttributeJobType] = v}

  get jobName() {return this[CoreJobRecordAttributeJobName]}
  set jobName(v) {this[CoreJobRecordAttributeJobName] = v}

  get orgId() {return this[CoreJobRecordAttributeOrgId]}
  set orgId(v) {this[CoreJobRecordAttributeOrgId] = v}

  get jobState() {return this[CoreJobRecordAttributeJobState]}
  set jobState(v) {
    if (v && v.toUpperCase){
      let ve = v.toUpperCase()
      this[CoreJobRecordAttributeJobState] = ve
    } else {
      this[CoreJobRecordAttributeJobState] = v
    }
  }

  get userId() {return this[CoreJobRecordAttributeUserId]}
  set userId(v) {this[CoreJobRecordAttributeUserId] = v}

  get jobConfig() {return this[CoreJobRecordAttributeJobConfig]}
  set jobConfig(v) {
    if (v && v.content){
      this[CoreJobRecordAttributeJobConfig] = v.content
    } else {
      this[CoreJobRecordAttributeJobConfig] = v
    }
  }

  get jobDetail() {return this[CoreJobRecordAttributeJobDetail]}
  set jobDetail(v) {this[CoreJobRecordAttributeJobDetail] = v}

  get jobNamespace() {return this[CoreJobRecordAttributeJobNamespace]}
  set jobNamespace(v) {this[CoreJobRecordAttributeJobNamespace] = v}

  get createdAt() {return this[CoreJobRecordAttributeCreatedAt]}
  set createdAt(v) {this[CoreJobRecordAttributeCreatedAt] = v}

  get completedAt() {return this[CoreJobRecordAttributeCompletedAt]}
  set completedAt(v) {this[CoreJobRecordAttributeCompletedAt] = v}

  get resourceUsage() {return this[CoreJobRecordAttributeResourceUsage]}
  set resourceUsage(v) {this[CoreJobRecordAttributeResourceUsage] = v}

  toJson(){
    let record = Object.create(null)
    record.jobId     = this.jobId
    record.jobType   = this.jobType
    record.jobName   = this.jobName
    record.orgId     = this.orgId
    record.jobState  = this.jobState
    record.userId    = this.userId
    record.jobConfig = this.jobConfig
    record.jobDetail = this.jobDetail
    record.createdAt = this.createdAt
    record.completedAt = this.completedAt
    record.jobNamespace = this.jobNamespace
    record.resourceUsage = this.resourceUsage
    return record
    // return {
    //   jobId: this.jobId,
    //   jobType: this.jobType,
    //   jobName: this.jobName,
    //   orgId: this.orgId,
    //   jobState: this.jobState,
    //   userId: this.userId,
    //   jobConfig: this.jobConfig,
    //   jobDetail: this.jobDetail,
    //   jobNamespace: this.jobNamespace,
    //   createdAt: this.createdAt,
    //   completedAt: this.completedAt,
    //   resourceUsage: this.resourceUsage,
    // }

  }

  match(condition={}){
    let matched = false
    if (!condition || Array.isArray(condition || typeof condition != "object")) {
      return !matched
    }
    const conditionPropertyNames = Object.getOwnPropertyNames(condition)
    const self = this.toJson()
    for(let name of conditionPropertyNames){
      if(condition[name] !== self[name]){
        return matched
      }
    }
    return !matched
  }

  matchDeep(){

  }
}

module.exports.CoreJobRecord = CoreJobRecord