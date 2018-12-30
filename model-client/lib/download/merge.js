// created by yyrdl on 2018.12.5


const co = require("zco");
const fs = require("fs");
const path = require("path");
const tempFile = require("./tempFile");
const Lock = require("../../prototype/concurrent");

const c_lock  =  new Lock(5);

function merge(writeStream,readStream,callback){

     let replied = false;

     function reply(err){
         if(!replied){
             replied = true;
             callback && callback(err);
         }
     }

     writeStream.on("error",function(err){
         reply(err);
     });

     readStream.on("error",function(err){
         reply(err);
     });

     readStream.on("end",function(){
         setTimeout(function(){
             reply(null);
         },200);
     });

     readStream.pipe(writeStream,{
         end:false
     });
}

/**
 * merge files
 * 
 * @param {String} dir (path of directory)
 * @param {String} fileName (original file name)
 * @return {Null}
 * @api public
*/
function mergeFile(dir,fileName){
   return co.brief(function*(resume,defer){
  
        defer(function*(){
           c_lock.unLock();
        })

        yield c_lock.lock(resume);

        //get temp file list which is a part of file `fileName`
        let file_list = yield tempFile.getTempFileList(dir,fileName);

        if (0 == file_list.length){
            return 
        }

        if(file_list.length ==1 && file_list[0].seq == file_list[0].total){
            if((file_list[0].total > 1 && file_list[0].merged)|| file_list[0].total == 1){
                let [err] = yield fs.rename(path.join(dir,file_list[0].temp_name),path.join(dir,file_list[0].name),resume);
                if(err){
                    
                    throw err;
                }
                return null
            }
        }

        if(file_list.length <2){
            return null;
        }

       
        if(!(file_list[0].seq == 1 || file_list[0].merged == true)){
            return null;
        }

        let writer = fs.createWriteStream(path.join(dir,file_list[0].temp_name),{
            flags:'a'
        });        

        for(let i=1;i<file_list.length;i++){
            let reader = fs.createReadStream(path.join(dir,file_list[i].temp_name));
            [err] = yield merge(writer,reader,resume);
            if(err){
                 
                throw err;
            }

            [err] = yield fs.unlink(path.join(dir,file_list[i].temp_name),resume);

            if(err){
                throw err;
            }
        }

        writer.end();

        let newFileName = null;

        if(file_list[file_list.length-1].seq == file_list[0].total){
            newFileName = file_list[0].name;
        }else{
            newFileName = file_list[0].name+"T_"+file_list[file_list.length-1].seq+"_"+file_list[0].total+"_Y.temp";
        }

        [err] = yield fs.rename(path.join(dir,file_list[0].temp_name),path.join(dir,newFileName),resume);

        if(err){
            throw err;
        }

   });
}

exports.mergeFile = mergeFile;


 