const url = require("url");

function isValidateProjectAddress(remote){
   let obj = null;
   try{
      obj =  url.parse(remote);
   }catch(e){
       return false;
   }

   let temp = (""+obj.path).split(/[\//]/);
   let project = temp[temp.length - 1]+"";
   
   return obj.protocol && obj.host && temp.length == 3 && project.length > 3 && ".ms" == project.slice(project.length-3);
}

exports.isValidateProjectAddress = isValidateProjectAddress;