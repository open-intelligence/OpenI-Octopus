// Copyright (c) Microsoft Corporation
// All rights reserved.
//
// MIT License
//
// Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated
// documentation files (the "Software"), to deal in the Software without restriction, including without limitation
// the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and
// to permit persons to whom the Software is furnished to do so, subject to the following conditions:
// The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING
// BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
// NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

'use strict';

const Service = require('egg').Service;
const execa = require('execa');
const mustache = require('mustache');
const ipmaptable = require('../../util/ipMapTable');
const Hdfs = require('../../util/hdsf');
const fs = require('fs');
const LError = require('../error/proto');
const ECode = require('../error/code');
const yarnContainerScriptTemplate = require('../templates/yarnContainerScript');
const dockerContainerScriptTemplate = require('../templates/dockerContainerScript');

class TokenService extends Service {

  constructor(...args) {
    super(...args);
    this.launcherConfig = this.config.launcherConfig;
  }

  async _invokeService(url, options = { dataType: 'json' }) {
    const launcherConfig = this.launcherConfig;
    const requestRes = await this.ctx.curl(url,
      Object.assign({ headers: launcherConfig.webserviceRequestHeaders }, options)
    );
    // if (requestRes.status !== 200) {
    //   throw new LError(ECode.REMOTE_INVOKE_ERROR, requestRes.data);
    // }
    const requestResJson = typeof requestRes.data === 'object' ?
      requestRes.data : JSON.parse(requestRes.data);
    return requestResJson;
  }

  async checkMinTaskNumber(job) {
    if ('killAllOnCompletedTaskNumber' in job) {
      const errorMessage = 'killAllOnCompletedTaskNumber has been obsoleted, please use minFailedTaskCount and minSucceededTaskCount instead.';
      throw new LError(ECode.INVALID_PARAM, errorMessage);

    }
    for (let i = 0; i < job.taskRoles.length; i++) {
      const taskNumber = job.taskRoles[i].taskNumber;
      const minFailedTaskCount = job.taskRoles[i].minFailedTaskCount || 0;
      const minSucceededTaskCount = job.taskRoles[i].minSucceededTaskCount || 0;
      if (minFailedTaskCount > taskNumber || minSucceededTaskCount > taskNumber) {
        const errorMessage = 'minFailedTaskCount or minSucceededTaskCount should not be greater than tasks number.';
        throw new LError(ECode.INVALID_PARAM, errorMessage);
      }
    }
  }

  async getJob(jobName) {
    const launcherConfig = this.launcherConfig;
    const frameworkPath = launcherConfig.frameworkPath(jobName);
    const requestResJson = await this._invokeService(frameworkPath);
    if (!requestResJson) {
      throw new LError(ECode.NOT_FOUND, `Job ${jobName} is not found.`);
    }
    if (requestResJson.exception) {
      return;
    }
    const jobDetail = await this.generateJobDetail(requestResJson);
    return Object.assign({ name: jobName }, jobDetail);
  }

  async putJob(name, data) {
    const launcherConfig = this.launcherConfig;
    if (!data.originalData.outputDir) {
      data.outputDir = `${launcherConfig.hdfsUri}/Output/${data.userName}/${name}`;
    }
    for (const fsPath of [ 'authFile', 'dataDir', 'outputDir', 'codeDir' ]) {
      data[fsPath] = data[fsPath].replace('$PAI_DEFAULT_FS_URI', launcherConfig.hdfsUri);
      data[fsPath] = data[fsPath].replace(/\$PAI_JOB_NAME(?![\w\d])/g, name);
      data[fsPath] = data[fsPath].replace(/(\$PAI_USER_NAME|\$PAI_USERNAME)(?![\w\d])/g, data.userName);
    }
    await this.service.user.checkUserVc(data.userName, data.virtualCluster);

    await this._initializeJobContextRootFolders();
    await this._prepareJobContext(name, data);
    await this._invokeService(launcherConfig.frameworkPath(name), { method: 'PUT', data: this.generateFrameworkDescription(data) });

  }

  async _initializeJobContextRootFolders() {
    const launcherConfig = this.launcherConfig;
    const hdfs = new Hdfs(launcherConfig.webhdfsUri);
    const hdfsTasks = [
      hdfs.createFolder(
        '/Output',
        { 'user.name': 'root', permission: '777' }
      ),
      hdfs.createFolder(
        '/Container',
        { 'user.name': 'root', permission: '777' }
      ),
    ];
    await Promise.all(hdfsTasks);
  }

