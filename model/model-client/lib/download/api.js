//created by yyrdl on 2018.12.5

const co = require("zco");
const request = require("request");

/** 
 * @param {String} project_name
 * @param {String} project_version
 * @return {Object} init response
 * @api public
*/
function init(project_name, project_version) {
	return co.brief(function  * (resume) {

		let server = this.ctx.server;

		let opt = {
			"url": server.protocol+"//" + server.host+ "/download/init",
			"method": "POST",
			"headers":{
               token:this.ctx.token
			},
			"body": {
				user: this.ctx.user,
				project_name: project_name,
				project_version: project_version
			},
			"json": true
		};

		let[err, _, body] = yield request(opt, resume);

		if (err) {
			throw err;
		}

		return body;
	});
}

/*** 
 * @param {WriteStream} writeStream
 * @param {Object} task_info
 * @param {Reporter} reporter
 * @param {Function} callback
 * @return {Null}
 * @api public
*/
function download(writeStream,task_info,reporter,callback){

	  let token = callback.ctx().token;
	  let server = callback.ctx().server;

	  let query  = "file="+encodeURIComponent(task_info.file)+"&seq="+encodeURIComponent(task_info.seq)+
	  "&version="+encodeURIComponent(task_info.version)+"&project="+encodeURIComponent(task_info.project)+"&user="
	  +encodeURIComponent(task_info.user)+
	  "&block_size="+encodeURIComponent(task_info.block_size);

	  let replied = false;

	  let download_size = 0;

	  function reply(err){
		  if(!replied){
	          if(err){
				  reporter.Sub(download_size);
			  }
			  replied = true;
			  callback && callback(err);
		  }
	  }

	  writeStream.on("error",function(err){
		  reply(err);
	  });

	  let opt = {
		  "url":server.protocol+"//"+server.host+"/download?"+query,
		  "method":"GET",
		  "headers":{
			  token:token
		  },
		  "followRedirect ":true
	  };
	  
	  request(opt,function(err,res){
		  if(err){
			  reply(err);
		  }else if(200 != res.statusCode){
              reply(new Error("Download Failed,status:"+res.statusCode));
		  }
	  }).on("error",function(er){
		  reply(er);
	  }).on("data",function(d){
		  download_size+= d.length;
		  reporter && reporter.Incre(d.length);
	  }).on("end",function(){
		  reply(null);
	  }).pipe(writeStream);

}

function commit (){
	return co.brief(function*(){
        //ignore
	});
}


exports.init = init;

exports.commit = commit;

exports.download = download;