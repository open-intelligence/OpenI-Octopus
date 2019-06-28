
function config(prometheusUri){
    return {
        hardwareInstancePath: currentTimeInSecs => {
            return `${prometheusUri}/api/v1/query?query=node_uname_info&time=${currentTimeInSecs}`;
          },
          hardwareCPUDataPath: (currentTimeInSecs, metricGranularity) => {
            return `${prometheusUri}/api/v1/query_range?query=100%20-%20(avg%20by%20(instance)(irate(node_cpu%7Bmode%3D%22idle%22%7D%5B${metricGranularity}%5D))%20*%20100)&start=${currentTimeInSecs}&end=${currentTimeInSecs}&step=1`;
          },
          hardwareMemUsedDataPath: currentTimeInSecs => {
            return `${prometheusUri}/api/v1/query_range?query=node_memory_MemTotal+-+node_memory_MemFree+-+node_memory_Buffers+-+node_memory_Cached&start=${currentTimeInSecs}&end=${currentTimeInSecs}&step=1`;
          },
          hardwareMemTotalDataPath: currentTimeInSecs => {
            return `${prometheusUri}/api/v1/query_range?query=node_memory_MemTotal&start=${currentTimeInSecs}&end=${currentTimeInSecs}&step=1`;
          },
          hardwareGPUDataPath: currentTimeInSecs => {
            return `${prometheusUri}/api/v1/query_range?query=avg+by+(instance)(nvidiasmi_utilization_gpu)&start=${currentTimeInSecs}&end=${currentTimeInSecs}&step=1`;
          },
          hardwareGPUMemDataPath: currentTimeInSecs => {
            return `${prometheusUri}/api/v1/query_range?query=avg+by+(instance)(nvidiasmi_utilization_memory)&start=${currentTimeInSecs}&end=${currentTimeInSecs}&step=1`;
          },
          hardwareDiskReadBytesDataPath: (currentTimeInSecs, metricGranularity) => {
            return `${prometheusUri}/api/v1/query_range?query=sum+by+(instance)(rate(node_disk_bytes_read%5B${metricGranularity}%5D))&start=${currentTimeInSecs}&end=${currentTimeInSecs}&step=1`;
          },
          hardwareDiskWrittenBytesDataPath: (currentTimeInSecs, metricGranularity) => {
            return `${prometheusUri}/api/v1/query_range?query=sum+by+(instance)(rate(node_disk_bytes_written%5B${metricGranularity}%5D))&start=${currentTimeInSecs}&end=${currentTimeInSecs}&step=1`;
          },
          hardwareEthRecievedBytesDataPath: (currentTimeInSecs, metricGranularity) => {
            return `${prometheusUri}/api/v1/query_range?query=sum+by+(instance)(rate(node_network_receive_bytes%5B${metricGranularity}%5D))&start=${currentTimeInSecs}&end=${currentTimeInSecs}&step=1`;
          },
          hardwareEthSentBytesDataPath: (currentTimeInSecs, metricGranularity) => {
            return `${prometheusUri}/api/v1/query_range?query=sum+by+(instance)(rate(node_network_receive_bytes%5B${metricGranularity}%5D))&start=${currentTimeInSecs}&end=${currentTimeInSecs}&step=1`;
          }
    }
}

exports.config  = config;