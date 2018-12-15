// created by yyrdl on 2018.12.5
/*** 
 * 并发锁，用来限制上传和下载的并发数，单线程安全
 * 
*/


function New(max_concurrent){
    return {
        "current_running" : 0,
        "unLock" : function () {
            this.current_running--;
            this._awake();
        },
        "lock" : function (co_next) {
            if(this._busy()){
                this._waitFree(co_next);
            }else {
                this.current_running++;
                co_next();
            }
        },
        "_busy" : function () {
            return this.current_running > max_concurrent - 1;
        },
        "_waitFree" : function (callback) {
            this._reply_pool.push(callback);
            this._awake();
        },
        "_reply_pool" : [],
        "_awake" : function () {
            if (this.current_running < max_concurrent) {
                let func = this._reply_pool.shift();
                if ("function" == typeof func) {
                    this.current_running +=1;
                    func();
                }
            }
        }
    }
}


exports.New = New;