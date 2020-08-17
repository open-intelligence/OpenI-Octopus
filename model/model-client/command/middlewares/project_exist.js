// created by yyrdl on 2018.12.5
// check if the project is existed and is ilegal

const co = require("zco");
const fs = require("fs");
const path = require("path");
const url = require("url");
const lang = require("../../prototype/lang");
const log = require("../../utils/log");
const validate = require("../../utils/validate");

function exist(cmd,args,opt){
  return co.brief(function*(resume){
      let cwd = process.cwd();
      if(fs.existsSync(path.join(cwd,"project.json"))){

          let [err,file] = yield fs.readFile(path.join(cwd,"project.json"),resume);
          if(err){
              throw err;
          }

          let info = null,server = null;
          try{
             info  =  JSON.parse(file.toString());
             server = url.parse(info.remote);
          }catch(e){

            log.info(lang.New().en("The  file 'project.json' is illegal!").zh("非法的'project.json'文件"));
            return false;
          }

          if(!validate.isValidateProjectAddress(info.remote)){
              log.info(lang.New().en("The address of repository in 'project.json' is illegal!").zh("'project.json'中的项目地址不合法"));
              return false;
          }

        
          if (!info.name || !info.current || !Array.isArray(info.versions) || !info.remote || !server.hostname || !server.path){
            log.info(lang.New().en("The  file 'project.json' is illegal!").zh("非法的'project.json'文件"));
              return false;
          }

          paths = server.path.split(/[\\/]/);

          this.ctx.user = paths[1];


          this.ctx.profile = info;

          this.ctx.server = server;

          return true;
      }
          
      log.info(lang.New().en("Not a legal project,'project.json' is not found!").zh("非法的项目，没有找到'project.json'"));
     
      return false
  });
}

module.exports = exist ;