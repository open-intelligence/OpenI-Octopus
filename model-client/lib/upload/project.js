// created by yyrdl on 2018.12.5
const co = require("zco");
const fs = require("fs");
const path = require("path");

function filesInfo(dir){
   return co.brief(function*(resume){
     let dir_struct = {};
    
     let [err,stat] = yield fs.stat(dir,resume);

     if (err){
        throw err;
     }

     if (stat.isDirectory()){

        dir_struct.type = "dir";
        dir_struct.name = dir.split(/[\\/]/).pop()
        dir_struct.child = [];

        let [err,list] = yield fs.readdir(dir,resume);
        if (err){
            throw err;
        }
        for(let i=0;i<list.length;i++){
            let node = yield filesInfo(path.join(dir,list[i]))
            if (null != node){
                dir_struct.child.push(node)
            }
        }

    }else{
        dir_struct.type = "file";
        dir_struct.name = dir.split(/[\\/]/).pop();
        dir_struct.size = stat.size;

    }
    return dir_struct;
   });
}


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

 


 exports.filesInfo = filesInfo ;

 exports.genUploadTask  = genUploadTask;
 

 