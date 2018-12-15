// module dependencies
const Job = require('../models/job');
const createError = require('../util/error');
const logger = require('../config/logger');
const getOperationLogger = require('../config/operationlogger');
const config = require('../config/index');
const fse = require('fs-extra');
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const path = require('path');
 

const getJobLimitConfig = (filepath) =>{
    try {
        fse.ensureDirSync(path.dirname(filepath));
        let adapter = new FileSync(filepath);
        let jobdb = low(adapter);
        return jobdb;
    }catch(err){
        logger.info("Load /var/pai/rest-server/joblimit.json Error");
    }
    return null;
}


const taskRolesNum = (jobConfig) => {
    return Object.getOwnPropertyNames(jobConfig.taskRoles).length;
}


const severalNum = (jobConfig) =>{
    let rolesNum = taskRolesNum(jobConfig);
    let cpuNum = 0;
    let gpuNum = 0;
    let mem =0;
    let taskNum = 0;
    for(let i=0; i<rolesNum-1; ++i){
        cpuNum += parseInt(jobConfig.taskRoles[i].cpuNumber) * parseInt(jobConfig.taskRoles[i].taskNumber);
        gpuNum += parseInt(jobConfig.taskRoles[i].gpuNumber) * parseInt(jobConfig.taskRoles[i].taskNumber);
        mem += parseInt(jobConfig.taskRoles[i].memoryMB) * parseInt(jobConfig.taskRoles[i].taskNumber);
        taskNum += parseInt(jobConfig.taskRoles[i].taskNumber);
    }
    let numJson ={
        "tasknum": taskNum,
        "cpuNum": cpuNum,
        "gpuNum": gpuNum,
        "mem": mem,
    };
    return numJson;
}


const isUserInLimitList = (jobDb, req) =>{
    if(jobDb.get("username").value() === undefined){
        logger.warn("Config File /var/pai/rest-server/joblimit.json has no username item!!!");
        return false;
    }else if( jobDb.get("username").value().indexOf(req.cookies.email) !== -1){
        return true;
    }else{
        return false;
    }
}


const ifOverLimit = (numJson, jobDb) =>{
    //if jobDb is empty, all if statement will be true. So it has no need to determine if jobDb has"tasknum", "cpunum"…
    let taskNumLimit = parseInt(jobDb.get("tasknum").value());
    let cpuLimit = parseInt(jobDb.get("cpunum").value());
    let memLimit = parseInt(jobDb.get("mem").value());
    let gpuLimit = parseInt(jobDb.get("gpunum").value());

    if(parseInt(numJson.taskNum) > taskNumLimit){
        let taskNumString = "Over limited, most Task number is " + taskNumLimit;
        return taskNumString;
    }else if((parseInt(numJson.cpuNum)) > cpuLimit){
        let cpuString = "Over limited, most CPU number is " + cpuLimit;
        return cpuString;
    }else if(parseInt(numJson.mem) > memLimit){
        let memString = "Over limited, most Mem is " + memLimit;
        return memString;
    }else if(parseInt(numJson.gpuNum) > gpuLimit){
        let gpuString = "Over limited, most GPU number is " + gpuLimit;
        return gpuString;
    }else{
        return "OK";
    }
}

/**
 * Load job and append to req.
 */
const load = (req, res, next, jobName) => {
    new Job(jobName, (job, error) => {
        if (error) {
            if (error.code === 'NoJobError') {
                if (req.method !== 'PUT') {
                    logger.warn('load job %s error, could not find job', jobName);
                    getOperationLogger("rest-server").warn("Load job %s error, could not find job.", jobName);
                    return next(error);;
                }
            } else {
                logger.warn('internal server error');
                getOperationLogger("rest-server").warn("Load job %s, Get internal server error.", jobName);
                return next(createError.unknown(error));
            }
        } else {
            if (job.jobStatus.state !== 'JOB_NOT_FOUND' && req.method === 'PUT' && req.path === `/${jobName}`) {
                logger.warn('duplicate job %s', jobName);
                getOperationLogger("rest-server").warn("Submits a duplication job %s.", jobName);
                return next(createError('Conflict', 'ConflictJobError', `Job name ${jobName} already exists`));
            }
        }
        getOperationLogger("rest-server").info("Load job %s successfully.", jobName);
        req.job = job;
        return next();
    });
};

const init = (req, res, next) => {
    const jobName = req.body.jobName;
    new Job(jobName, (job, error) => {
        if (error) {
            if (error.code === 'NoJobError') {
                req.job = job;
                next();
            } else {
                logger.warn('internal server error');
                return next(createError.unknown(error));
            }
        } else {
            logger.warn('duplicate job %s', jobName);
            return next(createError('Conflict', 'ConflictJobError', `Job name ${jobName} already exists`));
        }
    });
};

/**
 * Get list of jobs.
 */
const list = (req, res, next) => {
    logger.info(JSON.stringify(req._query));
    Job.prototype.getJobList(req._query, (jobList, err) => {
        if (err) {
            logger.warn('list jobs error\n%s', err.stack);
            return next(createError.unknown(err));
        } else if (jobList === undefined) {
            logger.warn('list jobs error, no job found');
            return res.status(500).json({
                error: 'JobListNotFound',
                message: 'could not find job list',
            });
        } else if (jobList.length === 0) {
            logger.warn('user %s has no match job list', req.user.username);
            return res.status(500).json({
                error: 'UserHasNoJobList',
                message: 'could not find job list',
            });
        } else {
            return res.status(200).json(jobList);
        }
    });
};
 
 
/**
 * Get job status.
 */
const get = (req, res) => {
    getOperationLogger("rest-server").info("Get user %s's job %s status successfully.", req.job.jobStatus.username, req.job.name);
    return res.json(req.job);
};

