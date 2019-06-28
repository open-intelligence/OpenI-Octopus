
function config(log_service_uri){

    log_service_uri = log_service_uri.endsWith("/") ? log_service_uri : log_service_uri+"/";

    return {
        framework_log:(framework_name)=>{
            return `${log_service_uri}v1/page/framework/${framework_name}`;
        },
        container_log: (framework_name,container_id) =>{
            return `${log_service_uri}v1/page/container/${framework_name}/${container_id}`
        }
    }
}


exports.config = config;