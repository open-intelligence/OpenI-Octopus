const request = require("request");
const path = require("path")
 
function k8s_api(setting,resource_id){
    if(resource_id){
        return setting.server+"/"+ path.join("apis",setting.apiVersion,"namespaces",setting.namespace ||"default",setting.resourceType,resource_id);
    }else{
        return setting.server+"/"+ path.join("apis",setting.apiVersion,"namespaces",setting.namespace ||"default",setting.resourceType);
    }
}

function request_pro(opt){
    return new Promise(function(resolve,reject){
        request(opt,function(err,res,body){
            if(err){
                reject(err);
            }else{
                resolve(body)
            }
        })
    })
}

function Client(kube_config,app_config){

    this.kube_info = {
        apiVersion:app_config.apiVersion || "extensions/v1beta1",
        namespace:app_config.namespace || "default",
        resourceType: app_config.resourceType || "",
        ca: Buffer.from(kube_config.ca,'base64').toString(),
        cert: Buffer.from(kube_config.cert,"base64").toString(),
        key:Buffer.from(kube_config.key,"base64").toString(),
        server:kube_config.server
    };

    if(this.kube_info.resourceType == ""){
        throw new Error("k8s 客户端需指明资源类型");
    }

    if("" == this.kube_info.server){
        throw new Error("k8s 客户端 未指明Api-Server地址");
    }

}


Client.prototype.Get = function (id){
    let opt = {
        url: k8s_api(this.kube_info,id),
        method:"GET",
        ca:this.kube_info.ca,
        cert:this.kube_info.cert,
        key:this.kube_info.key,
        json:true
    };
    return request_pro(opt);
}


Client.prototype.List = function(labels){
    
    labels = labels || {};

    let url = k8s_api(this.kube_info,"");

    let labelSelector = "";
    
    for(let key in labels){
        if("" == labelSelector){
            labelSelector = key+"="+labels[key];
        }else{
            labelSelector = labelSelector+","+ key+"="+labels[key];
        }
    }

    if ("" != labelSelector){
        url += "?labelSelector="+encodeURIComponent(labelSelector)
    }
       
    let opt = {
        url: url,
        method:"GET",
        ca:this.kube_info.ca,
        cert:this.kube_info.cert,
        key:this.kube_info.key,
        json:true
    };

    return request_pro(opt);
}


Client.prototype.Delete = function(id){
    let opt = {
        url: k8s_api(this.kube_info,id),
        method:"DELETE",
        ca:this.kube_info.ca,
        cert:this.kube_info.cert,
        key:this.kube_info.key
    };
    return request_pro(opt);
}

Client.prototype.Create = function(config){
    let opt = {
        url: k8s_api(this.kube_info),
        method:"POST",
        ca:this.kube_info.ca,
        cert:this.kube_info.cert,
        key:this.kube_info.key,
        body:config,
        json:true
    };
    return request_pro(opt);
}


Client.prototype.Request = function(opt){
    opt.ca = this.kube_info.ca;
    opt.cert = this.kube_info.cert;
    opt.key = this.kube_info.key;
    opt.json = true;
    return request_pro(opt)
}

module.exports = Client;