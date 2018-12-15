// created by yyrdl on 2018.12.5
const co = require("zco");
const fs = require("fs");
const path = require("path");
const chalk = require("chalk");
const fileUtil = require("../../utils/file");

const Command = require("../../prototype/command");
const lang = require("../../prototype/lang");


function blank(num){
    let str = "";
    for(let i=0;i<num;i++){
        str+="  ";
    }
    return str;
}

function ls (){
    return co.brief(function*(resume){
         let cwd = process.cwd();
         let [err,list] = yield fs.readdir(cwd,resume);
         if(err){
             throw err;
         }
         let log  = "";
         for(let i=0;i<list.length;i++){
             let is_dir = yield fileUtil.isDir(path.join(cwd,list[i]));
             if(is_dir){
                 log += chalk.blue(list[i])+blank(3)
             }else{
                 log += chalk.green(list[i])+blank(3);
             }
    
         }
         log+="\n";
         console.log(log);
         
         return false;
    });
}

let type = lang.New().en("About File").zh("文件相关");
let note = lang.New().en("Print file list in current directory.").zh("列出当前目录的所有文件");
const cmd = new Command("ls",ls,type);

cmd.note(note);

cmd.usage("ls",note);

module.exports = cmd;