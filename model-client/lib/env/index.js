//created by yyrdl on 2018.12.9
const os = require("os");
const co = require("zco");
const fs  = require("fs");
const path = require("path");

const Lock = require("../../prototype/concurrent");

const tmpdir = os.tmpdir();
const app_path = path.join(tmpdir,"ms_client");

const c_lock =  new Lock(1);

let defaultEnv = {
    "lang":"en"
};

if (!fs.existsSync(app_path)){
    fs.mkdirSync(app_path);
}

const env_path = path.join(app_path,"env.json");

// reload env from local file

function Reload(){
    return co.brief(function*(resume,defer){
        defer(function*(){
            c_lock.unLock();
        })

        yield c_lock.lock(resume);

        if(!fs.existsSync(env_path)){
            
            return defaultEnv;
        }

        let [err,file] = yield fs.readFile(env_path,resume);

        if(err){
            throw err;
        } 

         defaultEnv  = JSON.parse(file);

         return defaultEnv;
    }); 
}

function GetEnv(){
    return defaultEnv;
}


function SetEnv(key,value){
    return co.brief(function*(resume,defer){
        defer(function*(){
            c_lock.unLock();
        })

        yield c_lock.lock(resume);

        defaultEnv = defaultEnv || {};

        defaultEnv[key] = value;
        
 
        let [err] = yield fs.writeFile(env_path,JSON.stringify(defaultEnv),resume);
        
        if(err){
             throw err;
        }
    }); 
}

 

exports.GetEnv = GetEnv;
exports.SetEnv = SetEnv;
exports.Reload = Reload;