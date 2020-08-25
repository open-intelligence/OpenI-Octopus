const co = require("zco");
const request = require("request");
const consts = require("../../constants");
//const schedule = require('node-schedule');

function scheduleJob(){
    //schedule.scheduleJob('30 * * * * *', function(){
    //    try{
     //       console.log('scheduleJob:' + new Date());
    //        debugjob.syncJobList()
    //    }catch(e){

   //     }
    //}); 
}

function register(app){

    const feature = {
        name:"debugjob",
        author:"lijunmao",
        description:"stop debug job after 2 hours",
        enabled: true,
        jobSelector:{
            conditions:[
                {
                    name:"type",
                    key: "jobKind",
                    expect: "^debug$"
                }
            ],
            expression:"type"
    
        },
        plugins:[
            {
                key:"bindlifehook",
                pluginType:"LifeHook",
                callAddress:app.config.address.debugjob.lifehookAddr,
                description:"debugjob lifehook",
                jobSelector:{
                    conditions:[],
                    expression:"",
                    states:["*"]
                }
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


module.exports = {register, scheduleJob};