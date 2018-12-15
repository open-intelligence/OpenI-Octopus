// created by yyrdl on 2018.12.5
const fs = require("fs");

/**
 * @param {String } path
 * @param {int} start
 * @param {int} end
 */
function read(path,start,end){
    return fs.createReadStream(path,{
        start:start,
        end:end
    })
}

exports.read = read;