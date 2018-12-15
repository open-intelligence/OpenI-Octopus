// created by yyrdl on 2018.12.5
/** 
 * check if user has logged in
 * 
 * 是否有登陆
*/

const co = require("zco");
const userInfo = require("../../lib/userInfo");
const userInput = require("../input");
const login = require("../../lib/login");
const lang = require("../../prototype/lang");
const log = require("../../utils/log");


function get(key){
    return co.brief(function*(resume){
        let value;
        while (0 == 0){
             [value] = yield userInput.read(`${key} : `,resume);
             
             if(value){
                 break;
             }
        }
        return value;
    });
}

function signed(){
    return co.brief(function*(){
        
         let domain = this.ctx.server.hostname;

         let info = yield userInfo.GetInfo(domain,this.ctx.user);

         let token = info.token;

         let user = this.ctx.user || info.user;

         if(!token || "" == token){

             log.info(lang.New().en("You are not logged into the remote server,please login in.")
             .zh("您未登陆远程仓库，请登录"))
            
             user = yield get("username");

             let pwd = yield get("password");

             let res = yield login.login(user,pwd);

             if(res.success){
                 token  = res.token;
                 yield userInfo.SetInfo(domain,token,user);
             }else{
                 log.info("[LOGIN FAILED] - "+res.message);
                 return false;
             }
         } 

         let  valid = yield login.signed(token);

         if(!valid){
            log.info(lang.New().en("Logon failure: the specified account password has expired").zh("登录已过期"));
            yield userInfo.SetInfo(domain,"","");
            return false;
        }

         this.ctx.token = token;

         return true;
    });
}


module.exports = signed;