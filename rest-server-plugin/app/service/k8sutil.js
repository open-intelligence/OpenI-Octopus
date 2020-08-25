'use strict';
const fs = require('fs');
const yaml = require('js-yaml');
const path = require('path');
const os = require('os');
const k8s = require('@kubernetes/client-node');
const libCore = require('../../libs/libCore')
const Service = require('egg').Service;

class K8sutilService extends Service {

  isHttps(port) {
    return port == 443
  }

  loadContextFromServiceAccount(k8sClientServiceAccountRoot) {
    const host = process.env.KUBERNETES_SERVICE_HOST
    const port = process.env.KUBERNETES_SERVICE_PORT
    if (!host || !port) {
      throw new TypeError(
        'Unable to load in-cluster configuration, KUBERNETES_SERVICE_HOST' +
        ' and KUBERNETES_SERVICE_PORT must be defined')
    }
    const root = k8sClientServiceAccountRoot || '/var/run/secrets/kubernetes.io/serviceaccount/';
    const caPath = path.join(root, 'ca.crt');
    const tokenPath = path.join(root, 'token');
    const namespacePath = path.join(root, 'namespace');

    const ca = fs.readFileSync(caPath, 'utf8')
    const bearer = fs.readFileSync(tokenPath, 'utf8')
    const namespace = fs.readFileSync(namespacePath, 'utf8')

    return {
      namespace,
      server: `${this.isHttps(port) ? "https" : "http"}://${host}:${port}/`,
      authorization: {
        ca,
        headers: {
          Authorization: `Bearer ${bearer}`
        },
        rejectUnauthorized: this.isHttps(port) ? true : false,
      }
    };
  }

  loadContextFromLocalPath(k8sConfigLocalPath) {
    const kc = new k8s.KubeConfig();
    kc.loadFromFile(k8sConfigLocalPath);
    const context = kc.getCurrentContextObject()
    if( !context || !context.user || !context.cluster ) {
      throw new Error("local k8s config load failed")
    }

    const currentUser = kc.getUser(context.user),
      currentCluster = kc.getCluster(context.cluster);
    if (!currentCluster.caData && currentCluster.caFile) {
      currentCluster.caData = fs.readFileSync(currentCluster.caFile).toString()
    } else {
      currentCluster.caData = Buffer.from(currentCluster.caData, 'base64').toString()
    }
    if (!currentUser.certData && currentUser.certFile) {
      currentUser.certData = fs.readFileSync(currentUser.certFile).toString()
    } else {
      currentUser.certData = Buffer.from(currentUser.certData, 'base64').toString()
    }
    if (!currentUser.keyData && currentUser.keyFile) {
      currentUser.keyData = fs.readFileSync(currentUser.keyFile).toString()
    } else {
      currentUser.keyData = Buffer.from(currentUser.keyData, 'base64').toString()
    }

    const kubeContext = {
      authorization: {
        ca: currentCluster.caData,
        cert: currentUser.certData,
        key: currentUser.keyData,
      },
      server: currentCluster.server,
    };

    return kubeContext
  }


