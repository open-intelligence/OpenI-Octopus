// created by yyrdl on 2018.12.5
const co = require("zco");
const fs = require("fs");
const path = require("path");
const Command = require("../../prototype/command");
const lang = require("../../prototype/lang");
const log = require("../../utils/log");


function cd(args,opt){
   return co.brief(function*(){
       let targetDir = path.join(process.cwd(),args[0]);
       if(!fs.existsSync(targetDir)){
           let l = lang.New().zh(`目录"${targetDir}"不存在`).en(`Directory "${targetDir}" Not Found!`);
           log.info(l);
       }else{
           process.chdir(targetDir);
       }
       return false;
   })
}

let type = lang.New().en("About File").zh("文件相关");
let note = lang.New().en("Switch to target directory.").zh("切换到指定目录");
let usage1 = lang.New().zh("切换到'path'指定的路径").en(`Switch to directory which is specified by "path".`);

const cmd = new Command("cd",cd,type);

cmd.note(note);

cmd.usage("cd 'path'",usage1);

module.exports = cmd;
 