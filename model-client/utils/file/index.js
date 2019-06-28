// created by yyrdl on 2018.12.5
const co = require("zco");
const fs = require("fs");
const path = require("path");
const Lock = require("../../prototype/concurrent");

const c_lock =  new Lock(1)

function isDir(file_path){
    return co.brief(function*(resume){
        let [err,stat] = yield fs.stat(file_path,resume);
        if(err){
            throw err;;
        }
        return stat.isDirectory();
    })
}


function rmAll(file){
    return co.brief(function*(resume){
        
        let [exist] = yield fs.exists(file,resume);

        if(!exist){
            return 
        }

        let is_dir = yield isDir(file);
        if (is_dir){
            let [err,list] = yield fs.readdir(file,resume);
            if(err){
                throw err;
            }
            for(let i=0;i<list.length;i++){
                yield rmAll(path.join(file,list[i]));
            }
            [err] = yield fs.rmdir(file,resume);

            if(err){
                throw err;
            }
        }else{
            let [err] = yield fs.unlink(file,resume);
            if(err){
                throw err;
            }
        }
    }) ;
}

function dirMustExist(dir_path){
    return co.brief(function*(resume,defer){

        /*** 
         * 别以为单线程就不用加锁了，太天真了！！
         * 
         * even if there is only one thread in node.js ,but a concurrent lock is neccessary here.
         * too young too simple..... 
        */
        defer(function*(){
           
            c_lock.unLock();
        })
        
        yield c_lock.lock(resume);
       
        let [exist] = yield fs.exists(dir_path,resume);
    
        if(exist){
            return  true
        }

        let dirs = dir_path.split(/[\\/]/);

        if(dirs[0] == ""){
            dirs[0] = "/";
        }

        dirs = dirs.filter(function(sub){
            return sub != "";
        })
        
        let subdir = dirs[0];

        for(let i=1;i<dirs.length;i++){

            subdir = path.join(subdir,dirs[i]);

            [exist] = yield fs.exists(subdir,resume)
    
            if (true  == exist){

                let is_dir = yield isDir(subdir);
                if( !is_dir){
                    let [err] = yield fs.mkdir(subdir,resume);
                    if(err){
                       
                        throw err;
                    }
                 }
               
            }else{
                let [err] = yield fs.mkdir(subdir,resume);
                if(err){
                   
                    throw err;
                }
            }
        }
    });
 }


 /** 
 * 删除某一个文件夹下的文件
*/
function clean(dir,except = []){
    return co.brief(function*(resume){
        let [err,list] = yield fs.readdir(dir,resume);
        if(err){
            throw err;
        }
        list = list.filter(it=>{
            return !except.includes(it)
        });

        for(let i=0;i<list.length;i++){
            let t = path.join(dir,list[i]);
            yield rmAll(t)
        }
    });
}

/** 
 * 将一个文件夹下的文件转移至另外一个文件夹
*/
function transfer(src,dest,except = []){
    return co.brief(function*(resume){
        let [err,list] = yield fs.readdir(src,resume);
        if(err){
            throw err;
        }
        for(let i=0;i<list.length;i++){

            if (except.includes(list[i])){
                continue;
            }

            [err] = yield fs.rename(path.join(src,list[i]),path.join(dest,list[i]),resume);
            if(err){
                throw err;
            }
        }
    })
}

function copy(src,dest,except = []){
    return co.brief(function*(resume){
        let [err,list] = yield fs.readdir(src,resume);
        if(err){
            throw err;
        }
        for(let i=0;i<list.length;i++){

            let src_tar = path.join(src,list[i]);

            if(except.includes(src_tar)){
                continue;
            }

            let is_dir = yield isDir(src_tar);
            if(is_dir){
                yield dirMustExist(path.join(dest,list[i]));
                yield copy(src_tar,path.join(dest,list[i]),except);
            }else{
               [err] = yield fs.copyFile(src_tar,path.join(dest,list[i]),resume);
               if(err){
                   throw err;
               }
            }
           
        }
    });
}

function readDirInfo(dir){
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
             let node = yield readDirInfo(path.join(dir,list[i]))
             if (null != node){
                 dir_struct.child.push(node)
             }
         }
 
     }else{
         dir_struct.type = "file";
         dir_struct.name = dir.split(/[\\/]/).pop();
         dir_struct.size = stat.size;
         dir_struct.mtime = stat.mtime.getTime();
 
     }
     return dir_struct;
    });
 }


exports.readDirInfo = readDirInfo;

exports.dirMustExist = dirMustExist;

exports.isDir = isDir;

exports.rmAll = rmAll;

exports.clean = clean;

exports.transfer = transfer;

exports.copy = copy;
 