  async handleUserPolicyFromK8s(userid) {
    const kc = new k8s.KubeConfig();

    if (process.env.WORK_IN_K8S_CLUSTER) {
      kc.loadFromCluster();
    } else {
      kc.loadFromFile(process.env.CUSTOM_KUBE_CONFIG_PATH
        || path.join(os.homedir(), '.kube/config'));
    }

    const k8sv1Api = kc.makeApiClient(k8s.CoreV1Api);
    const networkk8siov1Api = kc.makeApiClient(k8s.NetworkingV1Api);
    const rbacauthorizationk8siov1Api = kc.makeApiClient(k8s.RbacAuthorizationV1Api);

    const userNamespaceYamlString = `
          apiVersion: v1
          kind: Namespace
          metadata:
          name: ${userid.toLowerCase()}
          labels:
            ns: user
            userid: ${userid.toLowerCase()}
          `;

    const userNamespace = k8s.loadYaml(userNamespaceYamlString);

    const tcServiceAccountYamlString = `
            apiVersion: v1
            kind: ServiceAccount
            metadata:
              name: poddiscovery
              namespace: ${userid.toLowerCase()}
            `;

    const tcServiceAccount = k8s.loadYaml(tcServiceAccountYamlString);

    const tcClusterRoleBindingYamlString = `
          apiVersion: rbac.authorization.k8s.io/v1
          kind: ClusterRoleBinding
          metadata:
            name: tcpoddiscovery-${userid.toLowerCase()}
          roleRef:
            apiGroup: rbac.authorization.k8s.io
            kind: ClusterRole
            name: cluster-admin
          subjects:
          - apiGroup: rbac.authorization.k8s.io
            kind: User
            name: system:serviceaccount:${userid.toLowerCase()}:poddiscovery
        `;

    const tcClusterRoleBinding = k8s.loadYaml(tcClusterRoleBindingYamlString);

    const NSNetworkPolicyYamlString = `
          apiVersion: networking.k8s.io/v1
          kind: NetworkPolicy
          metadata:
            name: deny-all-ingress-except-4ns
            namespace: ${userNamespace.metadata.name}
          spec:
            podSelector: {}
            ingress:
            - from:
              - namespaceSelector:
                  matchLabels:
                    ns: default
              - namespaceSelector:
                  matchLabels:
                    ns: kube-system
              - namespaceSelector:
                  matchLabels:
                    ns: ingress-nginx
              - namespaceSelector:
                  matchLabels:
                    userid: ${userNamespace.metadata.name}
            policyTypes:
            - Ingress
          `;


    const NSNetworkPolicy = k8s.loadYaml(NSNetworkPolicyYamlString);

    try {
      await networkk8siov1Api.readNamespacedNetworkPolicy(NSNetworkPolicy.metadata.name, userNamespace.metadata.name);
    } catch (err) {
      if (err.response && err.response.statusCode === 404) {
        try {
          await k8sv1Api.createNamespace(userNamespace);

          await networkk8siov1Api.createNamespacedNetworkPolicy(userNamespace.metadata.name, NSNetworkPolicy);

          await k8sv1Api.createNamespacedServiceAccount(userNamespace.metadata.name, tcServiceAccount);
          try {
            await rbacauthorizationk8siov1Api.readClusterRoleBinding(tcClusterRoleBinding.metadata.name);
          } catch (err) {
            if (err.response.statusCode === 404) {
              await rbacauthorizationk8siov1Api.createClusterRoleBinding(tcClusterRoleBinding);
            } else {
              console.error('createClusterRoleBinding Error when login: ', err.response.body);
            }
          }

        } catch (err) {
          console.error('handle user policy error when login. err:' + JSON.stringify(err));
        }
      } else {
        console.error('handle user policy error when login. err:' + JSON.stringify(err));
      }
    }
  }

