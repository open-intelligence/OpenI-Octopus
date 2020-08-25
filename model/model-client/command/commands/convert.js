const co = require("zco");
const request = require("request");
const fs = require("fs");
const path = require("path");
const Command = require("../../prototype/command");
const lang = require("../../prototype/lang");
const log = require("../../utils/log");
const yml = require("js-yaml");


function submit(params){
    return co.brief(function*(resume){
      let server = this.ctx.server;
      let token = this.ctx.token;
      let version  = this.ctx.profile.current;
      let project_name = this.ctx.profile.name;
      let user = this.ctx.user;

      let opt = {
          url:server.protocol+"//"+server.host+"/project/convert",
          method:"POST",
          headers:{
              token:token
          },
          body:{
              params:params,
              project:{
                  user:user,
                  project_version:version,
                  project_name:project_name
              }
          },
          json:true
      };

      let [err,_,body] = yield request(opt,resume);
      
      if(err){
          throw err;
      }

      if(true == body.success){
          log.info(lang.New().en("Convert successfully!Please use command 'pull' to fetch the result").zh("转换成功,请用'pull'命令拉取结果到本地"));
          
      }else{
          log.info(lang.New().en("Failed to convert,"+body.message).zh("转换失败,"+body.message));
      }

    });
}

function MXNet_To_IR(opt){
    return co.brief(function*(){
          let json_file = opt.json_file;
          let param_file = opt.param_file;
          
          if(!json_file){
               log.info(lang.New().en(`Lack of param 'json_file'`).zh(`缺少'json_file' 参数`));
               return false;
          }
          if(!param_file){
            log.info(lang.New().en(`Lack of param 'param_file'`).zh(`缺少'param_file' 参数`));
            return false;
          };

          let param = {
              source_framework:"MXNet",
              destination_framework:"IR",
              json_file_path:json_file,
              params_file_path:param_file,
              input_shape:opt.input_shape
          };

          return yield submit(param);
    });
}

function PyTorch_To_IR(opt){
    return co.brief(function*(){
        let model_file = opt.model_file;
      
        if(!model_file){
             log.info(lang.New().en(`Lack of param 'model_file'`).zh(`缺少'model_file' 参数`));
             return false;
        }
       
        let param = {
            source_framework:"PyTorch",
            destination_framework:"IR",
            model_file_path:model_file,
            input_shape:opt.input_shape
        };

        return yield submit(param);

    });
}

function Keras_To_IR(opt){
    return co.brief(function*( ){
        let model_file = opt.model_file;
        let json_file = opt.json_file;
        if(!model_file){
             log.info(lang.New().en(`Lack of param 'model_file'`).zh(`缺少'model_file' 参数`));
             return false;
        }
        if(!json_file){
            log.info(lang.New().en(`Lack of param 'json_file'`).zh(`缺少'json_file' 参数`));
            return false;
       }
        let param = {
            source_framework:"Keras",
            destination_framework:"IR",
            model_file_path:model_file,
            json_file_path:json_file,
            input_shape:opt.input_shape
        };

        return yield submit(param);
    });
}

function IR_To_PyTorch(opt){
    return co.brief(function*( ){
        let param_file = opt.param_file;
        let proto_file = opt.proto_file;
 
        if(!proto_file){
            log.info(lang.New().en(`Lack of param 'proto_file'`).zh(`缺少'proto_file' 参数`));
            return false;
       }
       if(!param_file){
            log.info(lang.New().en(`Lack of param 'param_file'`).zh(`缺少'param_file' 参数`));
            return false;
        }
        let param = {
            source_framework:"IR",
            destination_framework:"PyTorch",
            params_file_path:param_file,
            proto_file_path:proto_file,
            input_shape:opt.input_shape
        };

        return yield submit(param);
    });
}

function IR_To_MXNet(opt){
    return co.brief(function*( ){
        let param_file = opt.param_file;
        let proto_file = opt.proto_file;
 
        if(!proto_file){
            log.info(lang.New().en(`Lack of param 'proto_file'`).zh(`缺少'proto_file' 参数`));
            return false;
       }
       if(!param_file){
            log.info(lang.New().en(`Lack of param 'param_file'`).zh(`缺少'param_file' 参数`));
            return false;
        }
        let param = {
            source_framework:"IR",
            destination_framework:"MXNet",
            params_file_path:param_file,
            proto_file_path:proto_file,
            input_shape:opt.input_shape
        };
        return yield submit(param);
    });
}

function readConfig(yml_path){
    return co.brief(function*(resume){
         let cwd = process.cwd();
         let file_path = path.join(cwd,yml_path);
         if(!fs.existsSync(file_path)){
             log.info(lang.New().en(`File "${yml_path}" is not found at "${cwd}"`).zh(`在"${cwd}"没有找到"${yml_path}"`));
             return null;
         }
         let [err,file] = yield fs.readFile(file_path,resume);
         if(err){
             throw err;
         }
         return yml.load(file.toString());
    })
}

function convert(args,opt){
    return co.brief(function*(resume){

        //return log.info(lang.New().en("Convert successfully!Please use command 'pull' to fetch the result").zh("转换成功,请用'pull'命令拉取结果到本地"));
        
        let param_path = opt.p ;

        if(!param_path){
            log.info(lang.New().zh("请给转换数据的参数配置文件").en("Config file is required for this operation!"));
            return false;
        }

        let config = yield readConfig(param_path);

        if(!config.input_shape){
            log.info(lang.New().en(`Lack of param 'input_shape'`).zh(`缺少'input_shape' 参数`));
            return false;
        }

        if(!config.source_framework){
            log.info(lang.New().en(`Lack of param 'source_framework'`).zh(`缺少'source_framework' 参数`));
            return false;
        }

        if(!config.destination_framework){
            log.info(lang.New().en(`Lack of param 'destination_framework'`).zh(`缺少'destination_framework' 参数`));
            return false;
        }

        log.info("Convert '"+config.source_framework+"' to '"+config.destination_framework+"'......")

        let src = config.source_framework.toLowerCase();
        let dst = config.destination_framework.toLowerCase();
        
        if(src == "ir"){
            if ("pytorch" == dst){
                yield IR_To_PyTorch(config);
            }else if("mxnet" == dst){
                yield IR_To_MXNet(config);
            }
            return false;
        }else if("mxnet" == src){
            yield MXNet_To_IR(config);
            return false;
        }else if("pytorch" == src){
            yield PyTorch_To_IR(config);
            return false;
        }else if("keras" == src){
            yield Keras_To_IR(config);
            return false;
        } 

        log.info(lang.New().en(`Not support convert "${config.source_framework}" to "${config.destination_framework}"`)
        .zh(`不支持从"${config.source_framework}"转到"${config.destination_framework}"`))

    
        return false;
    });
}

const cmd = new Command("convert",convert,lang.New().zh("项目管理相关").en("About Project Management"));

cmd.note(lang.New().en("Convert source data to another framework. Available framework list: MXNet、Keras、PyTorch、IR").zh("将原数据转换到另一种格式，支持MXNet、Keras、PyTorch和IR四种格式间转换"));


cmd.usage("convert -p 'param.yml'",lang.New().en("Convert model data which are described in 'param.yml'").zh("按照'param.yml'描述的方式在远程转换模型数据"));

module.exports = cmd;

