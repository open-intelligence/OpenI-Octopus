require('./lib/logger');
const express = require('express');
const http = require('http');
const url = require('url');
const querystring = require('querystring');
const WebSocket = require('ws');
const util = require('./lib/util');
let blessed = require('blessed');
let Kubebox = require('./lib/kubebox');
let Store =  require('./lib/store');

const DIRECTION_TYPE = util.DIRECTION_TYPE;
const EventEmitter = require('events');
function createServer(){
  const app = express();

  app.use('/', express.static(__dirname));
  app.use('/:p',function(req,resp){
    logger.info(req.originalUrl)
    resp.end('ok')
  });
  const server = http.createServer(app);
  const wss = new WebSocket.Server({ server });

  wss.on('connection', function connection(ws, req) {
    const location = url.parse(req.url, true);
    const query = querystring.parse(location.search?location.search.replace('?',''):location.search);
    // 会话状态
    const store = new Store(query);
    if(!store.isAuthenticated()){
      const message = util.serializeMessage('no Authenticated');
      ws.send(message);
      ws.terminate();
      return
    }

    class Duplex extends EventEmitter {
      constructor() {
        super();
        this.isTTY = true;
        this.writable = true;
        this.columns = 120;
        this.rows = 40;
      }
      write(d) {
        if (ws.readyState === WebSocket.OPEN) {
          const data = util.serializeData(d);
          ws.send(data);
        }
      }
    }

    const duplex = new Duplex();
//   let program = blessed.program({ input: ws, output: ws, tput: false });
    let screen = blessed.screen({
      input         : duplex,
      output        : duplex,
      terminal      : 'xterm-256color',
      resizeTimeout : 10,
      forceUnicode  : true,
      // smartCSR   : true,
      dockBorders   : true,
      autoPadding   : true,
      warnings      : false,
    });

    screen.store = store;
    let kubebox = new Kubebox(screen);

    ws.on('message', function(d) {
      let {cmd,data} = util.deserialize(d);

      // console.log('cmd:', cmd, 'data: ', data);
      switch(cmd) {
        case DIRECTION_TYPE.DIRECTION_TYPE_DATA:
          // term.write(data);
          duplex.emit('data', data);
          break;
        case DIRECTION_TYPE.DIRECTION_TYPE_OPERATION:
          data = JSON.parse(data);
          duplex.columns = data.columns;
          duplex.rows = data.rows;
          duplex.emit('resize');
          // term.resize(data.columns, data.rows);
          break;
        default:
          logger.info('Unknown command: ' + cmd);
          break;
      }
    });
    ws.on('close', function() {
      logger.info('close')
      // FIXME: abort all cancellations
      screen.destroy();
      delete kubebox;

    });
    ws.on('error', function(e) {
      logger.info('error:',e);
    });
  });


  return server;
}

module.exports = {
  createServer
}