  async _prepareJobContext(name, data) {
    const launcherConfig = this.launcherConfig;
    const hdfs = new Hdfs(launcherConfig.webhdfsUri);
    const hdfsTasks = [
      hdfs.createFile(
        `/Container/${data.userName}/${name}/${launcherConfig.jobConfigFileName}`,
        JSON.stringify(data.originalData, null, 2),
        { 'user.name': data.userName, permission: '644', overwrite: 'true' }
      ),
      hdfs.createFile(
        `/Container/${data.userName}/${name}/${launcherConfig.frameworkDescriptionFilename}`,
        JSON.stringify(this.generateFrameworkDescription(data), null, 2),
        { 'user.name': data.userName, permission: '644', overwrite: 'true' }
      ),
      Promise.each([ 'log', 'tmp', 'finished' ], x => {
        return hdfs.createFolder(
          `/Container/${data.userName}/${name}/` + x,
          { 'user.name': data.userName, permission: '755' }
        );
      }),
      Promise.each([ ...Array(data.taskRoles.length).keys() ], x => {
        return hdfs.createFile(
          `/Container/${data.userName}/${name}/YarnContainerScripts/${x}.sh`,
          this.generateYarnContainerScript(data, x),
          { 'user.name': data.userName, permission: '644', overwrite: 'true' }
        );
      }),
      Promise.each([ ...Array(data.taskRoles.length).keys() ], x => {
        return hdfs.createFile(
          `/Container/${data.userName}/${name}/DockerContainerScripts/${x}.sh`,
          this.generateDockerContainerScript(data, x),
          { 'user.name': data.userName, permission: '644', overwrite: 'true' }
        );
      }),
    ];
    if (!data.originalData.outputDir) {
      hdfsTasks.push(
        hdfs.createFolder(
          `/Output/${data.userName}/${name}`,
          { 'user.name': data.userName, permission: '755' }
        )
      );
    }

    await Promise.all(hdfsTasks);
  }

  generateYarnContainerScript(data, idx) {
    const launcherConfig = this.launcherConfig;
    const jobInfo = {
      idx,
      hdfsUri: launcherConfig.hdfsUri,
      taskData: data.taskRoles[idx],
      jobData: data,
      cluster_id: this.config.clusterId,
    };

    const debugClusters = this.config.virtualDebugClusters;

    if (debugClusters.indexOf(data.virtualCluster) > -1) {
      jobInfo.debug = 1;
    }
    const yarnContainerScript = mustache.render(
      yarnContainerScriptTemplate, jobInfo);
    return yarnContainerScript;
  }

  generateDockerContainerScript(data, idx) {
    const launcherConfig = this.launcherConfig;
    let tasksNumber = 0;
    for (let i = 0; i < data.taskRoles.length; i++) {
      tasksNumber += data.taskRoles[i].taskNumber;
    }

    const jobInfo = {
      idx,
      tasksNumber,
      taskRoleList: data.taskRoles.map(x => x.name).join(','),
      taskRolesNumber: data.taskRoles.length,
      hdfsUri: launcherConfig.hdfsUri,
      taskData: data.taskRoles[idx],
      jobData: data,
    };

    const debugClusters = this.config.virtualDebugClusters;

    if (debugClusters.indexOf(data.virtualCluster) > -1) {
      jobInfo.debug = 1;
    }

    const dockerContainerScript = mustache.render(
      dockerContainerScriptTemplate, jobInfo);
    return dockerContainerScript;
  }
  generateFrameworkDescription(data) {
    const gpuType = data.gpuType || null;
    const fancyRetryPolicy = (data.retryCount !== -2);
    const virtualCluster = (!data.virtualCluster) ? 'default' : data.virtualCluster;
    const frameworkDescription = {
      version: 10,
      user: {
        name: data.userName,
      },
      retryPolicy: {
        maxRetryCount: data.retryCount,
        fancyRetryPolicy,
      },
      taskRoles: {},
      platformSpecificParameters: {
        queue: virtualCluster,
        taskNodeGpuType: gpuType,
        gangAllocation: true,
      },
    };
    for (let i = 0; i < data.taskRoles.length; i++) {
      const portList = {};
      for (let j = 0; j < data.taskRoles[i].portList.length; j++) {
        portList[data.taskRoles[i].portList[j].label] = {
          start: data.taskRoles[i].portList[j].beginAt,
          count: data.taskRoles[i].portList[j].portNumber,
        };
      }
      for (const defaultPortLabel of [ 'http', 'ssh' ]) {
        if (!(defaultPortLabel in portList)) {
          portList[defaultPortLabel] = {
            start: 0,
            count: 1,
          };
        }
      }
      const taskRole = {
        taskNumber: data.taskRoles[i].taskNumber,
        taskService: {
          version: 0,
          entryPoint: `source YarnContainerScripts/${i}.sh`,
          sourceLocations: [ `/Container/${data.userName}/${data.jobName}/YarnContainerScripts` ],
          resource: {
            cpuNumber: data.taskRoles[i].cpuNumber,
            memoryMB: data.taskRoles[i].memoryMB,
            shmMB: data.taskRoles[i].shmMB,
            gpuNumber: data.taskRoles[i].gpuNumber,
            portDefinitions: portList,
            diskType: 0,
            diskMB: 0,
          },
        },
        applicationCompletionPolicy: {
          minFailedTaskCount: data.taskRoles[i].minFailedTaskCount,
          minSucceededTaskCount: data.taskRoles[i].minSucceededTaskCount,
        },
      };
      frameworkDescription.taskRoles[data.taskRoles[i].name] = taskRole;
    }
    return frameworkDescription;
  }

