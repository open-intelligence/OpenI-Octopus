// created by yyrdl on 2018.12.5
const singleLine = require('single-line-log').stdout;



function error(msg){
        console.log(msg)
}

function debug(err){
    if (err && err.stack){
        console.log("[DEBUG] - "+err.stack);
    }else{
        console.log("[DEBUG] - "+err);
    }
}

function info(msg){
    console.log("\n"+msg+"");
}

function progress(ratio,description,bar_len = 80){
    var percent = (ratio).toFixed(4);
    var cell_num = Math.floor(percent * bar_len);       
   
    var cell = '';
    for (var i=0;i<cell_num;i++) {
         cell += '*';
    }
 
  
    var empty = '';
    for (var i=0;i<bar_len-cell_num;i++) {
         empty += '#';
    }
 
  
    var cmdText = description + ': ' + cell +empty + ' ' + (100*percent).toFixed(2)+"%";
   
    singleLine(cmdText);

}

exports.info = info;
exports.error = error;
exports.progress = progress;
exports.debug = debug;


 