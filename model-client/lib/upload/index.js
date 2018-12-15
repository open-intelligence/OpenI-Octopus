// created by yyrdl on 2018.12.5
const co = require("zco");
const project = require("./project");
const api = require("./api");
const streamUtil = require("./stream");
const log = require("../../utils/log");
const config = require("../../config");
const lang = require("../../prototype/lang");
const Reporter = require("../../utils/report");

const MAX_TRY_TIME = config.maxTryTime || 3;
const BLOCK_SIZE = config.blockSize || 64 * 1024 * 1024; //default 64MB

/**
 * conccurrent lock
 */
const c_lock = require('../../utils/concurrent').New(5);

function uploadFile(taskInfo,reporter) {
	return co.brief(function  * (resume, defer) {

		defer(function  * () {
			c_lock.unLock();
		});

		yield c_lock.lock(resume);

		let stream = streamUtil.read(taskInfo.file,taskInfo.start,taskInfo.end);

		let uploadedDataSize = 0;

		stream.on("data",function(d){
			uploadedDataSize+= d.length;
			reporter.Incre(d.length);

		});

		let[err, body] = yield api.upload(taskInfo, stream, resume);

		if (err) {
			 log.debug(err)

			reporter.Sub(uploadedDataSize)

			return {
				id: taskInfo.id,
				success: false,
				message: err.message
			};
		}

		let res = JSON.parse(body);

		if(false == res.success){
			reporter.Sub(uploadedDataSize);
		}

		return {
			id: taskInfo.id,
			success: res.success,
			message: res.message
		};

	});
}

function beforeUpload() {
	return co.brief(function  * () {
		let cwd = process.cwd();

		let projectInfo = this.ctx.profile;

		log.info(lang.New().zh(`准备上传${projectInfo.name}的${projectInfo.current}版`)
		.en(`Start to upload version "${projectInfo.current}" of "${projectInfo.name}"`))

		 

		let  filesInfo = yield project.filesInfo(cwd);

	 

		if("dir" == filesInfo.type){
			filesInfo.child = filesInfo.child.filter(it=>{
				return it.name != ".ms"
			});
		}

		let initRes = yield api.init(projectInfo, filesInfo);

		if (!initRes.success) {
			log.info(lang.New().en(`[UPLOAD PROJECT ERROR] - ${initRes.message}`).zh(`[UPLOAD PROJECT ERROR] -  ${initRes.message}`));
			return false
		}

		let task_id = initRes.upload_id;

		//generate upload tasks 
		let  tasks = yield project.genUploadTask(cwd, config.blockSize);

        // ignore other versions
		tasks = tasks.filter(it=>{
			return it.name.indexOf("./.ms") != 0;
		});

		return {
			task_id: task_id,
			tasks: tasks
		};
	});
}

function startUpload(sub_tasks, reporter) {
	return co.brief(function  * () {
		let success = true;

		for (let i = 0; i < MAX_TRY_TIME; i++) {
			
			let task_list = sub_tasks.filter(it => {
					return it.success == false;
			});

			success = true;
			
			task_list = task_list.map(function (it) {
					return co.brief(function  * () {
						let res = yield uploadFile(it,reporter);
						it.success = res.success;
						if(!res.success){
							success = false;
							this.ctx.lastUploadError = res.message;
						}
						return res;
					});
			});

			yield co.all.apply(null, task_list);

			if (success) {
				break;
			}
		}

		return success;
	});
}
/***
 *
 *  upload project
 * 
 */

function uploadProject() {
	return co.brief(function  * () {

		let prepareInfo = yield beforeUpload();

		let {task_id,tasks} = prepareInfo;

		let totalSize = 0;

		let mini_tasks = [];

		let mini_tasks_map = {};
        // generate upload task for every file block
		for (let i = 0; i < tasks.length; i++) {

			let task = tasks[i];

			totalSize += task.size;

			for (let k = 0; k < task.block_num; k++) {
				let block_task = {
					id: task_id,
					file: task.name,
					seq: k + 1,
					total: task.block_num,
					start: k * BLOCK_SIZE,
					end: (k + 1) * BLOCK_SIZE-1,
					success: false
				};
				block_task.size = BLOCK_SIZE;

				if( block_task.end > task.size){
					block_task.size = task.size - block_task.start;
				}

				mini_tasks.push(block_task);
				mini_tasks_map[block_task.file + "_" + block_task.seq] = block_task;
			}
		}

		log.info(lang.New().zh(`总共${tasks.length}个文件,${(totalSize/1024/1024).toFixed(2)}MB`)
		.en(`${tasks.length} files in total,${(totalSize/1024/1024).toFixed(2)}MB`))
 
		let reporter = new Reporter(totalSize,lang.New().en("Uploading").zh("上传进度"));

		let success =  yield startUpload(mini_tasks,reporter);

		if (!success) {
			log.info(lang.New().en("[UPLOAD ERROR] - Failed to upload,"+(this.ctx.lastUploadError || "Please check the network"))
			.zh("[UPLOAD ERROR] - 上传失败,"+(this.ctx.lastUploadError || "请检查网络")));

			return false;
		}

		for (let i = 0; i < MAX_TRY_TIME; i++) {

			let res = yield api.commit(task_id);
		 
			if (false == res.success) {
				this.ctx.lastUploadError = res.message;

				success = false;

				continue;
			}
            
			if (res.left.length == 0) {
				success = true;
				break;
			} else {
				for (let j = 0; j < res.left.length; j++) {
					let file = res.left[j];
					for (let k = 0; k < file.lack.length; k++) {
						let block = mini_tasks_map[file.file + "_" + file.lack[k]];
						if (block) {
							block.success = false;
						}
					}
				}

				yield startUpload(mini_tasks,reporter);
		
			}
		}

		if (!success) {
			log.info(lang.New().en("[UPLOAD ERROR] - Failed to upload,"+(this.ctx.lastUploadError))
			.zh("[UPLOAD ERROR] - 上传失败,"+this.ctx.lastUploadError ));
			return false;
		}

		 log.info(lang.New().en("\nUpload successfully!").zh("\n上传成功!"))

	});
}

exports.uploadProject = uploadProject;
