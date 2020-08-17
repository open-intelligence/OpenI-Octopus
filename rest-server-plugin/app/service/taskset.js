const libTask = require("../../libs/libTaskset/taskset")
const libRole = require("../../libs/libTaskset/role")
const libContainer = require("../../libs/libTaskset/container")
const { EmptyDir, HostPath } = require("../../libs/libTaskset/volume");
const consts = require("../../libs/constants")
const Service = require('egg').Service;

class TasksetService extends Service {

  async translator() {

    try{

      let req = this.ctx.request
    
      console.log("translator handle.")

      const userInfo = req.body.job.userInfo
      const job = req.body.job.content

      const jobId =  req.body.header.jobID

      let gpuType = (job.gpuType+"").toLowerCase();

      const taskset = new libTask()
      const nniHost = process.env.NNI_HOST

      taskset.SetName(jobId);

      // if(gpuType == "debug_cpu"){
      //   gpuType = "debug";
      // }

      //create jupyter service

      if(gpuType === "debug"){
        for(let i=0;i<job.taskRoles.length;i++)
        {
          let subTaskName = job.taskRoles[i].name;
          let debugSubTaskJpyIngressPath = "/jpylab_"+ jobId + "_" + subTaskName;
          job.taskRoles[i].command=job.taskRoles[i].command + " --LabApp.base_url='"+ debugSubTaskJpyIngressPath + "' ";

          await this.service.k8sutil.createK8sIngressServiceForDebugJob(jobId, subTaskName, userInfo.userId.toLowerCase(), debugSubTaskJpyIngressPath);
        }
      }

      //create nni service
      for(let i=0;i<job.taskRoles.length;i++)
      {
        if (job.taskRoles[i].useNNI){
          let subTaskName = job.taskRoles[i].name;
          let NNISubTaskIngressHost = "nni" + jobId + subTaskName+ "." + nniHost + ".nip.io";
          job.taskRoles[i].command = "service ssh start;" + job.taskRoles[i].command;

          await this.service.k8sutil.createK8sIngressServiceForNNIJob(jobId, subTaskName, userInfo.userId.toLowerCase(), NNISubTaskIngressHost);
        }
      }

      taskset.SetNamespace(userInfo.userId.toLowerCase());

      taskset.SetConfig(job);

      taskset.SetLabel(consts.K8S_ORG_ID_LABEL_KEY, userInfo.orgId);
      taskset.SetLabel(consts.K8S_USER_LABEL_KEY, userInfo.userId);
      taskset.SetLabel(consts.K8S_JOB_TYPE_LABEL_KEY, job.gpuType);
      taskset.SetLabel(consts.K8S_JOB_NAME_LABEL_KEY, job.jobName);
      taskset.SetLabel(consts.K8S_USER_NAME_LABEL_KEY, userInfo.username);

      taskset.SetRetryAmount(job.retryCount || 0);

      let minMember = 0;

      const task_roles = job.taskRoles || [];

      for (let i = 0; i < task_roles.length; i++) {

        const role = task_roles[i];

        minMember += task_roles[i].taskNumber;

        const task = new libRole();

        task.SetName(role.name);
        task.SetMaxFailed(role.minFailedTaskCount);
        task.SetMinSucceeded(role.minSucceededTaskCount);
        task.SetReplicaAmount(role.taskNumber);
        task.SetNodeSelector('resourceType', gpuType);

        const container =  new libContainer();

        if(role.needIBDevice){
          container.SetCustomResource('rdma/vhca', 1);
          container.AddSecurityCapabilities("IPC_LOCK");
        }

        container.SetCustomResource('nvidia.com/gpu', role.gpuNumber);
        container.SetCpu(role.cpuNumber);
        container.SetMemoryMb(role.memoryMB);
        container.SetCommand('sleep 10;' + role.command);
        container.SetImage(job.image);

        container.Mount(new HostPath().SetMountFrom(`/ghome/${userInfo.username}`).SetMountTo('/userhome'));
        container.Mount(new HostPath().SetMountFrom(`/gmodel/${userInfo.username}`).SetMountTo('/model-hub'));
        
        container.Mount(new HostPath().SetMountFrom('/gdata').SetMountTo('/gdata').SetReadOnly(true));

        container.Mount(new HostPath().SetMountFrom('/etc/localtime').SetMountTo('/etc/localtime').SetReadOnly(true));

        container.Mount(new EmptyDir().SetName("cache-volume").SetMountTo("/dev/shm").SetMedium("Memory").SetSizeLimit(role.shmMB));

        let gpuNumber = parseInt(role.gpuNumber)
        if (!gpuNumber || gpuNumber < 1){
          container.SetEnv("NVIDIA_VISIBLE_DEVICES", "void")
        }
        
        task.SetContainer(container);

        if(role.isMainRole){
          task.AddEventPolicy("RoleFailed","TaskSetFailed");
          task.AddEventPolicy("RoleSucceeded","TaskSetSucceeded");
          task.AddEventPolicy("RoleCompleted","TaskSetCompleted");
        }

        taskset.AddRole(task);
      }
      
      taskset.SetLabel(consts.K8S_MIN_MEMBER_LABEL_KEY, minMember.toString());
      const tasksetJson = taskset.toJson()


      this.ctx.status = 200
      this.ctx.body = tasksetJson

    }catch(e){
      this.logger.error(e)
      this.ctx.message = e.message
      this.ctx.status = 500
    }
  }
}

module.exports = TasksetService;