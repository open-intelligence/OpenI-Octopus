// created by yyrdl on 2018.12.5
/*** 
 * 并发锁，用来限制上传和下载的并发数，单线程安全
 * 
*/

function Lock(max){
    this._running = 0;
    this._queue = [];
    this._max = max || 2
}

Lock.prototype.unLock = function(){
    this._running -=1; 
    this._awake();
}

Lock.prototype.lock = function(resume){
    if (this._running > this._max -1){
        this._queue.push(resume);
        this._awake();
    }else{
        this._invoke(resume)
    }
}

Lock.prototype._invoke = function(func){
    if ("function" == typeof func){
        this._running +=1;
        func()
    }
}

Lock.prototype._awake = function(){
    if (this._running < this._max){
        this._invoke(this._queue.shift());
    }
}
 

module.exports = Lock;