// created by yyrdl on 2018.12.5
const co  = require("zco");
const log = require('../utils/log');
const userInput = require("./input");
const Flow = require("../prototype/flow");

const cmd_init = require("./commands/init");
const cmd_pull  = require("./commands/pull");
const cmd_push = require("./commands/push");
const cmd_version  = require("./commands/version");
const cmd_clone = require("./commands/clone");
const cmd_convert = require("./commands/convert");
const cmd_login = require("./commands/login");


const cmd_ls  = require("./commands/ls");
const cmd_cd = require("./commands/cd");
const cmd_touch = require("./commands/touch");
const cmd_rm = require("./commands/rm");
const cmd_mkdir = require("./commands/mkdir");

const cmd_exit = require("./commands/exit");
const cmd_lang  = require("./commands/lang");


const exist = require("./middlewares/exist")
const notFound =  require("./middlewares/not_found");
const signed = require("./middlewares/signed");

require("./setup").run();


const flow = new Flow();
 
flow.use("exit",cmd_exit);//done
flow.use("lang",cmd_lang);//done

flow.use("ls",cmd_ls);//done
flow.use("cd",cmd_cd);//done
flow.use("rm",cmd_rm);//done
flow.use("mkdir",cmd_mkdir);//done
flow.use("touch",cmd_touch)//done

flow.use("init",cmd_init);//done
flow.use("login",cmd_login);//done
flow.use("clone",cmd_clone);//done
flow.use("pull",exist,signed,cmd_pull);//done
flow.use("push",exist,signed,cmd_push);//done
flow.use("version",exist,cmd_version);//done
flow.use("convert",exist,signed,cmd_convert);//done




flow.use(notFound);


co(function*(resume){
    while( 0 == 0){
        // get user's input
        let [input] = yield userInput.read(resume);

        if(!input || input.trim().length == 0){
            continue;
        }
        //parse user's input
        let {cmd,args,opt} = userInput.parse(input);

        //start run command
        let [err] = yield flow.run(cmd,args,opt);

        if(err){
            log.error(err);
        }
    }
})()