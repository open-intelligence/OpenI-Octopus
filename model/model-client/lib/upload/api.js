// created by yyrdl on 2018.12.5
const co = require("zco");
const request = require("request");
/*** 
 * init upload project
*/
function init(project,filesInfo){
    return co(function*(resume){
        let server = this.ctx.server;

        let opt = {
            url: server.protocol+"//" + server.host+ "/upload/init",
            method: "POST",
            headers:{
              token:this.ctx.token
            },
            body: {
              user: this.ctx.user,
              project_info: filesInfo,
              project_name: project.name,
              project_version: project.current
            },
            json: true
          };

        let [err,_,body] = yield request(opt,resume);
        
        if(err){
            throw err
        }
        return body;
    });
}

/** 
 * 
 * commit upload 
*/

function commit(task_id){
   return co(function*(resume){
       
        let server = this.ctx.server;

        let opt = {
            url: server.protocol+"//" + server.host+ "/upload/commit",
            method: "POST",
            headers:{
               token: this.ctx.token
            },
            body: {
              upload_id: task_id
            },
            json: true
        };
        let [err,_,body] = yield request(opt,resume);
        if(err){
            throw err
        }
        return body;
   })
}

/***
 * 
 * upload file block
 */
function upload(taskInfo,stream,callback){

    let server = callback.ctx().server;
    let token = callback.ctx().token;

    let query = "file="+encodeURIComponent(taskInfo.file) +
    "&seq="+taskInfo.seq+"&total="+taskInfo.total+"&upload_id=" +
     encodeURIComponent(taskInfo.id);

    let replyed = false;

    function reply(error,body){
        if (!replyed) {
            replyed = true;
            callback && callback(error, body);
        }
    }

    let opt = {
        url:server.protocol+"//"+server.host+"/upload?"+query,
        method:"POST",
        headers:{
           "token":token,
           "content-type":"application/octet-stream"
        }
    };

    let req = request(opt,function(err,res,body){
         if(err){
             reply(err);
         }else{
             reply(null,body);
         }
    });

    stream.pipe(req);
}


exports.init = init;

exports.commit = commit;

exports.upload = upload;