
'use strict';

module.exports = (app, router) => {

  /**
   * @api {GET} /api/v1/hardwares/ GetHardwareInfo
   * @apiSampleRequest off
   * @apiName GetHardwareInfo
   * @apiDescription Get the hardware info of cluster <code>Administrator Only</code>
   * @apiVersion 1.0.0
   * @apiGroup Hardware
   *
   * @apiHeader {String} Authorization Bearer {token} <code>required</code>
   * @apiHeaderExample {json} Header-Example:
   * {
   *  "Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
   * }
   *
   * @apiSuccess {String} code Equal to 'S000' when successfully.
   * @apiSuccess {String} msg Equal to 'success' when successfully.
   * @apiSuccess {Object} payload Hardware info.
   * @apiSuccess {Object[]} payload.Instances
   * @apiSuccess {Object} payload.Instances.metric
   * @apiSuccess {String} payload.Instances.metric.__name__
   * @apiSuccess {String} payload.Instances.metric.domainname
   * @apiSuccess {String} payload.Instances.metric.instance
   * @apiSuccess {String} payload.Instances.metric.job
   * @apiSuccess {String} payload.Instances.metric.machine
   * @apiSuccess {String} payload.Instances.metric.nodename
   * @apiSuccess {String} payload.Instances.metric.release
   * @apiSuccess {String} payload.Instances.metric.sysname
   * @apiSuccess {String} payload.Instances.metric.version
   * @apiSuccess {Number[]} payload.Instances.value
   * @apiSuccess {Object[]} payload.CpuData
   * @apiSuccess {Object} payload.CpuData.metric
   * @apiSuccess {String} payload.CpuData.metric.instance
   * @apiSuccess {Number[]} payload.CpuData.values
   * @apiSuccess {Object[]} payload.MemUsedData
   * @apiSuccess {Object} payload.MemUsedData.metric
   * @apiSuccess {String} payload.MemUsedData.metric.instance
   * @apiSuccess {String} payload.MemUsedData.metric.job
   * @apiSuccess {Number[]} payload.MemUsedData.values
   * @apiSuccess {Object[]} payload.MemTotalData
   * @apiSuccess {Object} payload.MemTotalData.metric
   * @apiSuccess {String} payload.MemTotalData.metric.__name__
   * @apiSuccess {String} payload.MemTotalData.metric.instance
   * @apiSuccess {String} payload.MemTotalData.metric.job
   * @apiSuccess {Number[]} payload.MemTotalData.values
   * @apiSuccess {Object[]} payload.GPUData
   * @apiSuccess {Object} payload.GPUData.metric
   * @apiSuccess {String} payload.GPUData.metric.instance
   * @apiSuccess {Number[]} payload.GPUData.values
   * @apiSuccess {Object[]} payload.GPUMemData
   * @apiSuccess {Object} payload.GPUMemData.metric
   * @apiSuccess {String} payload.GPUMemData.metric.instance
   * @apiSuccess {Number[]} payload.GPUMemData.values
   * @apiSuccess {Object[]} payload.DiskReadBytesData
   * @apiSuccess {Object} payload.DiskReadBytesData.metric
   * @apiSuccess {String} payload.DiskReadBytesData.metric.instance
   * @apiSuccess {Number[]} payload.DiskReadBytesData.values
   * @apiSuccess {Object[]} payload.DiskWrittenBytesData
   * @apiSuccess {Object} payload.DiskWrittenBytesData.metric
   * @apiSuccess {String} payload.DiskWrittenBytesData.metric.instance
   * @apiSuccess {Number[]} payload.DiskWrittenBytesData.values
   * @apiSuccess {Object[]} payload.EthRecievedBytesData
   * @apiSuccess {Object} payload.EthRecievedBytesData.metric
   * @apiSuccess {String} payload.EthRecievedBytesData.metric.instance
   * @apiSuccess {Number[]} payload.EthRecievedBytesData.values
   * @apiSuccess {Object[]} payload.EthSentBytesData
   * @apiSuccess {Object} payload.EthSentBytesData.metric
   * @apiSuccess {String} payload.EthSentBytesData.metric.instance
   * @apiSuccess {Number[]} payload.EthSentBytesData.value
   * @apiSuccessExample Success-Response:
   *  HTTP/1.1 200 OK
   *  {
   *   "code": "S000",
   *   "msg": "success",
   *   "payload":{
   *    "Instances": [{
   *     "metric": {
   *      "__name__": "node_uname_info",
   *      "domainname": "(none)",
   *      "instance": "192.168.1.111",
   *      "job": "node_exporter",
   *      "machine": "x86_64",
   *      "nodename": "CK001",
   *      "release": "4.4.0-131-generic",
   *      "sysname": "Linux",
   *      "version": "#157-Ubuntu SMP Thu Jul 12 15:51:36 UTC 2018"
   *     },
   *     "value": [1552271339.375,"1"]
   *    }],
   *    "CpuData":[{
   *     "metric": {
   *      "instance": "192.168.1.111"
   *     },
   *     "values": [[1552271339.375,"2.3715277778198356"]]
   *    }],
   *    "MemUsedData":[{
   *     "metric": {
   *      "instance": "192.168.1.111",
   *      "job": "node_exporter"
   *     },
   *     "values": [[1552271339.375,"49312940032"]]
   *    }],
   *    "MemTotalData": [{
   *     "metric": {
   *      "__name__": "node_memory_MemTotal",
   *      "instance": "192.168.1.111",
   *      "job": "node_exporter"
   *     },
   *     "values": [[1552271339.375,"134786211840"]]
   *    }],
   *    "GPUData": [{
   *     "metric": {
   *      "instance": "192.168.1.111"
   *     },
   *     "values": [[1552271339.375,"0"]]
   *    }],
   *    "GPUMemData": [{
   *     "metric": {
   *      "instance": "192.168.1.111"
   *     },
   *     "values": [[1552271339.375,"0"]]
   *    }],
   *    "DiskReadBytesData": [{
   *     "metric": {
   *      "instance": "192.168.1.111"
   *     },
   *     "values": [[1552271339.375,"0"]]
   *    }],
   *    "DiskWrittenBytesData": [{
   *     "metric": {
   *      "instance": "192.168.1.111"
   *     },
   *     "values": [[1552271339.375,"469674.6666666667"]]
   *    }],
   *    "EthRecievedBytesData": [{
   *     "metric": {
   *      "instance": "192.168.1.111"
   *     },
   *     "values": [[1552271339.375,"105433.64444444448"]]
   *    }],
   *    "EthSentBytesData": [{
   *     "metric": {
   *      "instance": "192.168.1.111"
   *     },
   *     "values": [[1552271339.375,"105433.64444444448"]]
   *    }]
   *   }
   *  }
   *
   * @apiUse FailureError
   * @apiUse OperationForbiddenError
   */
  router.get('/', 'hardware.getHardwareInfo');
};
