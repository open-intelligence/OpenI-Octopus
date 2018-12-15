const env = require("../../lib/env");

function Lang(){
    this._en = "";
    this._zh = "";
}

Lang.prototype.en = function(txt){
    this._en =  txt;
    return this;
}
Lang.prototype.zh = function(txt){
    this._zh = txt;
    return this;
}

Lang.prototype.toString = function (){
    return env.GetEnv().lang == "zh" ? this._zh : this._en;
}

Lang.prototype.valueOf = function(){
    return env.GetEnv().lang == "zh" ? this._zh : this._en;
}

function New(){
    return new Lang()
}

exports.New = New;