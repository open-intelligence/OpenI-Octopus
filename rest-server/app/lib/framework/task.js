
function TaskRole(){
    this._name = "task"+Math.ceil(Math.random()*1000)+"_"+Date.now();
    this._task_number = 0;
    this._minfailed = 1;
    this._minsucceeded = -1;
    this._container = null;
   
}

TaskRole.prototype.Name = function (name){
    this._name = name;
    return this;
}

TaskRole.prototype.TaskNumber = function(number){
    this._task_number = number;
    return this;
}

TaskRole.prototype.MinFailed = function(number){
    this._minfailed = number;
    return this;
}

TaskRole.prototype.MinSucceeded = function(number){
    this._minsucceeded = number;
    return this;
}
TaskRole.prototype.Container = function(c){
    this._container = c;
    return this;
}

TaskRole.prototype.toJson = function(){
    var task =   {
        "name":this._name,
        "taskNumber":this._task_number,
        "frameworkAttemptCompletionPolicy":{
            "minFailedTaskCount":this._minfailed,
            "minSucceededTaskCount": this._minsucceeded
        },
        "task":{
            "retryPolicy":{
                "fancyRetryPolicy":false,
                "maxRetryCount":0
            },
            "pod":{
                "spec":{
                    "restartPolicy":"Never",
                    "hostNetwork":false,
                    "serviceAccountName":"frameworkbarrier",
                    "containers":[],
                    "initContainers":[
                        {
                            "name":"framenameworkbarrier",
                            "image":"frameworkcontroller/frameworkbarrier",
                            "volumeMounts":[
                                {
                                    "mountPath": "/mnt/frameworkbarrier",
                                    "name": "frameworkbarrier-volume"
                                }
                            ]
                        }
                    ],
                    "volumes":[
                        {
                            "emptyDir": {},
                            "name": "frameworkbarrier-volume"
                        }
                    ]
                }
            }
        }

    };

    var mounts = this._container._mounts;

    for(var i=0;i< mounts.length;i++){

        var ori = mounts[i];

        if(!ori.from || !ori.to){
            continue;
        }
                    
        task.task.pod.spec.volumes.push({
            "hostPath":{
                "path":ori.from
            },
            "name":ori.name
        });
    }
    this._container.Name(this._name+"-container");
    task.task.pod.spec.containers.push(this._container.toJson())
    return task;
}


module.exports = TaskRole;