  async createK8sIngressServiceForDebugJob(tasksetname, subtaskname, namespace, debugSubTaskJpyIngressPath) {
    const kc = new k8s.KubeConfig();

    if (process.env.WORK_IN_K8S_CLUSTER) {
      kc.loadFromCluster();
    } else {
      kc.loadFromFile(process.env.CUSTOM_KUBE_CONFIG_PATH
        || path.join(os.homedir(), '.kube/config'));
    }

    let jpylabProxyBodySize = ""
    if (process.env.DISABLE_JPYLAB_REQUEST_BODY_LIMIT == "true") {
      jpylabProxyBodySize = "100G"
    }

    const k8sv1Api = kc.makeApiClient(k8s.CoreV1Api);
    const k8sExtv1beta1Api = kc.makeApiClient(k8s.ExtensionsV1beta1Api);

    const debugJpylabIngressYamlString = `
        apiVersion: extensions/v1beta1
        kind: Ingress
        metadata:
          annotations: 
            nginx.ingress.kubernetes.io/proxy-body-size: ${jpylabProxyBodySize}
          name: d-jpy-ing-${tasksetname}-${subtaskname}
          namespace: ${namespace}
        spec:
          rules:
          - http:
              paths:
              - path: ${debugSubTaskJpyIngressPath}
                backend:
                  serviceName: d-jpy-svc-${tasksetname}-${subtaskname}
                  servicePort: 80
    `;
    
    const debugJpylabServiceYamlString = `
      apiVersion: v1
      kind: Service
      metadata:
        name: d-jpy-svc-${tasksetname}-${subtaskname}
        namespace: ${namespace}
      labels:
        app: debug-jpylab-service
      spec:
        selector:
          PodTaskRole: ${subtaskname}
          TaskSet: ${tasksetname}
        ports:
        - name: jpylab
          port: 80
          targetPort: 80
    `;

    const debugJpylabIngress = k8s.loadYaml(debugJpylabIngressYamlString);
    const debugJpylabService = k8s.loadYaml(debugJpylabServiceYamlString);

    await k8sExtv1beta1Api.createNamespacedIngress(namespace, debugJpylabIngress);
    await k8sv1Api.createNamespacedService(namespace, debugJpylabService);
  }

  async stopK8sIngressServiceForDebugJob(jobId, namespace) {
    namespace = namespace.toLowerCase();

    const kc = new k8s.KubeConfig();
    if (process.env.WORK_IN_K8S_CLUSTER) {
      kc.loadFromCluster();
    } else {
      kc.loadFromFile(process.env.CUSTOM_KUBE_CONFIG_PATH
        || path.join(os.homedir(), '.kube/config'));
    }

    const k8sv1Api = kc.makeApiClient(k8s.CoreV1Api);
    const k8sExtv1beta1Api = kc.makeApiClient(k8s.ExtensionsV1beta1Api);
    const coreClient = libCore.newCoreClient(this.config.pipeline);
    let job = await coreClient.getJobConfig(jobId);

    if (!job) {
      console.log("job not found when stopK8sIngressServiceForDebugJob: " + jobId)
      return
    }

    let taskRoles = job.content.taskRoles

    if (!taskRoles) {
      console.log("job taskRoles not found when stopK8sIngressServiceForDebugJob: " + jobId, job)
      return
    }

    for(let i=0; i<taskRoles.length; i++){

      var subtaskname = taskRoles[i].name
      let debugJpylabIngressName = "d-jpy-ing-" + jobId + "-" + subtaskname;
      let debugJpylabSvcName = "d-jpy-svc-" + jobId + "-" + subtaskname;

      try {
        await k8sv1Api.readNamespacedService(debugJpylabSvcName, namespace);
      } catch (err) {
        if (err.response && err.response.statusCode === 404) {
          //no debugJpylabSvcName of that job , then end this func;
          console.log("readNamespacedService err, debugJpylabSvcName: ", debugJpylabSvcName, JSON.stringify(err));
          return;
        } else {
          throw new LError(ECode.FAILURE, 'stopK8sIngressServiceForDebugJob. err:' + JSON.stringify(err));
        }
      }

      //console.log("stop debugJpylabIngressName: ", debugJpylabIngressName);
      //console.log("stop debugJpylabIngressName: ", debugJpylabSvcName);

      await k8sExtv1beta1Api.deleteNamespacedIngress(debugJpylabIngressName, namespace);
      await k8sv1Api.deleteNamespacedService(debugJpylabSvcName, namespace);
    }
  }
  async createK8sIngressServiceForNNIJob(tasksetname, subtaskname, namespace, NNISubTaskIngressHost) {
    const kc = new k8s.KubeConfig();

    if (process.env.WORK_IN_K8S_CLUSTER) {
      kc.loadFromCluster();
    } else {
      kc.loadFromFile(process.env.CUSTOM_KUBE_CONFIG_PATH
        || path.join(os.homedir(), '.kube/config'));
    }

    const k8sv1Api = kc.makeApiClient(k8s.CoreV1Api);
    const k8sExtv1beta1Api = kc.makeApiClient(k8s.ExtensionsV1beta1Api);

    const NNIIngressYamlString = `
        apiVersion: extensions/v1beta1
        kind: Ingress
        metadata:
          name: nni-ing-${tasksetname}-${subtaskname}
          namespace: ${namespace}
          annotations:
            nginx.ingress.kubernetes.io/rewrite-target: /$1
        spec:
          rules:
          - host: ${NNISubTaskIngressHost}
            http:
              paths:
              - path: /(.*)
                backend:
                  serviceName: nni-svc-${tasksetname}-${subtaskname}
                  servicePort: 81
    `;
    
    const NNIServiceYamlString = `
      apiVersion: v1
      kind: Service
      metadata:
        name: nni-svc-${tasksetname}-${subtaskname}
        namespace: ${namespace}
      labels:
        app: nni-service
      spec:
        selector:
          PodTaskRole: ${subtaskname}
          TaskSet: ${tasksetname}
        ports:
        - name: nni
          port: 81
          targetPort: 8080
    `;

    const NNIService = k8s.loadYaml(NNIServiceYamlString);
    await k8sv1Api.createNamespacedService(namespace, NNIService);
    const NNIIngress = k8s.loadYaml(NNIIngressYamlString);
    await k8sExtv1beta1Api.createNamespacedIngress(namespace, NNIIngress);
  }