  convertJobState(frameworkState, exitCode) {
    let jobState = '';
    switch (frameworkState) {
      case 'FRAMEWORK_WAITING':
      case 'APPLICATION_CREATED':
      case 'APPLICATION_LAUNCHED':
      case 'APPLICATION_WAITING':
        jobState = 'WAITING';
        break;
      case 'APPLICATION_RUNNING':
      case 'APPLICATION_RETRIEVING_DIAGNOSTICS':
      case 'APPLICATION_COMPLETED':
        jobState = 'RUNNING';
        break;
      case 'FRAMEWORK_COMPLETED':
        if (typeof exitCode !== 'undefined' && parseInt(exitCode) === 0) {
          jobState = 'SUCCEEDED';
        } else if (typeof exitCode !== 'undefined' && parseInt(exitCode) === 214) {
          jobState = 'STOPPED';
        } else {
          jobState = 'FAILED';
        }
        break;
      default:
        jobState = 'UNKNOWN';
    }
    return jobState;
  }

  async generateJobDetail(framework) {
    const jobDetail = {
      jobStatus: {},
      taskRoles: {},
    };
    const frameworkStatus = framework.aggregatedFrameworkStatus.frameworkStatus;
    if (frameworkStatus) {
      const jobState = this.convertJobState(
        frameworkStatus.frameworkState,
        frameworkStatus.applicationExitCode);
      let jobRetryCount = 0;
      const jobRetryCountInfo = frameworkStatus.frameworkRetryPolicyState;
      jobRetryCount =
              jobRetryCountInfo.succeededRetriedCount +
              jobRetryCountInfo.transientNormalRetriedCount +
              jobRetryCountInfo.transientConflictRetriedCount +
              jobRetryCountInfo.nonTransientRetriedCount +
              jobRetryCountInfo.unKnownRetriedCount;
      jobDetail.jobStatus = {
        name: framework.name,
        username: 'unknown',
        state: jobState,
        subState: frameworkStatus.frameworkState,
        executionType: framework.summarizedFrameworkInfo.executionType,
        retries: jobRetryCount,
        createdTime: frameworkStatus.frameworkCreatedTimestamp,
        completedTime: frameworkStatus.frameworkCompletedTimestamp,
        appId: frameworkStatus.applicationId,
        appProgress: frameworkStatus.applicationProgress,
        appTrackingUrl: frameworkStatus.applicationTrackingUrl,
        appLaunchedTime: frameworkStatus.applicationLaunchedTimestamp,
        appCompletedTime: frameworkStatus.applicationCompletedTimestamp,
        appExitCode: frameworkStatus.applicationExitCode,
        appExitDiagnostics: frameworkStatus.applicationExitDiagnostics,
        appExitType: frameworkStatus.applicationExitType,
      };
    }
    const frameworkRequest = framework.aggregatedFrameworkRequest.frameworkRequest;
    if (frameworkRequest.frameworkDescriptor) {
      jobDetail.jobStatus.username = frameworkRequest.frameworkDescriptor.user.name;
    }
    const frameworkInfo = framework.summarizedFrameworkInfo;
    if (frameworkInfo) {
      jobDetail.jobStatus.virtualCluster = frameworkInfo.queue;
    }
    const taskRoleStatuses = framework.aggregatedFrameworkStatus.aggregatedTaskRoleStatuses;
    if (taskRoleStatuses) {
      let ipOfContainer;
      for (const taskRole of Object.keys(taskRoleStatuses)) {
        jobDetail.taskRoles[taskRole] = {
          taskRoleStatus: { name: taskRole },
          taskStatuses: [],
        };
        for (const task of taskRoleStatuses[taskRole].taskStatuses.taskStatusArray) {
          const containerPorts = {};
          if (task.containerPorts) {
            for (const portStr of task.containerPorts.split(';')) {
              if (portStr.length > 0) {
                const port = portStr.split(':');
                containerPorts[port[0]] = port[1];
              }
            }
          }
          const ipNatdb = ipmaptable.getNatConfig(this.config.natFile);
          if (ipNatdb !== null && ipmaptable.getIntraIp(ipNatdb, task.containerIp)) {
            ipOfContainer = ipmaptable.getExtraIp(ipNatdb, task.containerIp);
          } else {
            ipOfContainer = task.containerIp;
          }
          jobDetail.taskRoles[taskRole].taskStatuses.push({
            taskIndex: task.taskIndex,
            containerId: task.containerId,
            containerIp: ipOfContainer,
            containerPorts,
            containerGpus: task.containerGpus,
            containerLog: task.containerLogHttpAddress,
          });
        }
      }
    }
    return jobDetail;
  }

