// created by yyrdl on 2018.12.5
const co = require("zco");
const fs = require("fs");
const path = require("path");
const fileUtil = require("../../utils/file");
 

const Command = require("../../prototype/command");
const lang = require("../../prototype/lang");
 

function rm (args,opt){
    return co.brief(function*(resume){
         let cwd = process.cwd();
         let file = path.join(cwd,args[0]);

         if(!fs.existsSync(file)){
             return false;
         }

         yield fileUtil.rmAll(file);
         return false;
    });
}


let type = lang.New().en("About File").zh("文件相关");
let note = lang.New().en("Remove all files at target path.").zh("删除指定路径下的所有文件");

const cmd = new Command("rm",rm,type);
 
cmd.note(note);

cmd.usage("rm 'path'",note);


module.exports = cmd;