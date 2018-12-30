//created by yyrdl
const lang = require("../prototype/lang");
const log = require("../utils/log");


const blank_num = 10;

function blank(){
    let str = "";
    for(let i=0;i<blank_num;i++){
        str+=" ";
    }
    return str;
}

const logo =

blank()+ "  ______  ______ ________ __    __ ______ \n"+
blank()+ " /      \/      /        /  |  /  /      |\n"+
blank()+ "/$$$$$$  $$$$$$/$$$$$$$$/$$ |  $$ $$$$$$/ \n"+
blank()+ "$$ |  $$ | $$ |     /$$/ $$ |__$$ | $$ |  \n"+
blank()+ "$$ |  $$ | $$ |    /$$/  $$    $$ | $$ |  \n"+
blank()+ "$$ |_ $$ | $$ |   /$$/   $$$$$$$$ | $$ |  \n"+
blank()+ "$$ / \$$ |_$$ |_ /$$/____$$ |  $$ |_$$ |_ \n"+
blank()+ "$$ $$ $$</ $$   /$$      $$ |  $$ / $$   |\n"+
blank()+ " $$$$$$  $$$$$$/$$$$$$$$/$$/   $$/$$$$$$/ \n"+
blank()+ "     $$$/                                 \n"+
blank()+ "                                          \n";



function run(){
    log.info(logo)


    log.info(lang.New().en("Client For QiZhi Module System,Copyright 2018 PCL All Rights Reserved")
    .zh("启智模块系统客户端   鹏城实验室保留所有权利"));

    log.info(lang.New().en("Type 'help' for tips").zh("输入'help'获取帮助"));
}


exports.run = run ;