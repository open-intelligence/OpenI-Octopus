// created by yyrdl on 2018.12.5
const co = require("zco");
const Command = require("../../prototype/command");
const download = require("../../lib/download");
const lang = require("../../prototype/lang");

function pull(args,opt){
    return co.brief(function*(){
        yield download.download();
        return false;
    });
}

let type = lang.New().en("About Project Management").zh("项目管理相关");
let note = lang.New().en("Fetch repository from remote.").zh("从远程拉取项目");

const cmd = new Command("pull",pull,type);
cmd.note(note);
cmd.usage("pull",note);

module.exports = cmd;
 