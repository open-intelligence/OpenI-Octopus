
function config(imageFactoryUri){
    return {
        imageSizePath: (containerHostIp,container) => {
            return `${imageFactoryUri}/v1/commit/size?ip=${containerHostIp}&&container=${container}`;
        },
        imageStatusPath: (container) => {
            return `${imageFactoryUri}/v1/commit/query?transaction_id=${container}`;
        },
        imageCommitPath: ()=>{
            return `${imageFactoryUri}/v1/commit/async`;
        }
    }
}


exports.config = config;
