const libPodgroup = require("../../libs/libTaskset/podgroup")
const os = require('os');
const path = require('path');
const client = require("../../utils/k8sClient")
const consts = require("../../libs/constants")
const Service = require('egg').Service;

var _k8sclient = null

class PodgroupService extends Service {

  async lifehook() {

    try{
      let req = this.ctx.request

      console.log("Podgroup lifehook event: " + JSON.stringify(req.body));

      if (req.body.currentState == "succeeded" || req.body.currentState == "failed" || req.body.currentState == "stopped") {
        var k8sclient = await this.getk8sClient()
        await k8sclient.deleteByName(req.body.id, req.body.namespace);
        console.log("life hook delete podgroup: " + req.body.id + ", namespace: " + req.body.namespace)
      }
      this.ctx.status = 200
    }catch(e){
      this.ctx.message = e.message
      this.ctx.status = 500
    }
  }

  async createPodGroupFromTaskSet(taskSet, taskSetHeader) {
    const {jobID, userID} = taskSetHeader;

    const podgroup = new libPodgroup();

    const minMember = parseInt(taskSet.metadata.labels[consts.K8S_MIN_MEMBER_LABEL_KEY]);

    podgroup.SetMinMember(minMember);
    podgroup.SetName(jobID);

    let k8sClient = await this.getk8sClient();
    const rsp = await k8sClient.create(podgroup.toJson(), userID);

    if (rsp.kind === 'Status') {
      throw new Error(rsp.message)
    }

    for (let i = 0; i < taskSet.spec.roles.length; i++) {
      taskSet.spec.roles[i].template.spec.serviceAccountName = "poddiscovery"
      taskSet.spec.roles[i].template.spec.schedulerName = "kube-batch"
      if (!taskSet.spec.roles[i].template.metadata) {
        taskSet.spec.roles[i].template.metadata = {}
      }
      if (!taskSet.spec.roles[i].template.metadata.annotations) {
        taskSet.spec.roles[i].template.metadata.annotations = {}
      }
      taskSet.spec.roles[i].template.metadata.annotations["scheduling.k8s.io/group-name"] = jobID
    }

    return taskSet
  }

  async getk8sClient() {
    if (!_k8sclient) {
      _k8sclient = client.getInstance()
      let kubeConfig = null
      if (process.env.WORK_IN_K8S_CLUSTER) {
        kubeConfig = await this.service.k8sutil.loadContextFromServiceAccount(process.env.KUBERNETES_CLIENT_SERVICEACCOUNT_ROOT);
      } else {
        kubeConfig = await this.service.k8sutil.loadContextFromLocalPath(process.env.CUSTOM_KUBE_CONFIG_PATH || path.join(os.homedir(), '.kube/config'));
      }
      _k8sclient.setKind("podgroups");
      _k8sclient.setApiVersion("scheduling.incubator.k8s.io/v1alpha1");
      _k8sclient.setApiServer(kubeConfig.server);
      _k8sclient.setAuthCtxProvider(opt => Object.assign(opt, kubeConfig.authorization));
    }
    return _k8sclient
  }
}

module.exports = PodgroupService;
