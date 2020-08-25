// created by yyrdl on 2018.12.5
const co = require("zco");
const Command = require("../../prototype/command");
const upload = require("../../lib/upload");
const lang = require("../../prototype/lang");


function push(args,opt){
    return co.brief(function*(){
        yield upload.uploadProject();
        return false;
    });
}

let type = lang.New().en("About Project Management").zh("项目管理相关");
let note = lang.New().en("Update remote repository.").zh("将本地项目数据更新到远程仓库");


const cmd = new Command("push",push,type);

cmd.note(note);

cmd.usage("push",note);

module.exports = cmd;
 