  async stopK8sIngressServiceForNNIJob(jobId, namespace) {
    namespace = namespace.toLowerCase();

    const kc = new k8s.KubeConfig();
    if (process.env.WORK_IN_K8S_CLUSTER) {
      kc.loadFromCluster();
    } else {
      kc.loadFromFile(process.env.CUSTOM_KUBE_CONFIG_PATH
        || path.join(os.homedir(), '.kube/config'));
    }

    const k8sv1Api = kc.makeApiClient(k8s.CoreV1Api);
    const k8sExtv1beta1Api = kc.makeApiClient(k8s.ExtensionsV1beta1Api);
    const coreClient = libCore.newCoreClient(this.config.pipeline);
    let job = await coreClient.getJobConfig(jobId);

    if (!job) {
      console.log("job not found when stopK8sIngressServiceForNNIJob: " + jobId)
      return
    }

    let taskRoles = job.content.taskRoles

    if (!taskRoles) {
      console.log("job taskRoles not found when stopK8sIngressServiceForNNIJob: " + jobId, job)
      return
    }
    
    for(let i=0; i<taskRoles.length; i++){
      if (taskRoles[i].useNNI){
        var subtaskname = taskRoles[i].name
        let NNIIngressName = "nni-ing-" + jobId + "-" + subtaskname;
        let NNISvcName = "nni-svc-" + jobId + "-" + subtaskname;

        try {
          await k8sv1Api.readNamespacedService(NNISvcName, namespace);
        } catch (err) {
          if (err.response && err.response.statusCode === 404) {
            //no debugJpylabSvcName of that job , then end this func;
            console.log("readNamespacedService err, NNISvcName: ", NNISvcName, JSON.stringify(err));
            return;
          } else {
            throw new LError(ECode.FAILURE, 'stopK8sIngressServiceForNNIJob. err:' + JSON.stringify(err));
          }
        }
        // console.log("stop NNIIngressName: ", NNIIngressName);
        // console.log("stop NNISvcName: ", NNISvcName);
        await k8sExtv1beta1Api.deleteNamespacedIngress(NNIIngressName, namespace);
        await k8sv1Api.deleteNamespacedService(NNISvcName, namespace);
      }
    }
  }
}

module.exports = K8sutilService;