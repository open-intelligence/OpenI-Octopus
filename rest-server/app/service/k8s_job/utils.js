

function computeJobResource(job,limits){
  
    const jobTasks = job.taskRoles;
  
    const limitKeys = Object.keys(limits);
  
    const jobResource = {};
  
    if (limitKeys.length < 1) {
      return jobResource;
    }
  
    jobTasks instanceof Array && jobTasks.forEach(jobTask => {
      limitKeys.forEach(k => {
        if (!jobResource[k]) {
          jobResource[k] = 0;
        }
        if (!jobTask[k]) {
          return;
        }
        if (k === 'taskNumber') {
          jobResource[k] += parseInt(jobTask[k]);
          return;
        }
        jobResource[k] += parseInt(jobTask[k]) * parseInt(jobTask.taskNumber);
      });
    });
  
    return jobResource;
  }

function caculate_resource(job,resources){
    let count = {};

    resources = resources || [];

    resources.forEach(it=>{
      count[it] = 0;
    })

    let tasks = job.taskRoles || [];

    tasks.forEach(item=>{
      resources.forEach(resource=>{
        count[resource] += parseInt(item[resource]) * parseInt(item["taskNumber"] || 0)
       })
    });

    return count;
  }

function promisefy(func){
    return function(){
       let args = [].slice.call(arguments);
       return new Promise(function(resolve,reject){
         args.push(function(){
           let ress = [].slice.call(arguments);
           if(ress[0]){
              reject(ress[0]);
           }else{
             ress.shift();
             resolve(ress);
           }
        });
        func.apply(null,args);
       });
    }
}

function format_framework_name(name){

   return　(name || "").split("-").join("00");
}

exports.promisefy = promisefy;

exports.computeJobResource = computeJobResource;

exports.caculate_resource = caculate_resource;

exports.format_framework_name = format_framework_name;