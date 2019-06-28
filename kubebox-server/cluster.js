'use strict';
require('./lib/logger');
const cluster = require('cluster');
const numCPUs = parseInt(process.env.KUBEBOX_CLUSTER_NUM || 0)|| require('os').cpus().length;
const {createServer} = require('./server');
if (cluster.isMaster) {
  console.log(`主进程 ${process.pid} 正在运行`);

  // 衍生工作进程。
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker, code, signal) => {
    console.log(`工作进程 ${worker.process.pid} 已退出`);
  });
} else {
  // 工作进程可以共享任何 TCP 连接。
  let server = createServer();
  server.listen(8080, function listening() {
    logger.info('Process %d is listening on %d', process.pid, server.address().port);
  });
}