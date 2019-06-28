import {formatMessage } from 'umi/locale';

export function loadFromFile(file_path,callback){
    
    let Reader = null;

    let called = false;

    function reply(e,file){
        if(!called){
            called = true;
            callback && callback(e,file);
        }
    }

    try{
        Reader = FileReader;
    }catch(e){
        Reader = null;
    }

    if(null == Reader){
        return reply(new Error(formatMessage({id:"jobSubmit.warn.browser_not_support"})));
    }

    let reader = new Reader();

    reader.onload = function(event){
        reply(null,event.target.result);
    }

    reader.onerror = function(e){
        reply(e);
    }

    reader.readAsText(file_path,"utf-8");
}

export function exportAsJsonFile(job){

    let Bob = null;
    let URL_OBJECT = null;
    
    try{
        Bob = Blob;
        URL_OBJECT = URL;
    }catch(e){
        Bob = null;
        URL_OBJECT = null;
    }

    if(null == Bob || URL_OBJECT == null){
        throw new Error(formatMessage({id:"jobSubmit.warn.browser_not_support"}));
    }

    let json_str = JSON.stringify(job," ",2);
    let file = new Bob([json_str],{type:"application/json"});
    let file_name = (job.jobName||"job")+"_config.json";

    if(window.navigator.msSaveOrOpenBlob){
        window.navigator.msSaveOrOpenBlob(file,file_name);
    }else{

        let a = document.createElement("a");
        let url = URL_OBJECT.createObjectURL(file);
        a.href = url;
        a.download = file_name;
        document.body.append(a);
        a.click();

        setTimeout(function(){
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        },1000)
    }

}


export function choseFile(callback){

    let id = "import_file_input";

    let input = document.getElementById(id);

    if(!input){
       input = document.createElement("input");
       document.body.appendChild(input);
       input.style.display = "none";
       input.setAttribute("type","file");
       input.setAttribute("id",id);
    }
    
    input.onchange = function(e){
       callback && callback(e.target.files[0]);
       input.value  = ""; 
    }

    input.click();
}


