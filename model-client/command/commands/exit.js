// created by yyrdl on 2018.12.5
const co = require("zco");
const Command = require("../../prototype/command");
const lang = require("../../prototype/lang");




function _exit(args,opt){
    return co.brief(function*(){
        process.exit(0)
        return false;
    })
}

let type = lang.New().en("System").zh("系统");
let note  = lang.New().en("Exit the command line tool.").zh("退出命令行工具");

const cmd = new Command("exit",_exit,type);

cmd.note(note);

cmd.usage("exit",note);

module.exports = cmd;
 