
function Container (){
    this.name = "";
     
    this._gpu = 0;
    this._cpu = 0;
    this._memory = 0;
   
    this._command = "";
    this._image = "";

    this._mounts = [];

    this._ports = [];
}

Container.prototype.Name = function(name){
    this._name = name;
}

Container.prototype.Gpu = function(amount){
    this._gpu = amount;
    return this;
}

Container.prototype.Cpu = function(amount){
    this._cpu = amount;
    return this;
}

Container.prototype.Memory  =function(amount){
    this._memory = amount;
    return this;
}

Container.prototype.Mount = function (from,to,opt){
    var it = {
        "name":"mount-"+this._mounts.length,
        "from":from,
        "to":to,
        "opt":opt
    };

    this._mounts.push(it);
    return this;
}

Container.prototype.Port = function(){
     var self = this;
     function add(port){
        port.name = "port-"+self._ports.length;
        self._ports.push(port);
        return this;
     }
     return {
         "_store":{

         },
         "ContainerPort":function(port){
            this._store.container_port = port;
            return this;
         },
         "HostPort":function(port){
            this._store.host_port = port;
            return this;
         },
         "Add":function(){
             return  add(this._store)
         }
     }
}

Container.prototype.Image = function(image){
    this._image = image;
    return this;
}

Container.prototype.Command = function(cmd){
    this._command = cmd;
    return this;
}

Container.prototype.toJson = function(){
    var container = {
        "name":this._name,
        "image":this._image,
        "command":["sh", "-c"],
        "ports": [],
        "volumeMounts": [
            {
                "mountPath": "/mnt/frameworkbarrier",
                "name": "frameworkbarrier-volume"
            }
        ]
    };

    var command = "/mnt/frameworkbarrier/injector.sh & "+this._command;
    container.command.push(command);

    if(this._gpu > 0 || this._cpu > 0 || this._memory > 0){
        container.resources = {"limits":{}}
    }   

    if(this._gpu > 0 ){
        container.resources.limits["nvidia.com/gpu"] = this._gpu;
    }
    if(this._cpu > 0 ){
        container.resources.limits["cpu"] = this._cpu;
    }

    if(this._memory > 0 ){
        container.resources.limits["memory"] = this._memory +"Mi";
    }

    for(var i= 0;i< this._ports.length;i++){
        if(!this._ports[i].container_port){
            continue;
        }
        var port = {
            "name":this._ports[i].name,
            "containerPort":this._ports[i].container_port
        };

        if (this._ports[i].hostPort ){
            port.hostPort = this._ports[i].hostPort ;
        }
        
        container.ports.push(port);
    }

    for(var i=0;i< this._mounts.length;i++){
        var ori = this._mounts[i];
        if(!ori.from || !ori.to){
            continue;
        }
        var mount = {
            "name":ori.name,
            "mountPath":ori.to
        };
        if(ori.opt){
            if(true == ori.readOnly){
                mount.readOnly = true;
            }
        }
        container.volumeMounts.push(mount);
    }

    return container;

}

module.exports = Container;
