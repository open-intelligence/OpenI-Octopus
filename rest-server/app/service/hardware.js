
'use strict';

const Service = require('egg').Service;
const PrometheusApis = require("../third-service-apis/prometheus");
const LError = require('../error/proto');
const ECode = require('../error/code');

class HardwareService extends Service {
  constructor(...args) {
    super(...args);
    this.prometheusApi = PrometheusApis.config(this.config.prometheus);
  }

  async getInstances(currentTimeInSeconds) {

    const hardwareInstancePath = this.prometheusApi.hardwareInstancePath(currentTimeInSeconds);

    const response = await this.app.curl(hardwareInstancePath, {
      dataType: 'json',
    });

    let hardwareInstanceArray = [];
    if (response.status === 200 && response.data.data.result) {
      hardwareInstanceArray = response.data.data.result;
    } else {
      throw new LError(ECode.FAILURE, 'getInstances error:' + response.data.error);
    }

    return hardwareInstanceArray;
  }

  async getCpuData(currentTimeInSeconds, metricGranularity) {

    const dataPath = this.prometheusApi.hardwareCPUDataPath(currentTimeInSeconds, metricGranularity);

    const response = await this.app.curl(dataPath, {
      dataType: 'json',
    });

    let dataArray = [];
    if (response.status === 200 && response.data.data.result) {
      dataArray = response.data.data.result;
    } else {
      throw new LError(ECode.FAILURE, 'getCpuData error:' + response.data.error);
    }

    return dataArray;
  }

  async getMemUsedData(currentTimeInSeconds) {

    const dataPath = this.prometheusApi.hardwareMemUsedDataPath(currentTimeInSeconds);

    const response = await this.app.curl(dataPath, {
      dataType: 'json',
    });

    let dataArray = [];
    if (response.status === 200 && response.data.data.result) {
      dataArray = response.data.data.result;
    } else {
      throw new LError(ECode.FAILURE, 'getMemUsedData error:' + response.data.error);
    }

    return dataArray;
  }


  async getMemTotalData(currentTimeInSeconds) {

    const dataPath = this.prometheusApi.hardwareMemTotalDataPath(currentTimeInSeconds);

    const response = await this.app.curl(dataPath, {
      dataType: 'json',
    });

    let dataArray = [];
    if (response.status === 200 && response.data.data.result) {
      dataArray = response.data.data.result;
    } else {
      throw new LError(ECode.FAILURE, 'getMemTotalData error:' + response.data.error);
    }

    return dataArray;
  }
  async getGPUData(currentTimeInSeconds) {

    const dataPath = this.prometheusApi.hardwareGPUDataPath(currentTimeInSeconds);

    const response = await this.app.curl(dataPath, {
      dataType: 'json',
    });

    let dataArray = [];
    if (response.status === 200 && response.data.data.result) {
      dataArray = response.data.data.result;
    } else {
      throw new LError(ECode.FAILURE, 'getGPUData error:' + response.data.error);
    }

    return dataArray;
  }
  async getGPUMemData(currentTimeInSeconds) {

    const dataPath = this.prometheusApi.hardwareGPUMemDataPath(currentTimeInSeconds);

    const response = await this.app.curl(dataPath, {
      dataType: 'json',
    });

    let dataArray = [];
    if (response.status === 200 && response.data.data.result) {
      dataArray = response.data.data.result;
    } else {
      throw new LError(ECode.FAILURE, 'getGPUMemData error:' + response.data.error);
    }

    return dataArray;
  }
  async getDiskReadBytesData(currentTimeInSeconds, metricGranularity) {

    const dataPath = this.prometheusApi.hardwareDiskReadBytesDataPath(currentTimeInSeconds, metricGranularity);

    const response = await this.app.curl(dataPath, {
      dataType: 'json',
    });

    let dataArray = [];
    if (response.status === 200 && response.data.data.result) {
      dataArray = response.data.data.result;
    } else {
      throw new LError(ECode.FAILURE, 'getDiskReadBytesData error:' + response.data.error);
    }

    return dataArray;
  }
  async getDiskWrittenBytesData(currentTimeInSeconds, metricGranularity) {

    const dataPath = this.prometheusApi.hardwareDiskWrittenBytesDataPath(currentTimeInSeconds, metricGranularity);

    const response = await this.app.curl(dataPath, {
      dataType: 'json',
    });

    let dataArray = [];
    if (response.status === 200 && response.data.data.result) {
      dataArray = response.data.data.result;
    } else {
      throw new LError(ECode.FAILURE, 'getDiskWrittenBytesData error:' + response.data.error);
    }

    return dataArray;
  }

  async getEthRecievedBytesData(currentTimeInSeconds, metricGranularity) {

    const dataPath = this.prometheusApi.hardwareEthRecievedBytesDataPath(currentTimeInSeconds, metricGranularity);

    const response = await this.app.curl(dataPath, {
      dataType: 'json',
    });

    let dataArray = [];
    if (response.status === 200 && response.data.data.result) {
      dataArray = response.data.data.result;
    } else {
      throw new LError(ECode.FAILURE, 'getEthRecievedBytesData error:' + response.data.error);
    }

    return dataArray;
  }

  async getEthSentBytesData(currentTimeInSeconds, metricGranularity) {

    const dataPath = this.prometheusApi.hardwareEthSentBytesDataPath(currentTimeInSeconds, metricGranularity);

    const response = await this.app.curl(dataPath, {
      dataType: 'json',
    });

    let dataArray = [];
    if (response.status === 200 && response.data.data.result) {
      dataArray = response.data.data.result;
    } else {
      throw new LError(ECode.FAILURE, 'getEthSentBytesData error:' + response.data.error);
    }

    return dataArray;
  }
}

module.exports = HardwareService;
