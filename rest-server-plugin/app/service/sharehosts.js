/**
 * 通过共享/etc/hosts文件提供pod间发现机制，使用taskset/main/poddiscovery提供的功能
 * 
*/
const path = require('path')
const consts = require("../../libs/constants")

function uniqMountName(pod){
    const names = {};
    const volumes = pod.spec.volumes||[];
    for(let i=0;i<volumes.length;i++){
        names[volumes[i].name] = true;
    }
    let  sharehost = "netsharehost";
    let id = 0;
    while( id < 100000){
        if(true != names[sharehost]){
            return sharehost;
        }
        sharehost = "netsharehost"+id;
        id ++;
    }
    
    return "m-"+Date.now();
}

function bind(taskset, headers, config){

    if (!config.sharehosts.shareDirectory){
        throw new Error("Missing Config ‘SHARE_DIRECTORY’")
    }

    const jobID = headers.jobID;
    const username = taskset.metadata.labels[consts.K8S_USER_NAME_LABEL_KEY];

    const shareHostsPath = path.join(config.sharehosts.shareDirectory, `${username}`, "share_hosts");
    const shareHostsFrom = path.join(shareHostsPath,`${jobID}`);
    const shareHostsTempFrom = path.join(shareHostsPath,`${jobID}.json`);

    for(let i=0;i<taskset.spec.roles.length;i++){

        const nameOfHostFile = uniqMountName(taskset.spec.roles[i].template);
        
        if(0 == taskset.spec.roles[i].template.spec.containers.length){
            continue;
        }
        //声明需要挂载的文件
        if (! taskset.spec.roles[i].template.spec.volumes){
            taskset.spec.roles[i].template.spec.volumes = [];
        }

        taskset.spec.roles[i].template.spec.volumes.push({
            hostPath:{
                path:shareHostsFrom,
                type:"FileOrCreate"
               
            },
            name:nameOfHostFile
        });
        
        const nameOfTempFile = uniqMountName(taskset.spec.roles[i].template);

        taskset.spec.roles[i].template.spec.volumes.push({
            hostPath:{
                path: shareHostsTempFrom,
                type: "FileOrCreate"
               
            },
            name:nameOfTempFile
        });

        //挂载/etc/localtime
        const nameOfLocaltime = uniqMountName(taskset.spec.roles[i].template);

        taskset.spec.roles[i].template.spec.volumes.push({
            hostPath:{
                path:"/etc/localtime",
            },
            name:nameOfLocaltime
        });

        if(!taskset.spec.roles[i].template.spec.initContainers){
            taskset.spec.roles[i].template.spec.initContainers = [];
        }
        //添加PodDiscovery镜像，该镜像负责往共享的/etc/hosts文件写入各pod的ip地址
        const initcontainer = {
            image: config.sharehosts.image,
            name: "sharehostsoperator",
            volumeMounts: [
                {
                    mountPath: "/etc/hosts",
                    name: nameOfHostFile
                },
                {
                    mountPath: "/etc/hosts_json.json",
                    name: nameOfTempFile
                },
                {
                    mountPath: "/etc/localtime",
                    name: nameOfLocaltime
                }
            ]
        };

        
        if (config.sharehosts.command){
            initcontainer.command = [
                "sh",
                "-c",
               config.sharehosts.command
            ]
        }
        
        
        taskset.spec.roles[i].template.spec.initContainers.push(initcontainer);

        if (!taskset.spec.roles[i].template.spec.containers[0].volumeMounts){
            taskset.spec.roles[i].template.spec.containers[0].volumeMounts = [];
        }
        //挂载共享的/etc/hosts文件到工作容器
        taskset.spec.roles[i].template.spec.containers[0].volumeMounts.push({
            mountPath:"/etc/hosts",
            name:nameOfHostFile,
            readOnly:true
        });
    }

    return taskset;
}

exports.bind = bind;