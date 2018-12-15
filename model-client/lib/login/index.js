//created by yyrdl on 2018.12.7
const co = require("zco");
const request = require("request");

function login (user,pwd){
    return co.brief(function*(resume){
         let server = this.ctx.server;

         let opt= {
             url:server.protocol+"//"+server.host+"/login",
             method:"POST",
             body:{
                 user:user,
                 pwd:pwd
             },
             json:true,
             followRedirect:true
         };

         let [err,_,body] = yield request(opt,resume);

         if(err){
             throw err;
         }
         return body;

    });
}



function signed(token){
    return co.brief(function*(resume){
        let server = this.ctx.server;

        let opt= {
            url:server.protocol+"//"+server.host+"/login/check",
            method:"POST",
            body:{
                token:token
            },
            json:true,
            followRedirect:true
        };

        let [err,_,body] = yield request(opt,resume);

        if(err){
            throw err;
        }
        return body.success;
    });
}

exports.login = login;
exports.signed = signed;