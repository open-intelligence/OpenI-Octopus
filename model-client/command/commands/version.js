// created by yyrdl on 2018.12.5
const co = require("zco");
const path = require("path");
const fs = require("fs");
const fileUtil = require("../../utils/file");
const chalk = require("chalk");
const Command = require("../../prototype/command");
const download = require('../../lib/download');
const lang = require("../../prototype/lang");
const log = require("../../utils/log");

function create(cwd,args,opt){
    return co.brief(function*(resume,defer){
          let version = args[1];

          if (!version){
              log.info(lang.New().en("Parameter 'version' is required!").zh("缺失参数'version'(版本号)"))  
              return null;
          }
          
          let copy = opt.c || true;

          let [err,file] = yield fs.readFile(path.join(cwd,"project.json"),resume);
          if(err){
              throw err;
          }
          let json = JSON.parse(file.toString());

          let current_version = json.current;

          if(json.versions.length == 0){
              json.versions.push(current_version);
          }

          if(json.versions.includes(version)){
              log.info(lang.New().en(`Version "${version}" has already existed.`).zh(`版本"${version}"已经存在`));
              return null;
          }

          json.versions.push(version);

          [err] = yield fs.writeFile(path.join(cwd,"project.json"),JSON.stringify(json," ",2),resume);


          if(err){
              throw err
          }
          
          //add new version to project.json 
          for(let i=0;i<json.versions.length;i++){
              let v = json.versions[i];
              let cache_path = path.join(cwd,".ms","v"+v);
              yield fileUtil.dirMustExist(cache_path);
              json.current = v;
              [err] = yield fs.writeFile(path.join(cache_path,"project.json"),JSON.stringify(json," ",2),resume);

              if(err){
                 throw err;
              }
          }


          let cache_path_for_current = path.join(cwd,".ms","v"+current_version);

          yield fileUtil.dirMustExist(cache_path_for_current);

          yield fileUtil.clean(cache_path_for_current);

          yield fileUtil.transfer(cwd,cache_path_for_current,[".ms"]);

          json.current = version;

          yield fileUtil.clean(cwd,[".ms"]);

          [err] = yield fs.writeFile(path.join(cwd,"project.json"),JSON.stringify(json),resume);
          if(err){
              throw err;
          }

          if (copy && json.versions.length > 1){
              let src_version = json.versions[json.versions.length-2];
              let src_path = path.join(cwd,".ms","v"+src_version);
              yield fileUtil.copy(src_path,cwd,[path.join(src_path,"project.json")]);
          }

          log.info(lang.New().en(`Create new version "${version}" successfully!`).zh(`版本${version}创建成功`));

    });
}

function _switch(cwd,version){
    return co.brief(function*(resume){
        let [err,file] = yield fs.readFile(path.join(cwd,"project.json"),resume);
        if(err){
            log.info(lang.New().en("Failed to switch version,"+err.message).zh("切换版本失败,"+err.message));
            return false;
        }
        let json = JSON.parse(file);
        let current = json.current;
        if(version == current){
            return null;
        }
        if(!json.versions.includes(version)){
            log.info(lang.New().en(`The version "${version}" has not existed!`).zh(`版本"${version}"不存在`));
          
            return null;
        }
        let target_version_cache_path = path.join(cwd,".ms","v"+version);

        if(!fs.existsSync(target_version_cache_path)){
            log.info(lang.New().en(`The version "${version}" has not existed!`).zh(`版本"${version}"不存在`));
         
            return null;
        }

        if(!fs.existsSync(path.join(target_version_cache_path,"project.json"))){
            log.info(lang.New().en("Missing 'project.json'.").zh("缺失'project.json'."));
            return null;
        }

        let current_cache_path = path.join(cwd,".ms","v"+current);
        if(fs.existsSync(current_cache_path)){
            yield fileUtil.rmAll(current_cache_path);
        }

        [err] = yield fs.mkdir(current_cache_path,resume);

        if(err){
            
            log.info(lang.New().en("Failed to switch version,"+err.message).zh("切换版本失败,"+err.message));
            return false;
            
        }

        yield fileUtil.transfer(cwd,current_cache_path,[".ms"]);

        yield fileUtil.clean(cwd,[".ms"]);

        yield fileUtil.transfer(target_version_cache_path,cwd);

        [err,file] = yield fs.readFile(path.join(cwd,"project.json"),resume);

        if(err){
            log.info(lang.New().en("Failed to switch version,"+err.message).zh("切换版本失败,"+err.message));
            return false;
        }

        json = JSON.parse(file);

        if(false == json.synced){
            log.info(lang.New().en("Start to download data from remote repository server\n").zh("开始从远程仓库下载项目数据"));
            yield download.download();
            delete json.synced;
            [err] = yield fs.writeFile(path.join(cwd,"project.json"),JSON.stringify(json," ",2),resume);
            if(err){
                throw err;
            }
        }

        log.info(lang.New().en("Successfully").zh("成功切换版本"));

    });
}

function current(cwd){
    return co.brief(function*(resume){
        let [err,file] = yield fs.readFile(path.join(cwd,"project.json"),resume);
        if(err){
            log.info(lang.New().en("Failed to print current version,"+err.message).zh("打印当前版本号失败,"+err.message))
            return false;
        }
        let json = JSON.parse(file);
        let current = json.current;
        console.log("\n"+chalk.blue(current)+"\n")
    });
}

function list(cwd){
    return co.brief(function*(resume){
         let [err,file] = yield fs.readFile(path.join(cwd,"project.json"),resume);
         if(err){
             log.info(lang.New().en("Failed to list versions,"+err.message).zh("列出版本列表失败,"+err.message))

             return false;
         }
         let json = JSON.parse(file);
         let current = json.current;
         if(json.versions.length == 0){
             json.versions.push(current);
         }
         let output = "\n";
         for(let i=0;i<json.versions.length;i++){
             let v  = json.versions[i];
             if(v == current){
                 output+= chalk.blue("*"+v)+"\n";
             }else{
                 output += v+"\n";
             }
         }
         console.log(output);
    });
}


function version(args,opt){
    return co.brief(function*(){
        let cwd = process.cwd();
        if (args.length == 0){
            yield current(cwd);
            return false;
        }

        let sub_command = args[0];

        if("create" == sub_command){
            
            yield create(cwd,args,opt);

        }else if("switch" == sub_command){

            if (!opt.v){
                log.info(lang.New().en("Parameter 'version' is required!").zh("缺少'版本号'参数"));
            }else{
                yield _switch(cwd,opt.v);
            }
            
        }else if("list" == sub_command){

            yield list(cwd,opt);

        }else{
            log.info(lang.New().en(`Command "version ${sub_command}" is not found`).zh(`无此命令 "version ${sub_command}"`))
             
        }

        return false;
    });
}

let type = lang.New().en("About Project Management").zh("项目管理相关");

let note = lang.New().en("List,create,or switch versions.").zh("罗列,创建,或者切换版本");

const cmd = new Command("version",version,type);

cmd.note(note);

let usage1 = lang.New().zh("创建新的版本，默认从最新的版本初始化数据").en("Create a new version,and copy data from latest version.");

cmd.usage("version create 'version'",usage1);

cmd.usage("version switch -v 'version'",lang.New().en("Switch to target version.").zh("切换到指定版本"));

cmd.usage("version list",lang.New().en("List all versions.").zh("列出所有的版本"));

cmd.usage("version",lang.New().en("Print the current version.").zh("打印出当前版本号"));

module.exports = cmd;
 