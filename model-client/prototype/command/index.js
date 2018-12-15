
// created by yyrdl on 2018.12.5

function Command(cmd,func,type){
    this._name = cmd; 
    this._func = func;
    this._usages = [];
    this._note = "";
    this._op_type = type;//操作类型
}


Command.prototype.usage= function(exmp,note){
    if (exmp && note){
        this._usages.push({
            exp:exmp,
            note:note
        });
    }else{
        return this._usages;
    }

}

Command.prototype.note = function (note){
   if(note){
       this._note = note;
   }else{
       return this._note;
   }
}

Command.prototype.name = function(){
    return this._name;
}

Command.prototype.type = function(){
    return this._op_type;
}


Command.prototype.match = function(cmd){
    return cmd.toLowerCase() == this._name.toLowerCase();
}

Command.prototype.run = function(){
   let args = [].slice.call(arguments);
   return this._func(...args);
}


module.exports = Command;