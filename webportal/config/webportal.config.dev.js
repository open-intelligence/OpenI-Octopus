 /**
  * config for dev 
  * */

let config = {
  restServerUri: 'http://127.0.0.1:9186',
  prometheusUri: "http://192.168.113.221:9091",
  yarnWebPortalUri: "http://192.168.113.221:8088",
  grafanaUri: "http://192.168.113.221:3000",
  k8sDashboardUri:"http://192.168.113.221:9090",
  k8sApiServerUri:'http://192.168.113.221:8080',
  exporterPort: "9100",
  orderServiceUrl: process.env.ORDER_SERVICE_URL,
  clusterName: process.env.CLUSTER_NAME,
// for debug config
  REPLACEDCOMMAND: "sleep 1800",
  DEBUGVC: "vc1",
// for spec
  CPURATIO: 2,
  MEMRATIO: 8196,

// for competition
  COMPETITIONUSER: "pai_admin_username",
  COMPETITIONVC: "vc2",
};

// module exports
module.exports = config;