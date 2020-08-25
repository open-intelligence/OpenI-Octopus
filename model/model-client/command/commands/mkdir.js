// created by yyrdl on 2018.12.5
const co = require("zco");
const fs = require("fs");
const path = require("path");
 

const Command = require("../../prototype/command");
const lang = require("../../prototype/lang");

 

function mkdir (args){
    return co.brief(function*(resume){
         let cwd = process.cwd();
         let file = path.join(cwd,args[0]);
         let [err] = yield fs.mkdir(file,resume);
         if(err){
            throw err;
         }
         return false;
    });
}

let type = lang.New().zh("文件相关").en("About File");
let note = lang.New().en("Create an new directory at current path.").zh("在当前目录新建一个文件夹");

const cmd = new Command("mkdir",mkdir,type);

cmd.note(note);

cmd.usage("mkdir 'directory name'",note);

module.exports = cmd;