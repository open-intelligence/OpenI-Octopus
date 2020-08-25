// created by yyrdl on 2018.12.5
const co = require("zco");
const path = require("path");
const fs = require("fs");
const request = require("request");
const Command = require("../../prototype/command");
const download = require("../../lib/download");
const url = require("url");
const fileUtil = require("../../utils/file");
const lang = require("../../prototype/lang");
const log = require("../../utils/log");
const validate = require("../../utils/validate");
const userLib = require("../../lib/user");

function isExist(dir,project_name){
    let project_path = path.join(dir,project_name);
    let ms_info_path = path.join(dir,project_name,".ms");
    let project_json_path = path.join(dir,project_name,"project.json");
    return fs.existsSync(project_path) && fs.existsSync(ms_info_path) && fs.existsSync(project_json_path);  
}

function GetVersions(user,project,server){
    return co.brief(function*(resume){
        let opt = {
            url:server.protocol+"//"+server.host+"/project/versions?user="+encodeURIComponent(user)+"&project_name="+encodeURIComponent(project)+"&d="+Date.now(),
            method:"GET",
            headers:{
                token:this.ctx.token ||""
            },
            followRedirect:true
        };

        let [err,res,body] = yield request(opt,resume);
        if(err){
            throw err;
        }

        if( body instanceof Buffer){
            body = body.toString();
        }
        if(!("object" == typeof body)){
            body = JSON.parse(body);
        }
        let response = {
            success:true,
            internal_error:false,
            access_denied:false,
            versions:{}
        };

        if( body.success == true){
            response.success = true;
            response.versions = body.versions;
        }else{
            response.success = false;
            response.message = body.message
            if (res.statusCode == 403){
                response.access_denied = true;
            }else{
                response.internal_error = true;
            }
        }
        
        return  response;
    });
}

// 下载某一个 项目
function clone(args,opt){
    return co(function*(resume,defer){
        let version = opt.v;
        let pwd = opt.p;
       
        let cwd = process.cwd();

        let project_address = args[0];
        
        if(!validate.isValidateProjectAddress(project_address)){
            log.info(lang.New()
            .zh("项目地址格式不正确")
            .en("Wrong form of repository address!"));

            log.info(lang.New()
            .zh("正确的格式是'http(s)://host/username/project_name.ms'")
            .en("Example form : 'http(s)://host/username/project_name.ms'"));

            return false;
        }

        let server = url.parse(project_address);

        let infos = server.path.split(/[\\/]/);
        
        //http(s)://host/username/project_name.ms

        let project_name = infos[infos.length - 1].split(".");
        project_name.pop();
        project_name = project_name.join(".");

        let user = infos[infos.length-2];

        this.ctx.server = server;
        this.ctx.user = user;

        this.ctx.profile = {
            name:project_name,
            current:"",
            remote:project_address,
            versions:[]
        };

        if(isExist(cwd,project_name)){
            log.info(lang.New()
            .zh(`项目"${project_name}"在本地已经存在`)
            .en(`Project "${project_name}" has already existed at local!`));

            return false;
        }

        let [err1,user_info]  = yield userLib.getInfo(server.hostname,user);

        if(err1){
            throw err1;
        }

        if(user_info.token){
            this.ctx.token = user_info.token;
        }

        let [err,response] = yield GetVersions(user,project_name,server)

        if(err){
            throw err;
        }

        if(!response.success){

            if(response.internal_error == true){
                log.info(response.message);
            }else{
                log.info(lang.New().en(`Access denied,Please login again.`).zh("鉴权失败，请登录远程仓库"));
            }

            return false;

        }

        if(response.versions.length == 0){
            log.info(lang.New()
            .en(`Project "${project_name}" is not found at remote!`)
            .zh(`项目"${project_name}"不存在`))
           
            return false;
        }
        
        let versions = response.versions.sort(function(a,b){
            return a.create_date < b.create_date;
        });

        if(version){
            let found = false;
            for(let i=0;i<versions.length;i++){
                if(versions[i].project_version == version){
                    found = true;
                    break;
                }
            }
            if(!found){
                 log.info(lang.New()
                 .en(`The version "${version}" of "${project_name}" is not found`)
                 .zh(`未找到${version}版的${project_name}`));

                 
                 return false;
            }
        }

        let allVersions = versions.map(it=>{
            return it.project_version;
        });

        
        [err] = yield fileUtil.dirMustExist(path.join(cwd,project_name,".ms"));
        if(err){
            throw  err;
        }


        for(let i=0;i<versions.length;i++){
            let project_json = {
                name:project_name,
                user:user,
                pwd:pwd,
                remote:project_address,
                current:versions[i].project_version,
                versions:allVersions
            };

            if(project_json.current == version){
                [err] = yield fs.writeFile(path.join(cwd,project_name,"project.json"),JSON.stringify(project_json),resume);
                if(err){
                    throw err;
                }
            }else{
                let dir  = path.join(cwd,project_name,".ms","v"+project_json.current);
                [err] = yield fileUtil.dirMustExist(dir);
                if(err){
                     throw err;
                }
                project_json.synced = false;
                [err] = yield fs.writeFile(path.join(dir,"project.json"),JSON.stringify(project_json),resume);
                if(err){
                   throw err;
                }
            }

        }

        defer(function*(){
            let c_cwd = process.cwd();
            if(cwd != c_cwd){
                process.chdir(cwd);
            }
        });

        process.chdir(path.join(cwd,project_name));

        yield setTimeout(resume,300);

        this.ctx.profile.current = version || allVersions[allVersions.length - 1];

        [err] = yield download.download();

        if(err){
            throw err
        }

        return false;
    });
}

let type = lang.New().zh("项目管理相关").en("About Project Management");
let note = lang.New().zh("从指定地址克隆一个项目到当前目录").en("Clone a repository into a new directory.");
let usage1 = lang.New().zh("从指定地址克隆项目，版本号是可选参数，默认克隆最新的版本").en("Clone the repository,'version' is optional,'latest' is the default.");

const cmd = new Command("clone",clone,type);

cmd.note(note);

cmd.usage("clone 'project_address' -v 'version'",usage1)
 
module.exports = cmd;
