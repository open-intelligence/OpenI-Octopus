const co = require("zco");
const request = require("request");
const consts = require("../../constants");

function register(app){

    const feature = {
        name:"tasksetTrasnlator",
        author:"lijunmao",
        description:"traslate the job to taskset",
        enabled: true,
        jobSelector:{
            conditions:[
            ],
            expression:"*"
        },
        plugins:[
            {
                key:"translator",
                pluginType:"TemplateTranslator",
                callAddress: app.config.address.taskset.translatorAddr,
                description:"taskseTranslator",
            }
        ]
    }

    co.brief(function*(resume){
         let opt = {
             url:app.config.pipeline.address+"/v1/features/",
             method:"post",
             headers:{
                 token:app.config.pipeline.token
             },
             body:feature,
             json:true
         };

         let [err,res,body] = yield request(opt,resume);

         if(err){
             throw err;
         }

         if (body.code != consts.OPERATION_SUCCEEDED){
             throw new Error(body.code +":"+body.msg)
         }
    })(err=>{
        if(err){
            console.log(err);
            process.exit(1);
        }
    })
}


exports.register = register;