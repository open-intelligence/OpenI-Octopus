 // created by yyrdl on 2018.12.5

 const co = require("zco");
 const fs = require("fs");

function isNumberString(str){
    let al = "0123456789";
    let t = true;
    for(let i = 0;i<str.length;i++){
        if(al.indexOf(str[i]) == -1){
            t = false;
            break;
        }
    }
    return t;
}


function genTempFileName(fileName,block_seq,block_num){
    return fileName+"T_"+block_seq+"_"+block_num+"_N.temp"
}

function isValidTempFile(name){
    if (!name){
        return false;
    }

    let T_p = name.lastIndexOf("T");
    let info = name.slice(T_p).split("_");

    if(info.length != 4){
        return false;
    }

    if(!isNumberString(info[1]) || !isNumberString(info[2])){
        return false;
    }

    if (info[3] == "N.temp" || info[3]=="Y.temp"){
        return true;
    }

    return false;

}

function parseTempFileName(name){
    let file = {
        temp_name:name,
        name:"",
        seq:"",
        total:'',
        merged:false
    };

    if(!isValidTempFile(name)){
        return null;
    }

    let T_p = name.lastIndexOf("T");

    let info = name.slice(T_p).split("_");

    file.name = name.slice(0,T_p);

    file.seq = parseInt(info[1]);
    file.total = parseInt(info[2]);
    file.merged = info[3] == "Y.temp";

    return file;
}


function getTempFileList(dir,fileName){
    return co.brief(function*(resume){

        let [err,list] = yield fs.readdir(dir,resume);

        if(err){
            throw err;
        }

        let result = [];

        for(let i=0;i<list.length;i++){

            if(!isValidTempFile(list[i])){
                continue;
            }

            let info = parseTempFileName(list[i]);

            if (info.name == fileName){
                result.push(info);
            }
        }
        
        return result.sort(function(a,b){
            if (a.seq == b.seq ){
                return 0;
            }

            return a.seq > b.seq  ? 1 : -1;
        });
    });
}

exports.genTempFileName = genTempFileName;
exports.isValidTempFile  = isValidTempFile;
exports.parseTempFileName = parseTempFileName;
exports.getTempFileList = getTempFileList;

