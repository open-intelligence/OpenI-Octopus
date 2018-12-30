// created by yyrdl on 2018.12.24

const info = require("./local_info");
const login = require("./login");


exports.setInfo = info.setInfo;

exports.getInfo  = info.getInfo;

exports.login = login.login;

exports.checkLogin = login.check;