/**
 * Submit or update job.
 */
const update = (req, res) => {
    let name = req.job.name;
    let data = req.body;
    data.originalData = req.originalBody;
    data.userName = req.user.username;

    let jobLimitDb = getJobLimitConfig(config.jobLimit);
    let numJson = severalNum(data);
    let isResOver = ifOverLimit(numJson, jobLimitDb);
    let isUserLimit = isUserInLimitList(jobLimitDb, req);
    logger.info("[update Job]: does user in limit list? %d", isUserLimit);
    //Limit all users when islimit is true. Limit single user when islimit is false and username in limit list.
    if(jobLimitDb.get("islimit").value() === true || isUserLimit){
        if(isResOver !== "OK"){
            return res.status(501).json({
                error: isResOver,
                message: isResOver,
            })
        }
    }

    Job.prototype.putJob(name, data, (err) => {
        if (err) {
            logger.warn('update job %s error\n%s', name, err.stack);
            if (err.message === 'VirtualClusterNotFound') {
                getOperationLogger("rest-server").warn("Submit user %s's job %s Error: VirtualClusterNotFound.", req.user.username, name);
                return res.status(500).json({
                    error: 'JobUpdateWithInvalidVirtualCluster',
                    message: `job update error: could not find virtual cluster ${data.virtualCluster}`,
                });
            } else if (err.message === 'NoRightAccessVirtualCluster') {
                getOperationLogger("rest-server").warn("Submit user %s's job %s Error:NoRightAccessVirtualCluster.", req.user.username, name);
                return res.status(401).json({
                    error: 'JobUpdateWithNoRightVirtualCluster',
                    message: `job update error: no virtual cluster right to access ${data.virtualCluster}`,
                });
            } else {
                getOperationLogger("rest-server").warn("Submit user %s's job %s Error.", req.user.username, name);
                return res.status(500).json({
                    error: 'JobUpdateError',
                    message: err.message,
                });
            }
        } else {
            getOperationLogger("rest-server").info("Submit user %s's job %s successfully.", req.user.username, name);
            return res.status(202).json({
                message: `update job ${name} successfully`,
            });
        }
    });
};

/**
 * Remove job.
 */
const remove = (req, res) => {
    req.body.username = req.user.username;
    req.body.admin = req.user.admin;
    Job.prototype.deleteJob(req.job.name, req.body, (err) => {
        if (err) {
            logger.warn('delete job %s error\n%s', req.job.name, err.stack);
            return res.status(403).json({
                error: 'JobDeleteError',
                message: 'job deleted error, cannot delete other user\'s job',
            });
        } else {
            return res.status(202).json({
                message: `deleted job ${req.job.name} successfully`,
            });
        }
    });
};

/**
 * Start or stop job.
 */
const execute = (req, res, next) => {
    req.body.username = req.user.username;
    req.body.admin = req.user.admin;
    Job.prototype.putJobExecutionType(req.job.name, req.body, (err) => {
        if (err) {
            logger.warn('execute job %s error\n%s', req.job.name, err.stack);
            getOperationLogger("rest-server").warn("Execute user %s's job %s %s ERROR.\n%s", req.user.username, req.job.name, req.body.value, err.stack);
            err.message = err.message || 'job execute error';
            next(err);
        } else {
            getOperationLogger("rest-server").info("Execute user %s's job %s %s successfully.", req.user.username, req.job.name, req.body.value);
            return res.status(202).json({
                message: `execute job ${req.job.name} successfully`,
            });
        }
    });
};

/**
 * Get job config json string.
 */
const getConfig = (req, res, next) => {
    Job.prototype.getJobConfig(
        req.job.jobStatus.username,
        req.job.name,
        (error, result) => {
            if (!error) {
                getOperationLogger("rest-server").info("Get user %s's job %s successfully", req.job.jobStatus.username, req.job.name);
                return res.status(200).json(result);
            } else if (error.message.startsWith('[WebHDFS] 404')) {
                getOperationLogger("rest-server").warn("Get user %s's job %s ERROR: ConfigFileNotFound", req.job.jobStatus.username, req.job.name);
                return next(createError('Not Found', 'NoJobConfigError', `Config of job ${req.job.name} is not found.`));

            } else {
                getOperationLogger("rest-server").warn("Get user %s's job %s ERROR: InternalServerError", req.job.jobStatus.username, req.job.name);
                return next(createError.unknown(error));
            }
        }
    );
};

/**
 * Get job SSH info.
 */
const getSshInfo = (req, res, next) => {
    Job.prototype.getJobSshInfo(
        req.job.jobStatus.username,
        req.job.name,
        req.job.jobStatus.appId,
        (error, result) => {
            if (!error) {
                getOperationLogger("rest-server").info("Get user %s's job %s ssh info successfully", req.job.jobStatus.username, req.job.name);
                return res.status(200).json(result);
            } else if (error.message.startsWith('[WebHDFS] 404')) {
                getOperationLogger("rest-server").warn("Get user %s's job %s  ssh info ERROR: SshInfoNotFound", req.job.jobStatus.username, req.job.name);
                return next(createError('Not Found', 'NoJobSshInfoError', `SSH info of job ${req.job.name} is not found.`));
            } else {
                getOperationLogger("rest-server").warn("Get user %s's job %s  ssh info ERROR: InternalServerError", req.job.jobStatus.username, req.job.name);
                return next(createError.unknown(error));
            }
        }
    );
};
 
 

// module exports
module.exports = {
   
    load,
    init,
    list,
    get,
    update,
    remove,
    execute,
    getConfig,
    getSshInfo
    
};