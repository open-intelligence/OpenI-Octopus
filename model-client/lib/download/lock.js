//created by yyrdl on 2018.12.5


// about download lock file

const co = require("zco");
const fs = require("fs");
const path = require("path");

function read(dir){
    return co.brief(function *(resume){
        let file_path = path.join(dir,"download.lock");
        if (fs.existsSync(file_path)){
            let [err,file] = yield fs.readFile(file_path,resume);
            if(err){
                throw err;
            }
            return file.toString();
        }
        return null;
    });
}


function write(dir,lock_key){
    return co.brief(function *(resume){
        let [err] = yield fs.writeFile(path.join(dir,"download.lock"),lock_key,resume);
        if(err){
            throw err;
        }
    });
}


function remove(dir){
    return co.brief(function*(resume){
        let [err] = yield fs.unlink(path.join(dir,"download.lock"),resume);
        if(err){
            throw err;
        }
    });
}


exports.read = read;
exports.write = write;
exports.remove = remove;