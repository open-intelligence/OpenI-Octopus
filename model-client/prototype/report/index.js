// created by yyrdl on 2018.12.5
const log = require("../../utils/log");

function Reporter(total,label){
    this.totalSize = total;
    this.completedSize = 0;
    this.label = label;
}


Reporter.prototype.Incre = function(size){
    this.completedSize += size;
    log.progress( this.completedSize /  this.totalSize, this.label);
}

Reporter.prototype.Sub = function(size){
    this.completedSize -= size;
    log.progress( this.completedSize /  this.totalSize, this.label);
}

module.exports = Reporter;