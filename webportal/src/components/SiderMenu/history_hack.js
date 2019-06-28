
(function(){
    let methods = ['go','back','pushState','forward','replaceState'];
    let callbacks = {};

    
    if(history && 'function' != typeof history.listen){
        function onHistoryChange (){
           for(let id in callbacks){
              callbacks[id](); 
           }
        }

        for(let key in history){
             if("function" == typeof history[key] && methods.includes(key)){
                 let func = history[key];
                 history[key] = function(){
                     let args = [].slice.call(arguments);
                     func.apply(history,args);
                     onHistoryChange();
                 }
             }
        }

        if(window.addEventListener){
            window.addEventListener("popstate",function(){
                onHistoryChange()
            });
        }

        history.listen = function(id,func){
            callbacks[id] = func;
        };
        history.removeListener = function(id){
            delete callbacks[id];
        }
    }
   
})()