// created by yyrdl on 2018.12.5

const co = require("zco");
const fs = require("fs");
const path  = require("path");
const uuidv4 = require('uuid/v4');

const lockFile = require("./lock");
const api = require("./api");
const taskUtil = require("./task");
const mergeUtil = require("./merge");
const tempFile = require("./tempFile");
const config = require('../../config');

const log = require("../../utils/log");
const fileUtil = require("../../utils/file");

const lang = require("../../prototype/lang");
const Reporter = require("../../prototype/report");
const Lock = require("../../prototype/concurrent");

//conccurent lock


const c_lock = new Lock(5);

const MAX_TRY_TIME = config.maxTryTime || 3;// max retry time when dowload data
 

function downloadWorker(dir,task_info,reporter){
    return co(function*(resume,defer){
           // generate temp file for the time being
           let mdzz_file  = uuidv4()+".mdzz";

           let file_path = path.join(dir,task_info.file);

           let last_seg = file_path.lastIndexOf("/");

           if(-1 == last_seg){
               last_seg = file_path.lastIndexOf("\\");
           }

           let file_name = file_path.slice(last_seg+1);

           let file_dir = file_path.slice(0,last_seg);

           let mdzz_file_path = path.join(file_dir,mdzz_file);


           defer(function*(next){

               if(fs.existsSync(mdzz_file_path)){
                   yield fs.unlink(mdzz_file_path,next);
               }

               c_lock.unLock();
           });

           yield  c_lock.lock(resume);

           let [err0] = yield fileUtil.dirMustExist(file_dir);

           if(err0){

               log.debug(err0)

               return {
                   success:false,
                   message:err0.message
               };
           }

           let writeStream = fs.createWriteStream(mdzz_file_path);

           // start dowload file block and write to temp file
           let [err] = yield api.download(writeStream,task_info,reporter,resume);

    
           if(err){
               log.debug(err);
    
               return {
                   success:false,
                   task:task_info,
                   message:err.message
               };

           }
           // dowload successfully  and generate formal temp file name 
           let temp_file_name = tempFile.genTempFileName(file_name,task_info.seq,task_info.total);
          
           [err] = yield fs.rename(mdzz_file_path,path.join(file_dir,temp_file_name),resume);


           if(err){

               log.debug(err);
             
               return {
                   success:false,
                   task:task_info,
                   message:err.message
               };
           }

           return {
               success:true,
               task:task_info
           };
    });
}
 

function startDownload(dir,tasks,reporter){
    return co.brief(function*(){
    
        let not_success_tasks = tasks.filter(it=>{
            return it.success != true;
        });

        let success = true;

        let coroutines = not_success_tasks.map(function(it){

            return co.brief(function*(){
               
                let res = yield downloadWorker(dir,it,reporter);

                it.success = res.success;

                if(!res.success){
                    log.debug("[DOWNLOAD FILE ERROR]-file:"+it.file+" [ERROR]"+res.message);

                    this.ctx.lastFetchError = res.message;// record the error message at context

                    success = false;
                }

                return res;
            });
        });

        yield co.all.apply(null,coroutines);

        return success;
    });
}

function  startMerge (dir,tasks){
    return co.brief(function*(){

            let not_success_tasks = tasks.filter(it=>{
                return it.success != true;
            });

            let coroutines = not_success_tasks.map(it=>{
                return co.brief(function*(){
                     yield mergeUtil.mergeFile(path.join(dir,it.dir),it.file_name);
                     it.success = true;
                })
            });

            yield co.all.apply(null,coroutines);
    });
}

/*** 
 * 
 *  download the current project 
 * 
*/
 
function Download(){
    return co.brief(function*(resume,defer){
       
        let cwd = process.cwd();
        //if there is a dowload.lock file, remove the download temp directory
        let old_temp_dir = yield lockFile.read(cwd);

        if (null != old_temp_dir){
            
            yield fileUtil.rmAll(path.join(cwd,old_temp_dir));
        }

        //start to create work directory 
          
        let temp_dir = uuidv4();

        yield lockFile.write(cwd,temp_dir);

        let temp_work_directory  = path.join(cwd,temp_dir);

        defer(function*(){
            if(fs.existsSync(temp_work_directory)){
                yield fileUtil.rmAll(temp_work_directory);
            }
            yield lockFile.remove(cwd);
        });

        if(!fs.existsSync(temp_work_directory)){
            
            let [err] = yield fs.mkdir(temp_work_directory,resume);

            if(err){
                throw err;
            }
    
        }

        //get project info from context 

        let projectInfo = this.ctx.profile;
        let user = this.ctx.user;

        //initialize download
        let initRes = yield api.init(projectInfo.name,projectInfo.current);


        if(initRes.success == false){
            log.info(lang.New().en("[FETCH PROJECT ERROR] - "+initRes.message).zh("[FETCH PROJECT ERROR] - "+initRes.message));
            return false
        }

        if(false == initRes.found){
           log.info(lang.New().en(`[FETCH PROJECT ERROR] - "${projectInfo.name}" is not found`).zh(`[FETCH PROJECT ERROR] - 项目"${projectInfo.name}"没有找到`))
           return ;
        }

        let dir_info = initRes.project_info;

        if(!dir_info || !dir_info.child || dir_info.child.length == 0){
            log.info(lang.New().en("[FETCH PROJECT] - The project is empty at remote").zh("[FETCH PROJECT] - 远程项目是空的"));
            return 
        }
        
        // 生成下载任务
        let {total_size,tasks} = taskUtil.genDownloadTask(dir_info);
      
       
        tasks.forEach(it=>{
            it.version = projectInfo.current;
            it.user = user;
            it.project = projectInfo.name;
        });

       
        let merge_size = total_size*0.1;

        let reporter   = new Reporter(total_size+merge_size,lang.New().en("Downloading").zh("下载进度"));

        let success = true;
        // start download 
        for(let i=0;i<MAX_TRY_TIME;i++){

             success = yield startDownload(temp_work_directory,tasks,reporter);

             if(true == success){
                 break;
             }

             yield setTimeout(resume,5000);//wait 5 seconds if not success
        }


        if(!success){
            log.info(lang.New().en(`[FETCH PROJECT ERROR] - Failed to fetch porject--${this.ctx.lastFetchError}`).zh("[FETCH PROJECT ERROR] - 拉取失败--"+this.ctx.lastFetchError));
            return null
        }

        // download successfully ,and start merge temp files

        let mergeTask = taskUtil.genMergeTask(dir_info);

        yield startMerge(temp_work_directory,mergeTask);

        // merge temp files successfully

         yield fileUtil.clean(cwd,[temp_dir,".ms"]);

         yield fileUtil.transfer(temp_work_directory,cwd);

         reporter.Incre(merge_size);


         log.info(lang.New().en("Fetch successfully!").zh("拉取成功!"));

    });
}


exports.download = Download;