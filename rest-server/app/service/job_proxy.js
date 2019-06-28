'use strict';
const Service = require('egg').Service;
// const LError = require('../error/proto');
// const ECode = require('../error/code');
const JOBS = Symbol('JobProxy#jobs');
const USER_JOBS = Symbol('JobProxy#user_jobs');
const PROXY_DB = Symbol('JobProxy#proxy_db');
class JobProxyService extends Service {
  constructor(...args) {
    super(...args);
    this[PROXY_DB] = this.app.proxyDB;
  }

  get [JOBS]() {
    return 'jobs';
  }

  get [USER_JOBS]() {
    return 'userMap';
  }

  get proxyDBPromise() {
    return this[PROXY_DB].read();
  }

  async initDefaultData() {
    await this[PROXY_DB].defaults(this.getJobState()).write();
  }

  async sync() {
    await this.syncJobList();
  }

  getJobState(jobs = [], userMap = {}) {
    return {
      [this[JOBS]]: jobs,
      [this[USER_JOBS]]: userMap,
    };
  }

  async syncJobList() {

    const { service } = this;
    const jobList = await service.job.getJobList({}, false);
    const {userMap} = await this.processUserJobs(jobList);

    await this[PROXY_DB].setState(this.getJobState(jobList, userMap)).write();
    //console.timeEnd("syncJobs");
  }

  async getJobList({ username: userId }) {
    const proxyDB = await this.proxyDBPromise;
    if (userId) {
      return await proxyDB.get(this[JOBS]).filter({ userId }).value();
    }
    return await proxyDB.get(this[JOBS]).value();
  }

  async getUserJobInfo(username) {
    if (!username) {
      return {};
    }
    const proxyDB = await this.proxyDBPromise;
    const userJobInfo = await proxyDB.get(`${this[ USER_JOBS ]}.${username}`).value();
    return userJobInfo || {};
  }

  async processUserJobs(jobs) {
    const userMap = {};
    for (const job of jobs) {
      if (!userMap[job.userId]) {
        userMap[job.userId] = {};
      }

      job.type=job.type?job.type:'debug'; //if job.type is null set it to debug present a gpu type

      let jobTypeStateKey = job.type+"-"+job.state;

      if (userMap[job.userId][jobTypeStateKey]) {
          userMap[job.userId][jobTypeStateKey] += 1;
      } else {
          userMap[job.userId][jobTypeStateKey] = 1;
      }
    }

    return {userMap};
  }

}

module.exports = JobProxyService;
