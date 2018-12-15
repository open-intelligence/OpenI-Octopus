// created by yyrdl on 2018.12.5
const co = require("zco");
const fs = require("fs");
const path = require("path");
const userInput = require("../input");
const Command = require("../../prototype/command");
const lang = require("../../prototype/lang");
const log = require("../../utils/log");
const validate = require("../../utils/validate");

function get(key){
    return co.brief(function*(resume){
        let value ;
        while (0 == 0){
             [value] = yield userInput.read(lang.New().en(`Please input "${key.toString()}":`).zh(`请设置${key.toString()} :`),resume);

             if(value && value.trim().length > 0){
                 break;
             }
        }
        return value.trim();
    });
}

function init(args,opt){
    return co.brief(function*(resume){
        let cwd = process.cwd();
        let project = null;
        if (fs.existsSync(path.join(cwd,"project.json"))){// 没有必要使用异步
            let [err,file] = yield fs.readFile(path.join(cwd,"project.json"),resume);
            if(err){
                throw err;
            }
            project = JSON.parse(file.toString());
            return null;
        }

        project = {};

        project.name = yield get(lang.New().en("project name").zh("项目名"));

        while (0 == 0 ){
            project.remote = yield get(lang.New().en("repository address").zh("项目地址"));
            if(validate.isValidateProjectAddress(project.remote)){
                break;
            }else{
                log.info(lang.New()
                .zh("[INIT ERROR] - 项目地址格式不正确")
                .en("[INIT ERROR] - Wrong form of repository address!"));
    
                log.info(lang.New()
                .zh("正确的格式是'http(s)://host/username/project_name.ms'")
                .en("Example form : 'http(s)://host/username/project_name.ms'"));
    
            }
        }
        
        project.current = yield get(lang.New().en("version").zh("版本"));
        project.versions  = [project.current];

        let [err] = yield fs.writeFile(path.join(cwd,"project.json"),JSON.stringify(project," ",2),resume);

        if(err){
            throw err;
        }

        if(!fs.existsSync(path.join(cwd,".ms"))){
             [err] = yield fs.mkdir(path.join(cwd,".ms"),resume);
             if(err){
                 throw err;
             }
        }
        
        log.info(lang.New().en("Congratulations,the project is initialized successfully!").zh("漂亮，项目初始化成功! (^_^)"));
        
        return false;
    });
}

let type = lang.New().en("About Project Management").zh("项目管理相关");
let note = lang.New().en("Initialize a project at current directory.").zh("在当前目录初始化一个项目");

const cmd = new Command("init",init,type);

cmd.note(note);

cmd.usage("init",note);

module.exports = cmd;
 