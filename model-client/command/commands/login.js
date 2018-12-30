// created by yyrdl on 2018.12.12
const co = require("zco");
const Command = require("../../prototype/command");
const lang = require("../../prototype/lang");
const userLib = require("../../lib/user")
const url = require("url");
const log = require('../../utils/log');

function Login (args,opt){
    return co.brief(function*(){
         let user = opt.u;
         let pwd = opt.p;
         let remote = opt.r;
         if(!user){
             log.info(lang.New().en("Parameter '-u'(username) is required").zh("需要'-u'(用户名)参数"));
             return false;
         }

        if(!pwd){
            log.info(lang.New().en("Parameter '-p'(password) is required").zh("需要'-p'(密码)参数"));
            return false;
        }

        if(!remote){
            log.info(lang.New().en("Parameter '-r'(server address) is required").zh("需要'-r'(远程仓库地址)参数"));
            return false;
        }

        let server = null;
        try{
            server = url.parse(remote);

        }catch(e){
            log.info(lang.New().en("Parameter '-r'(server address) is illegal!").zh("参数'-r'(远程仓库地址)不合法"));
            return false;
        }

        if(! server.protocol || !server.host){
            log.info(lang.New().en("Parameter '-r'(server address) is illegal!").zh("参数'-r'(远程仓库地址)不合法"));
            return false;
        }

        this.ctx.server = server;

        let loginRes = yield userLib.login(user,pwd);

        if(loginRes.success){
            yield userLib.setInfo(server.hostname,loginRes.token,user);
            log.info(lang.New().en("  Login successfully!").zh("登录成功"));
          
        }else{
            log.info(lang.New().en("  Login failed!").zh("登录失败"));
        }

        return false;
    });
}


const cmd = new Command("login",Login,lang.New().en("About Project Management").zh("项目管理相关"));

cmd.note(lang.New().en("Login in remote repository server").zh("登录远程模型仓库"));

cmd.usage("login -u 'user' -p 'pwd' -r 'http(s)://xxx.xxx.xxx'",lang.New().en("Login in remote server,and '-r' is the address of server")
.zh("登录远程仓库,通过'-r'指定仓库的地址 "))

module.exports  = cmd;