  async getJobList(query) {
    const launcherConfig = this.launcherConfig;
    let reqPath = launcherConfig.frameworksPath();
    if (query.username) {
      reqPath = `${reqPath}?UserName=${query.username}`;
    }

    const resJson = await this._invokeService(reqPath);

    const jobList = resJson.summarizedFrameworkInfos.map(frameworkInfo => {
      let retries = 0;
      [ 'succeededRetriedCount', 'transientNormalRetriedCount', 'transientConflictRetriedCount',
        'nonTransientRetriedCount', 'unKnownRetriedCount' ].forEach(retry => {
        retries += frameworkInfo.frameworkRetryPolicyState[retry];
      });

      return {
        userId: frameworkInfo.userName,
        name: frameworkInfo.frameworkName,
        username: undefined,
        state: this.convertJobState(frameworkInfo.frameworkState, frameworkInfo.applicationExitCode),
        subState: frameworkInfo.frameworkState,
        executionType: frameworkInfo.executionType,
        retries,
        createdTime: frameworkInfo.firstRequestTimestamp || new Date(2018, 1, 1).getTime(),
        completedTime: frameworkInfo.frameworkCompletedTimestamp,
        appExitCode: frameworkInfo.applicationExitCode,
        virtualCluster: frameworkInfo.queue,
      };
    });
    jobList.sort((a, b) => b.createdTime - a.createdTime);
    return jobList;
  }

  async putJobExecutionType(name, data) {
    const launcherConfig = this.launcherConfig;
    const requestResJson = await this._invokeService(launcherConfig.frameworkRequestPath(name));

    if (data.username !== requestResJson.frameworkDescriptor.user.name && !data.admin) {
      throw new LError(ECode.OPERATION_FORBIDDEN, `User ${data.username} is not allowed to execute job ${name}.`);
    }

    const res = await this._invokeService(launcherConfig.frameworkExecutionTypePath(name), {
      method: 'PUT',
      data: { executionType: data.value },
    });
    return res;
  }

  async getJobConfig(userName, jobName) {
    const launcherConfig = this.launcherConfig;
    const hdfs = new Hdfs(launcherConfig.webhdfsUri);
    const result = await hdfs.readFile(
      `/Container/${userName}/${jobName}/JobConfig.json`,
      null);
    return JSON.parse(result.content);
  }

  async getJobSshInfo(userName, jobName, applicationId) {
    const clusterId = this.config.clusterId;
    const folderPathPrefix = `/gpai/${clusterId}/${userName}/${jobName}/ssh/${applicationId}`;
    const readdir = Promise.promisify(fs.readdir);
    const result = await readdir(folderPathPrefix);
    const { stdout } = await execa.shell(`cat ${folderPathPrefix}/.ssh/${applicationId}`);

    const sshkey = stdout;
    const sshInfo = {
      containers: [],
      keyPair: {
        privateKey: sshkey,
        privateKeyFileName: applicationId,
      },
    };
    let extraSshIp,
      extraSshPort;
    for (const x of result) {
      const pattern = /^container_(.*)-(.*)-(.*)$/g;
      const arr = pattern.exec(x);
      if (arr !== null) {
        const sshIp = arr[2].toString();
        const sshPort = arr[3].toString();
        const ipNatdb = ipmaptable.getNatConfig(this.config.natFile);
        this.logger.info(ipmaptable.getIntraIp(ipNatdb, sshIp));
        if (ipmaptable.getIntraIp(ipNatdb, sshIp)) {
          extraSshIp = ipmaptable.getExtraIp(ipNatdb, sshIp);
          extraSshPort = ipmaptable.getExtraPort(ipNatdb, sshIp, sshPort);
        } else {
          extraSshIp = arr[2];
          extraSshPort = arr[3];
        }
        sshInfo.containers.push({
          id: 'container_' + arr[1],
          sshIp: extraSshIp,
          sshPort: extraSshPort,
        });
      }
    }
    return sshInfo;
  }

  async deleteJob(name, data) {
    const launcherConfig = this.launcherConfig;
    const job = await this._invokeService(launcherConfig.frameworkRequestPath(name));
    if (data.username !== job.frameworkDescriptor.user.name && !data.admin) {
      throw new LError(ECode.OPERATION_FORBIDDEN, `User ${data.username} is not allowed to remove job ${name}.`);
    }
    await this._invokeService(launcherConfig.frameworkPath(name), { method: 'delete' });
  }
}

module.exports = TokenService;
