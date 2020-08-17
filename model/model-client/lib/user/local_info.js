//created by yyrdl on 2018.12.7
const os = require("os");
const co = require("zco");
const fs  = require("fs");
const path = require("path");
const Lock = require("../../prototype/concurrent");
const tmpdir = os.tmpdir();
const app_path = path.join(tmpdir,"ms_client");

const c_lock =  new Lock(1);



if (!fs.existsSync(app_path)){
    fs.mkdirSync(app_path);
}

const config_path = path.join(app_path,"config.json");

function getInfo(domain,user){
    return co.brief(function*(resume,defer){
           defer(function*(){
               c_lock.unLock();
           })
           yield c_lock.lock(resume);
 
           if(!fs.existsSync(config_path)){
               return [];
           }
           let [err,file] = yield fs.readFile(config_path,resume);
           if(err){
               throw err;
           } 

           let config = JSON.parse(file);

           if(!Array.isArray(config.infos)){
               config.infos = [];
           }

           let info = {};

           for(let i=0;i<config.infos.length;i++){
               let c = config.infos[i];
               if(c.domain == domain && c.user == user){
                   info = c;
                   break;
               }
           }
           
           return info;
    });
}

function setInfo(domain,token,user){
    return co.brief(function*(resume,defer){
        defer(function*(){
            c_lock.unLock();
        })
        yield c_lock.lock(resume);
        let config = {
            infos:[]
        };
        if(fs.existsSync(config_path)){
            let [err,file] = yield fs.readFile(config_path,resume);
            if(err){
                throw err;
            }
            config = JSON.parse(file);
        }  

        if(! Array.isArray(config.infos)){
            config.infos = [];
        }

        config.infos = config.infos.filter(it=>{
            return it.domain != domain;
        })
       
        config.infos.push({
            domain:domain,
            token:token,
            user:user
        }); 

        let [err2] = yield fs.writeFile(config_path,JSON.stringify(config),resume);

        if(err2){
            throw err2;
        }
    });
}

exports.getInfo = getInfo;
exports.setInfo = setInfo;