const DebugJobContent =
    "<p>Debug类型的任务用于调试程序，使用Jupyterlab代码编辑器调试程序</p>"+
    "<p>调试代码保存路径默认为Linux系统的/userhome</p>" +
    "<p>调试程序运行2个小时后会自动停止并释放调试资源</p>";

export default {

    "jobConfig.error.load_failed_gpu":"加载GPU列表失败",
    "jobConfig.error.load_failed_image":"加载镜像列表失败",
    "jobConfig.error.load_failed_job":"加载任务信息失败",

    "jobConfig.job.title":"创建新任务",
    "jobConfig.subTaskList.title":"子任务列表",

    "jobConfig.button.import_file":"导入",
    "jobConfig.error.import_json_file":"读取文件失败",
    "jobConfig.error.wrong_json_form":"任务配置文件不是合法的JSON格式",
    "jobConfig.button.export_file":"导出",
    "jobConfig.button.submit":"提交",
    "jobConfig.button.create_subtask":"添加",

    "jobConfig.dec.title":"这是什么?",
    "jobConfig.job_name.label":"任务名",
    "jobConfig.job_name.dec":"<p>任务名称是本次任务的唯一标识，由用户进行设置</p>"+
                             "<p><h4>该怎么填?</h4></p>"+
                             "<p>任务名只能是小写字母和数字的字符串，长度最大30个字符</p>"+
                             "<p>为了有标识性，页面会自动加上6个随机数字后缀</p>",


    "jobConfig.job_des.label":"备注",
    "jobConfig.job_des.dec":"<p>用于描述该任务</p>"+
                            "<p><h4>该怎么填?</h4></p>"+
                            "<p>随便填</p>",

    "jobConfig.gpu_type.label":"类型",
    "jobConfig.gpu_type.errMsg":"请选择一种任务类型",
    "jobConfig.gpu_type.dec":"<p>任务类型，某些Docker镜像只能使用特定的任务类型</p>"+
                            DebugJobContent+
                            "<p><h4>该怎么填?</h4></p>"+
                            "<p>根据您的任务需求选择</p>",

    "jobConfig.images.label":"镜像",
    "jobConfig.images.errMsg":"请输入或者选择一个Docker镜像",
    "jobConfig.images.dec":"<p>镜像是Docker中的概念，每个在平台中提交的任务都由一个或多个容器来执行，容器是由镜像创建的运行实例。</p>"+
                            "<p>可以认为镜像打包了一个linux环境，包含了程序运行所需要的各项依赖。镜像存放于仓库中，在平台上支持两个仓库：docker官方仓库和平台私有仓库，推荐优先使用平台私有仓库。</p>"+
                            "<p><h4>该怎么填?</h4></p>"+
                            "<p>1. 点击下拉框，从中进行选择，镜像更详细的介绍参考【镜像列表】</p>"+
                            "<p>2. 手动填写，当不包含仓库ip地址时，即表明指向的是Docker官方仓库(https://hub.docker.com/)</p>"+
                            "<p>以上两种方式都可行，第2种启动较慢。</p>",

    "jobConfig.retry.label":"重试次数",
    "jobConfig.retry.dec":"<p>当任务因某种原因失败了，平台会自动将任务重启，重启次数在此设置</p>"+
                            "<p><h4>该怎么填?</h4></p>"+
                            "<p>0<=重试次数<=10。默认值为0</p>",


    "jobConfig.task_name.label":"子任务名",
    "jobConfig.task_name.dec":"<p>子任务名称，会反映成为容器内的环境变量</p>"+
                            "<p><h4>该怎么填?</h4></p>"+
                            "<p>子任务名只能是小写字母和数字的字符串，长度最大30个字符。不同子任务的名称必须互不相同</p>",

    "jobConfig.replicas_number.label":"副本数",
    "jobConfig.replicas_number.dec": "<p>表示该子任务创建的Docker容器数量，子任务默认会有1个副本用来运行本任务。子任务类比于进程，该选项定义了将启动的进程数量</p>"+
                                "<p>当启动多个该子任务的副本时，可以通过环境变量PAI_TASK_INDEX来区别于不同的子任务副本（功能类似pid之于进程)</p>"+
                                "<p><h4>该怎么填?</h4></p>"+
                                "<p>0<副本数。默认值1</p>",

    "jobConfig.cpu_num.label":"CPU数",
    "jobConfig.cpu_num.dec": "<p>子任务将使用的CPU核心数量</p>"+
                            "<p>每台服务器的CPU核心总数为24，建议按需配置CPU，一般1块GPU卡配置2核</p>"+
                            "<p><h4>该怎么填?</h4></p>"+
                             "<p> 0<=CPU核数。</p>",

    "jobConfig.gpu_num.label":"GPU数",
    "jobConfig.gpu_num.dec": "<p>子任务将使用的GPU卡数量</p>"+
                            "<p>每台服务器的GPU总数为8，建议按需配置。如果子任务是传输或预处理数据等未使用GPU的任务，将该值设置为0</p>"+
                            "<p><h4>该怎么填?</h4></p>"+
                            "<p>0<=GPU卡数</p>",

    "jobConfig.memery.label":"内存(MB)",
    "jobConfig.memery.dec": "<p>任务将使用的内存数量，单位为MB</p>"+
                            "<p>GTX1080ti和TitanXp服务器的内存总数为192GB，TeslaV100的内存总数为384GB。建议按需配置，一般一块GPU卡配置22GB或44GB</p>"+
                            "<p><h4>该怎么填?</h4></p>"+
                            "<p>100<=内存(MB)</p>",

    "jobConfig.share_memery.label":"共享内存(MB)",
    "jobConfig.share_memery.dec": "<p>任务将使用的共享内存数量，单位为MB</p>"+
                                "<p>共享内存指 (shared memory)在多处理器的计算机系统中，可以被不同中央处理器（CPU）访问的大容量内存。部分框架会对共享内存有特殊要求。</p>"+
                                "<p><h4>该怎么填?</h4></p>"+
                                "<p>0<共享内存<=内存的值。默认值64MB</p>"+
                                "<p>如果框架对共享内存有要求，可以加大该数值，但不要超过memoryMB</p>",

    "jobConfig.min_succeeded_num.label":"最小副本成功数",
    "jobConfig.min_succeeded_num.dec": "<p>当子任务的所有副本中有X个副本已经运行成功了，那么该子任务终止，不再等待其他副本运行完成。</p>"+
                                        "<p><h4>该怎么填?</h4></p>"+
                                        "<p>1<=最小副本成功数<=副本数。默认值为1</p>",

    "jobConfig.min_failed_num.label":"最小副本失败数",
    "jobConfig.min_failed_num.dec": "<p>当子任务的所有副本中有X个副本已经运行失败了，那么该子任务终止，不再等待其他副本运行完成。</p>"+
                                    "<p><h4>该怎么填?</h4></p>"+
                                    "<p>1<=最小副本失败数<=副本数。默认值为1</p>",

    "jobConfig.command.label":"启动命令",
    "jobConfig.command.dec": "<p>子任务的启动命令</p>"+
                            "<p><h4>该怎么填?</h4></p>"+
                            "<p>子任务启动命令，可以有空格，不能包含其他非可见字符</p>"+
                            "<p>命令随子任务的不同而不同，这里是一些例子：</p>"+
                            "<p>python train.py</p>"+
                            "<p>/bin/bash start.sh</p>"+
                            "<p>cd /userhome && python start.py --output=/userhome/xx</p>",

    "jobConfig.subtask_importerr.title":"导入出现错误: 请检查",

    "jobConfig.required.errMsg":"必填项",
    "jobConfig.subtask.number.err":'必须是整数',
    "jobConfig.subtask.string.err":'必须是字符串类型',

    "jobConfig.job_name.pattern.errMsg":'任务名只能是小写字母和数字的字符串',
    "jobConfig.job_name.length.errMsg":"最长30个字符",

    "jobConfig.image.pattern.errMsg":'镜像名只能是一个非中文且可见字符的字符串',

    "jobConfig.subtaskList.empty.errMsg":"子任务列表不能为空",
    "jobConfig.subtask_name.replicas.errMsg":"子任务列表有相同名字的任务",

    "jobConfig.subtask_name.pattern.errMsg":'子任务名只能是小写字母和数字的字符串',
    "jobConfig.subtask_name.length.errMsg":"最长30个字符",

    "jobConfig.subtask_command.pattern.errMsg":"启动命令不能包含除空格外的非可见字符",

    "jobConfig.title.editSubTask":"编辑子任务",
    "jobConfig.task.button.confirm":"确定",
    "jobConfig.task.button.cancel":"取消",
    "jobConfig.task.header.operations":"操作",
    "jobConfig.button.delete":"删除",
    "jobConfig.button.delete.confirm":"确定删除？",
    "jobConfig.button.edit":"修改",
    "jobConfig.button.copy":"复制",

    "jobConfig.error.load_limit_failed":"加载任务提交信息失败",
    "jobConfig.limit.cpu":"CPU使用数超限,最大为",
    "jobConfig.limit.gpu":"GPU使用数超限,最大为",
    "jobConfig.limit.memery":"内存使用数超限,最大为",
    "jobConfig.limit.shmMB":"共享内存使用数超限,最大为",
    "jobConfig.limit.jobGPUNumber":"正在运行的GPU任务数超限,最大为",
    "jobConfig.limit.jobCPUNumber":"正在运行的CPU任务数超限,最大为",
    "jobConfig.success.submit_job":"任务提交成功",
    "jobConfig.error.submit_failed":"任务提交失败",

    "jobConfig.debug.onesubtask.confirm.title":'Debug任务的子任务列表只允许有1个子任务',
    "jobConfig.debug.submit.title":"调试任务温馨提示",
    "jobConfig.debug.submit.tips": DebugJobContent,
}
