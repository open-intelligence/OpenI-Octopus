const request = require('request');

class ServiceProxy {

  request(){
    throw new Error("not override ServiceProxy.request")
  }

  _request(opt){
    return new Promise(function(resolve, reject) {
      request(opt, function(err, res, body) {
        if (err) {
          reject(err);
          return
        }
        resolve({
          response: res,
          body: body
        });
      });
    });
  }
}

exports.ServiceProxy = ServiceProxy