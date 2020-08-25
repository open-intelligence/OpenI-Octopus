// created by yyrdl on 2018.12.5
const co = require("zco");
const Command = require("../command");
const chalk = require("chalk");
const lang = require("../lang");
const log  = require("../../utils/log");

const CONSTANT = {
    MIDDLEWARE:1,
    COMMAND:2
};

var blank=function(num,char){
    var str="";
    for(var i=0;i<num;i++){
        str+= char || " ";
    }
    return str;
}



function Flow (){
    this._flows = [];
    this._cmds = [];
    this._note_linked = "";
}

Flow.prototype.use = function(){
    let args  = [].slice.call(arguments);
    
    if ("string" == typeof args[0]){
    
        let it  = {
            type:CONSTANT.COMMAND,
            cwd: args.shift(),
            middleware:[],
            command:null
        };

        for(let i=0;i< args.length;i++){

            if("function" == typeof args[i]){

                it.middleware.push(args[i]);

            }else if (args[i] instanceof Command){

                it.command = args[i];

                this._cmds.push(args[i]);
                
                break;
            }
        }

        if (null == it.command){
            throw new Error("Command is required!");
        }

        this._flows.push(it);

    }else if("function" == typeof args[0]){
         this._flows.push({
             type:CONSTANT.MIDDLEWARE,
             middleware:args[0]
         });
    }
    
}

Flow.prototype._linkNote = function(){
    
    if(this._note_linked != ""){
        return this._note_linked;
    }

    let types = {};
    let max_len = 0;


    for(let i=0;i<this._cmds.length;i++){
        let type = this._cmds[i].type().toString();
        
        if(!types[type]){
            types[type] = [];
        }
        types[type].push(this._cmds[i]);
        let name = this._cmds[i].name().toString();
        name = chalk.blue(name);
        if(name.length > max_len){
            max_len = name.length;
        }
        
    }
   

    let notes_str = "\n "+lang.New().en("Command List:").zh("命令列表:");

    for(let type in types){
       
        let cmds = types[type];
        
        notes_str+="\n\n" +blank(2)+type+"\n\n";

        let notes = [];

        cmds = cmds.sort((a,b)=>{
            return a.name().length > b.name().length;
        })

        for(let i=0;i<cmds.length;i++){
            notes.push({
                cmd:cmds[i].name().toString(),
                note:cmds[i].note().toString()
            });
        }

        for(let i=0;i<notes.length;i++){
            let exp = chalk.blue(notes[i].cmd);
           
            notes_str += blank(2)+exp+blank(max_len-exp.length+4)+notes[i].note+"\n";
        }
    }

    this._note_linked = notes_str;

    return notes_str;
}


Flow.prototype._helpCommand = function(cmd_name = ""){
    let cmd = null;
    for(let i = 0;i<this._cmds.length;i++){
        if(this._cmds[i].match(cmd_name)){
            cmd = this._cmds[i];
            break;
        }
    }
    
    if (null == cmd){
         return lang.New().en(`Command "${cmd_name}" is not found!`)
        .zh(`没有找到"${cmd_name}"命令`);
    } 
    
    let usages = cmd.usage();
    let str = "\n";
    let max_len = 0;
        
    for(let i=0;i<usages.length;i++){

        let exp = chalk.blue(usages[i].exp);

        if(exp.length  > max_len){
            max_len = exp.length;
        }
    }
    for(let i=0;i<usages.length;i++){
        str+= blank(2)+chalk.blue(usages[i].exp)+blank(max_len - usages[i].exp.length+4)+usages[i].note+"\n"
    }
    return str;
    
}

Flow.prototype.run = function (cwd,args,opt){
    let self = this;

    return co.brief(function*(){

        
        if("help" == cwd ){
            if (args.length == 0){
                log.info(self._linkNote());
            }else{
                log.info(self._helpCommand(args[0]))
            }
           
            return false;
        }
        
        let next = true;

        for(let i=0;i<self._flows.length;i++){
            let it = self._flows[i];

            next = true;

            if(it.type == CONSTANT.COMMAND && it.command.match(cwd)){
                // run middleware
               
                for(let k=0;k<it.middleware.length;k++){
                    next = yield it.middleware[k](cwd,args,opt);
                    if (!next){
                        break;
                    }
                }

                if(next){
                    next = yield it.command.run(args,opt);  
                }

            }

            if(it.type == CONSTANT.MIDDLEWARE){
                 next = yield it.middleware(cwd,args,opt);
            }

            if(!next){
                break;
            }
        }

        return next;
    });

}


module.exports = Flow;