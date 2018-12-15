// created by yyrdl on 2018.12.5
// generate download and merge task
const config = require("../../config");
const path = require("path");
const BLOCK_SIZE = config.blockSize || 64 * 1024 * 1024; //default 64MB
 
function genDownloadTask(project_info) {
    
	function _gen(node, dir, deep) {
		let result = [];
		if (node.type == "dir") {
			let child = node.child;
			let sub_dir = '';
			if (deep == 0) {
				sub_dir = "./";
			} else {
				sub_dir = path.join(dir, node.name);
			}
			for (let i = 0; i < child.length; i++) {
				let sub_result = _gen(child[i], sub_dir, deep + 1);
				result = result.concat(sub_result);
			}
		} else {
			result.push({
				file: path.join(dir, node.name),
				size: node.size,
				block_num: Math.ceil(node.size / BLOCK_SIZE),
				block_size: BLOCK_SIZE
			});
		}
		return result;
	}

	let tasks = _gen(project_info, "./", 0);

	let totalSize = 0;

	let sub_tasks = [];
	 
	for (let i = 0; i < tasks.length;i++) {

		let task = tasks[i];

		totalSize += task.size;

		for (let k = 0; k < task.block_num; k++) {
			let block_task = {
				file: task.file,
				seq: k + 1,
				total: task.block_num,
				start: k * BLOCK_SIZE,
				end: (k + 1) * BLOCK_SIZE - 1,
				success: false,
				block_size :BLOCK_SIZE
			};

			block_task.size = BLOCK_SIZE;

			if (block_task.end > task.size) {
				block_task.size = task.size - block_task.start;
			}

			sub_tasks.push(block_task);
		}
	}

	return {
		total_size: totalSize,
		tasks: sub_tasks
	};
}

function genMergeTask(info) {
	function _gen(node, dir, deep) {
		let result = [];
		if (node.type == "dir") {
			let child = node.child;
			let sub_dir = '';
			if (deep == 0) {
				sub_dir = "./";
			} else {
				sub_dir = path.join(dir, node.name);
			}
			for (let i = 0; i < child.length; i++) {
				let sub_result = _gen(child[i], sub_dir, deep + 1);
				result = result.concat(sub_result);
			}
		} else {
			result.push({
				dir: dir,
				file_name: node.name,
				success:false,
				block_num:Math.ceil(node.size/BLOCK_SIZE)
			});
		}
		return result;
	}

	return _gen(info, "./", 0);
}
exports.genDownloadTask = genDownloadTask;
exports.genMergeTask = genMergeTask;

