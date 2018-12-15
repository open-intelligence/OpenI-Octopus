// created by yyrdl on 2018.12.5
const co = require("zco");
const lang = require("../../prototype/lang");
const log = require('../../utils/log');

function notFound(cwd){
    return co.brief(function*(){

        let tip = lang.New().en(`Command "${cwd}" is not found! Type "help" for help!`)
        .zh(`没有找到"${cwd}"命令,输入"help"查看帮助`);

        log.info(tip);

        return false;

    });
}

module.exports = notFound;