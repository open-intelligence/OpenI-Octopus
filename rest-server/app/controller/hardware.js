'use strict';

const Controller = require('egg').Controller;


class HardwareController extends Controller {
  async getHardwareInfo() {
    const { ctx, service } = this;

    const currentTimeInSeconds = (new Date()).getTime() / 1000;
    const metricGranularity = '5m';
    let HarewareInfoDic = {};
    let Instances = [];
    let CpuData = [];
    let MemUsedData = [];
    let MemTotalData = [];
    let GPUData = [];
    let GPUMemData = [];
    let DiskReadBytesData = [];
    let DiskWrittenBytesData = [];
    let EthRecievedBytesData = [];
    let EthSentBytesData = [];

    Instances = await service.hardware.getInstances(currentTimeInSeconds);

    CpuData = await service.hardware.getCpuData(currentTimeInSeconds, metricGranularity);

    MemUsedData = await service.hardware.getMemUsedData(currentTimeInSeconds);

    MemTotalData = await service.hardware.getMemTotalData(currentTimeInSeconds);

    GPUData = await service.hardware.getGPUData(currentTimeInSeconds);

    GPUMemData = await service.hardware.getGPUMemData(currentTimeInSeconds);

    DiskReadBytesData = await service.hardware.getDiskReadBytesData(currentTimeInSeconds, metricGranularity);

    DiskWrittenBytesData = await service.hardware.getDiskWrittenBytesData(currentTimeInSeconds, metricGranularity);

    EthRecievedBytesData = await service.hardware.getEthRecievedBytesData(currentTimeInSeconds, metricGranularity);

    EthSentBytesData = await service.hardware.getEthSentBytesData(currentTimeInSeconds, metricGranularity);

    HarewareInfoDic = {
      Instances,
      CpuData,
      MemUsedData,
      MemTotalData,
      GPUData,
      GPUMemData,
      DiskReadBytesData,
      DiskWrittenBytesData,
      EthRecievedBytesData,
      EthSentBytesData,
    };


    ctx.success(HarewareInfoDic);
  }
}

module.exports = HardwareController;
