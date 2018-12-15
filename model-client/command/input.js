// created by yyrdl on 2018.12.5
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function parse(input){
    let args = input.split(" ").filter(it=>{ return it != ""})
    let cmd = args.shift();
    let last_key  = "";

    let cmd_args = [];
    let cmd_opt = {};
    
    for(let i=0;i<args.length;i++){
        let  key = args[i]
        if (0 == key.indexOf("-")){
           if ("" != last_key){
             cmd_opt[last_key] = true
           }
            
           last_key = key.split("-").join("");
        
        }else{
           if (last_key != ""){

              cmd_opt[last_key] = key;

              last_key = ""

           }else{
            cmd_args.push(key)
           }
        }
    }

    if ("" != last_key){
        cmd_opt[last_key] = true;
    }

    return {
        cmd:cmd,
        opt:cmd_opt,
        args:cmd_args
    }
}

function read(){
    let args = [].slice.call(arguments);

    let callback = null,question= null;

    question = args[0],callback = args[1];

    if(typeof args[0] == "function"){
        callback  = args[0];
        question = null
    }

    if (question){
        question +="";
    }
   

    rl.question(question || ">", (answer) => {
         callback && callback(answer.toString().trim());
    });
}


exports.parse = parse;


exports.read = read;