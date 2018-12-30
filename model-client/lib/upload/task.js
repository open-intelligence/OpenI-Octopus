// created by yyrdl on 2018.12.5
const co = require("zco");
const fs = require("fs");
const path = require("path");
 


function _genUploadTask(dir,blockSize = 64*1024*1024){
    return co.brief(function*(resume){
         
          let upload_task = [];

          let seg = dir.split(/[\\/]/).pop();

          let [err,stat] = yield fs.stat(dir,resume);

          if (err){
             throw err;
          }

          if(stat.isDirectory()){
            let [err,list] = yield fs.readdir(dir,resume);

            if (err){
                throw err;
            }
              for(let i=0;i<list.length;i++){
                   
                  let sub_tasks = yield _genUploadTask(path.join(dir,list[i]),blockSize);
                  
                  upload_task = upload_task.concat(sub_tasks.map(it=>{
                      it.name = seg+"/"+it.name;
                      return it;
                  }));
              }
          }else{

             upload_task.push({
                 name:seg,
                 size:stat.size,
                 block_size:blockSize,
                 block_num : Math.ceil(stat.size/blockSize)
             });
          }

          return upload_task;
    });
}


function genUploadTask(dir,blockSize = 64*1024*1024){
    return co.brief(function*(){
          let tasks = yield _genUploadTask(dir,blockSize);
          let seg = dir.split(/[\\/]/).pop();
       
          return tasks.map(it=>{
              it.name  = "."+it.name.slice(seg.length);
              return it;
          })
    });
}


 exports.genUploadTask  = genUploadTask;
 

 