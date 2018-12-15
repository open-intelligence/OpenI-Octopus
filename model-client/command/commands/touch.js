// created by yyrdl on 2018.12.5
const co = require("zco");
const fs = require("fs");
const path = require("path");
 

const Command = require("../../prototype/command");

const lang = require("../../prototype/lang");

 

function touch (args){
    return co.brief(function*(resume){
        
        let cwd = process.cwd();
        let file = path.join(cwd,args[0]);
        
         if (!fs.existsSync(file)){
             let [err] = yield fs.writeFile(file,"",resume);
             if(err){
                 throw err;
             }
         }
         return false;
    });
}

let type = lang.New().en("About File").zh("文件相关");
let note = lang.New().en("Create a file in current directory.").zh("在当前目录创建一个文件");

const cmd = new Command("touch",touch,type);

cmd.note(note);
cmd.usage("touch 'file'",note);

module.exports = cmd;