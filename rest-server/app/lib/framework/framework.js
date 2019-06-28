
function Framework(){
    this._name = "framework"+Math.ceil(Math.random()*1000)+"_"+Date.now();
    this._retry_count = 0;
    this._tasks  = [];
    this._labels = {};
}

Framework.prototype.Name = function(name){
    this._name = name;
    return this;
}

Framework.prototype.Label = function(key,value){
    this._labels[key] = value;
    return this;
}

Framework.prototype.Retry = function(time){
    this._retry_count = time;
    return this;
}

Framework.prototype.AddTask = function(task){
    this._tasks.push(task);
    return this;
}

Framework.prototype.toJson = function (){
    var framework = {
        "apiVersion":"frameworkcontroller.microsoft.com/v1",
        "kind":"Framework",
        "metadata":{
            "name":this._name,
            "labels":this._labels
        },
        "spec":{
            "executionType":"Start",
            "retryPolicy":{
                "fancyRetryPolicy":true,
                "maxRetryCount":this._retry_count
            },
            "taskRoles":[]
        }
    };
    for(var i=0;i < this._tasks.length;i++){
        framework.spec.taskRoles.push(this._tasks[i].toJson())
    }

    return framework;
}


module.exports = Framework;