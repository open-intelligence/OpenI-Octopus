const DebugJobContent =
    "<p>Debug-type jobs are used to debug your programs.</p>"+
    "<p>Debugging programs using Jupyterlab code editor.</p>"+
    "<p>The debug code save path defaults to /userhome for Linux systems.</p>"+
    "<p>The debug-type job automatically stop and release debugging resources after running for 2 hours.</p>";


export default {
    "jobConfig.error.load_failed_gpu":"Failed to load GPU list.",
    "jobConfig.error.load_failed_image":"Failed to load image list.",
    "jobConfig.error.load_failed_job":"Failed to load job information",

    "jobConfig.job.title":"Create New Job",
    "jobConfig.subTaskList.title":"Sub Task List",

    "jobConfig.button.import_file":"Import",
    "jobConfig.error.import_json_file":"Failed to read file from your PC.",
    "jobConfig.error.wrong_json_form":"Illegal JSON format.",
    "jobConfig.button.export_file":"Export",
    "jobConfig.button.submit":"Submit",
    "jobConfig.button.create_subtask":"Add",

    "jobConfig.dec.title":"What is this?",
    "jobConfig.job_name.label":"Job Name",
    "jobConfig.job_name.dec":"<p>Job name is the unique id of the job.</p>"+
                            "<p><h4>How to set?</h4></p>"+
                            "<p>A string with lower-letters or numbers. And the max length is 30.</p>"+
                            "<p>In order to be identifiable, 6 random numbers are added automatically.</p>",

    "jobConfig.job_des.label":"Comment",
    "jobConfig.job_des.dec":"<p>The description for the job.</p>"+
                            "<p><h4>How to set?</h4></p>"+
                            "<p>Whatever you like...</p>",

    "jobConfig.gpu_type.label":"Type",
    "jobConfig.gpu_type.errMsg":"Please select a kind of job type",
    "jobConfig.gpu_type.dec":"<p>The type of job. For some specific type ,the available docker images is limited.</p>"+
                                DebugJobContent+
                            "<p><h4>How to set?</h4></p>"+
                            "<p>Chose one that is suitable for your job.</p>",

    "jobConfig.images.label":"Image",
    "jobConfig.images.errMsg":"Please input or select a docker image",
    "jobConfig.images.dec":"<p>The docker image. Every job in the platform is running in a docker container.</p>"+
                            "<p>Docker container is a computer process which is created by your image. A docker image is a set of os environment and other neccessary softwares.</p>"+
                            "<p>Images are stored in a image warehouse .The official image warehouse (https://hub.docker.com/) is supported</p>"+
                            "<p><h4>How to set?</h4></p>"+
                            "<p>1. You can chose an image provided by the platform.</p>"+
                            "<p>2. Or input your own image address. When there is no ip for warehouse ,the platform will try to find it in docker official image warehouse.</p>",

    "jobConfig.retry.label":"Retry Times",
    "jobConfig.retry.dec":"<p>Max retry-time for the job when it failed</p>"+
                        "<p><h4>How to set?</h4></p>"+
                        "<p>0<=Retry Times<=10. The default value is 0.</p>",


    "jobConfig.task_name.label":"Sub Task Name",
    "jobConfig.task_name.dec":"<p>The name of sub task</p>"+
                            "<p><h4>How to set?</h4></p>"+
                            "<p>A string with lower-letters or numbers. And the max length is 30.</p>",

    "jobConfig.replicas_number.label":"Replicas",
    "jobConfig.replicas_number.dec": "<p>The amount of sub task replicas.</p>"+
                                "<p>Sub tasks can be identified by an environment variable --- 'PAI_TASK_INDEX', it just like a pid number for a process.</p>"+
                                "<p><h4>How to set?</h4></p>"+
                                "<p>1<=Replicas. The default value is 1.</p>",

    "jobConfig.cpu_num.label":"CPU",
    "jobConfig.cpu_num.dec": "<p>The amount of CPU core that will be used.</p>"+
                            "<p>Every server has 24 CPU ,do not use too many cpu that beyond your need,usually, one gpu with two cpu core.</p>"+
                            "<p><h4>How to set?</h4></p>"+
                            "<p>1<=CPU</p>",

    "jobConfig.gpu_num.label":"GPU",
    "jobConfig.gpu_num.dec": "<p>The amount of gpu  that will be used.</p>"+
                            "<p>Every server has 8 GPU ,do not use too many that beyond your need,if GPU is not necessary ,please input 0.</p>"+
                            "<p><h4>How to set?</h4></p>"+
                            "<p>0<=GPU</p>",


    "jobConfig.memery.label":"Memory(MB)",
    "jobConfig.memery.dec": "<p>The memory that that will be used.</p>"+
                            "<p>The total memory of 'GTX1080ti' or 'TitanXp' server is 192GB, and for 'TeslaV100' it is 384GB.Do not use too much that beyond your need,usually we allocate 22GB or 44GB for one GPU.</p>"+
                            "<p><h4>How to set?</h4></p>"+
                            "<p>100<=Memory(MB). The default value is 100.</p>",

    "jobConfig.share_memery.label":"Share Memory(MB)",
    "jobConfig.share_memery.dec": "<p>The share-memory that will be used by the job .</p>"+
                                "<p>Share-memory is a block of memory which will be accessed by multiple process at the same time. Some computational framework maybe have some special requirements for share-memory.</p>"+
                                "<p><h4>How to set?</h4></p>"+
                                "<p>You can set a value which is suitable for your job,but should be smaller than the memory.</p>"+
                                "<p>64<=Share Memory(MB); The default value is 64MB.</p>",

    "jobConfig.min_succeeded_num.label":"MinSucceededReplicas",
    "jobConfig.min_succeeded_num.dec": "<p>If there are 'x' sub task Replicas that is succeeded, we terminate the sub task,no matter if there are other Replicas of the sub task still running.</p>"+
                                    "<p><h4>How to set?</h4></p>"+
                                    "<p>1<=MinSucceededReplicas<=Replicas. The default value is 1.</p>",

    "jobConfig.min_failed_num.label":"MinFailedReplicas",
    "jobConfig.min_failed_num.dec": "<p>If there are 'x' sub task Replicas that is failed, we terminate the sub task,no matter if there are other Replicas of the sub task still running.</p>"+
                                    "<p><h4>How to set?</h4></p>"+
                                    "<p>1<=MinFailedReplicas<=Replicas. The default value is 1.</p>",

    "jobConfig.command.label":"Command",
    "jobConfig.command.dec": "<p>The command which is used to start the job.</p>"+
                            "<p><h4>How to set?</h4></p>"+
                            "<p>A string with space or visible characters. Executable command for sub task, can not be empty. </p>"+
                            "<p>Example：</p>"+
                            "<p>python train.py</p>"+
                            "<p>/bin/bash start.sh</p>"+
                            "<p>cd /userhome && python start.py --output=/userhome/xx</p>",


    "jobConfig.subtask_importerr.title":"Import error occured: please check",

    "jobConfig.required.errMsg":"required",
    "jobConfig.subtask.number.err":'need to be a integer',
    "jobConfig.subtask.string.err":'need to be a string',

    "jobConfig.job_name.pattern.errMsg":'A string with lower-letters or numbers.',
    "jobConfig.job_name.length.errMsg":"The max length is 30",

    "jobConfig.image.pattern.errMsg":'Image name only a string of visible characters',

    "jobConfig.subtaskList.empty.errMsg":"Sub task list cannot be empty",
    "jobConfig.subtask_name.replicas.errMsg":"Tasks with the same name in the subtask list",

    "jobConfig.subtask_name.pattern.errMsg":'A sub task name string with lower-letters or numbers.',
    "jobConfig.subtask_name.length.errMsg":"The max length is 30",

    "jobConfig.subtask_command.pattern.errMsg":"Cannot contain non-visible characters other than space",

    "jobConfig.title.editSubTask":"Edit Sub Task",
    "jobConfig.task.button.confirm":"Confirm",
    "jobConfig.task.button.cancel":"Cancel",
    "jobConfig.task.header.operations":"Actions",
    "jobConfig.button.delete":"Delete",
    "jobConfig.button.delete.confirm":"Sure to delete?",
    "jobConfig.button.edit":"Modify",
    "jobConfig.button.copy":"Copy",

    "jobConfig.error.load_limit_failed":"Failed to load job submit information",
    "jobConfig.limit.cpu":"CPU limit exceeded . The max is ",
    "jobConfig.limit.gpu":"GPU limit exceeded. The max is ",
    "jobConfig.limit.memery":"Memery limit exceeded. The max is ",
    "jobConfig.limit.shmMB":"Share Memery limit exceeded. The max is ",
    "jobConfig.limit.jobNumber":"Running jobs number limit exceeded. The max is ",

    "jobConfig.limit.jobGPUNumber":"Running GPU jobs number limit exceeded. The max is ",
    "jobConfig.limit.jobCPUNumber":"Running CPU jobs number limit exceeded. The max is ",

    "jobConfig.success.submit_job":"Submit job successfully!",
    "jobConfig.error.submit_failed":"Failed to submit job",

    "jobConfig.debug.onesubtask.confirm.title":'Subtask List for Debug job allows only one subtask',
    "jobConfig.debug.submit.title":"Submit Debug Job Tips",
    "jobConfig.debug.submit.tips": DebugJobContent,
};

