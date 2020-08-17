const ServiceProxy = require("../libProxy").ServiceProxy
const CoreType = require("./type")

const CoreClientServiceHost = Symbol('CoreClient#service_host');
const CoreClientServiceToken = Symbol('CoreClient#service_token');

class CoreClient extends ServiceProxy {
  constructor(options=null) {
    super(options);
    this.options = options
    this[CoreClientServiceHost] = this.options.address
    this[CoreClientServiceToken] = this.options.token
  }

  get host(){
    return this[CoreClientServiceHost]
  }

  request(opt){
    let defaultOptions = { baseUrl: this.host, json: true, headers:{"token": this[CoreClientServiceToken] }}
    opt = Object.assign({}, opt, defaultOptions)
    return this._request(opt)
      .then(({response, body})=>{
        if (response.statusCode != 200 && response.statusCode != 404) {
          throw new Error("core service error: httpStatus " + response.statusCode)
        }
        if (body.code == "OPERATION_TARGET_NOT_FOUND") {
          return null
        }
        if (body.code != "OPERATION_SUCCEEDED") {
          throw new Error("core error: " + body.code + ":" + JSON.stringify(opt))
        }
        return body.payload
      })
      .catch((err)=>{
        throw err
      })
  }
}

const expands = [
  require('./interfaces'),
];

for (const expand of expands) {
  Object.assign(CoreClient.prototype, expand);
}

const coreClientMap = new Map()

exports.newCoreClient = function(options){
  const host = options.address
  if (!host) {
    throw new TypeError("core service host is null")
  }
  let client = coreClientMap.get(host)
  if(!client) {
    client = new CoreClient(options)
    coreClientMap.set(host, client)
  }
  return client
}

exports.newCoreJob = function(){
  return new CoreType.CoreJob()
}

exports.newCoreJobRecord = function(){
  return new CoreType.CoreJobRecord()
}