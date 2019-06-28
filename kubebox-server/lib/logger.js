'use strict';
let bunyan = require('bunyan');
let logger = bunyan.createLogger({
  name: 'kubebox-server',
  level: process.env.KUBEBOX_LOG_LEVEL || bunyan.INFO,
  serializers:{
    // clientRequest
    request:httpClientRequestSerializer,
    // clientResponse
    response:httpClientResponseSerializer
  }
});

function httpClientRequestSerializer(req){
  return {
    method: req.method,
    path: req.path,
    headers: req._header
  };
}

function httpClientResponseSerializer(res){
  return {
    headers: res.headers,
    httpVersion: res.httpVersion,
    statusCode:res.statusCode,
    statusMessage:res.statusMessage
  };
}

global.logger = logger;