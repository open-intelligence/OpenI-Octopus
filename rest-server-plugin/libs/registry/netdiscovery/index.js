const co = require("zco");
const request = require("request");
const consts = require("../../constants");

function register(app){
    
    const feature = {
        name:"netdiscovery",
        author:"lijunmao",
        description:"Network Plugin for Pipeline",
        enabled: true,
        jobSelector:{
            conditions:[
            ],
            expression:"*"
        },
        plugins:[
            {
                key:"decorator",
                pluginType:"TemplateDecorator",
                callAddress: app.config.address.netdiscovery.decoratorAddr,
                description:"hello world decorator",
            },
            {
                key:"lifehook-netdiscovery",
                pluginType:"LifeHook",
                callAddress: app.config.address.netdiscovery.lifehookAddr,
                description:"netdiscovery lifehook",
                jobSelector:{
                    conditions:[],
                    expression:"",
                    states:["failed","succeeded","stopped"]
                }
            }
        ]
    }
    
    co.brief(function*(resume){
         let opt = {
             url:app.config.pipeline.address+ "/v1/features/",
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