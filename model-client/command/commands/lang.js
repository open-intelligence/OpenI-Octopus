const co = require("zco");
const Command = require("../../prototype/command");
const lang = require("../../prototype/lang");
const setUp = require("../setup");
const env = require("../../lib/env");

function _switch(){
    return co.brief(function*(){
          yield env.SetEnv("lang",env.GetEnv().lang == "zh" ? "en":"zh");
          yield env.Reload();
          setUp.run();
    });
}



let cmd = new Command("lang",_switch,lang.New().en("System").zh("系统"));

let note = lang.New().en("切换系统语言").zh('Switch system language.');

cmd.note(note);
cmd.usage("lang",note);


module.exports = cmd;



