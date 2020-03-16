
'use strict';
const os = require('os');
const path = require('path');
const k8s = require('@kubernetes/client-node');
const { ECode, LError } = require('../../lib');
const WHITE_PATHS = /^\/api\/v1\/(user|token|ogz|third)/;

module.exports = () => {
  return async function(ctx, next) {
    if (WHITE_PATHS.test(ctx.path)) {
      await next();
      return;
    }

    const { user } = ctx.state;

    await handleUserPolicyFromK8s(user.user_id);

    await next();
  };
};

async function handleUserPolicyFromK8s(userid) {
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

  const UserNSNetworkPolicyYamlString = `
        apiVersion: networking.k8s.io/v1
        kind: NetworkPolicy
        metadata:
          name: deny-all-ingress-except-myns
          namespace: ${userNamespace.metadata.name}
        spec:
          podSelector: {}
          ingress:
          - from:
            - namespaceSelector:
                matchLabels:
                   userid: ${userNamespace.metadata.name}
          policyTypes:
          - Ingress
        `;

  const DefaultNSNetworkPolicyYamlString = `
        apiVersion: networking.k8s.io/v1
        kind: NetworkPolicy
        metadata:
          name: deny-all-ingress-except-default
          namespace: ${userNamespace.metadata.name}
        spec:
          podSelector: {}
          ingress:
          - from:
            - namespaceSelector:
                matchLabels:
                   ns: default
          policyTypes:
          - Ingress
        `;

  const KubeSystemNSNetworkPolicyYamlString = `
        apiVersion: networking.k8s.io/v1
        kind: NetworkPolicy
        metadata:
          name: deny-all-ingress-except-kube-system
          namespace: ${userNamespace.metadata.name}
        spec:
          podSelector: {}
          ingress:
          - from:
            - namespaceSelector:
                matchLabels:
                   ns: kube-system
          policyTypes:
          - Ingress
        `;

  const UserNSNetworkPolicy = k8s.loadYaml(UserNSNetworkPolicyYamlString);
  const DefaultNSNetworkPolicy = k8s.loadYaml(DefaultNSNetworkPolicyYamlString);
  const KubeSystemNSNetworkPolicy = k8s.loadYaml(KubeSystemNSNetworkPolicyYamlString);

  try {
    await networkk8siov1Api.readNamespacedNetworkPolicy(UserNSNetworkPolicy.metadata.name, userNamespace.metadata.name);
  } catch (err) {
    if (err.response && err.response.statusCode === 404) {
      try {
        await k8sv1Api.createNamespace(userNamespace);

        await networkk8siov1Api.createNamespacedNetworkPolicy(userNamespace.metadata.name, UserNSNetworkPolicy);
        await networkk8siov1Api.createNamespacedNetworkPolicy(userNamespace.metadata.name, DefaultNSNetworkPolicy);
        await networkk8siov1Api.createNamespacedNetworkPolicy(userNamespace.metadata.name, KubeSystemNSNetworkPolicy);

        await k8sv1Api.createNamespacedServiceAccount(userNamespace.metadata.name, tcServiceAccount);
        try {
          await rbacauthorizationk8siov1Api.readClusterRoleBinding(tcClusterRoleBinding.metadata.name);
        } catch (err) {
          if (err.response.statusCode === 404) {
            await rbacauthorizationk8siov1Api.createClusterRoleBinding(tcClusterRoleBinding);
          } else {
            this.ctx.logger.error('createClusterRoleBinding Error when login: ', err.response.body);
            throw new LError(ECode.OPERATION_FORBIDDEN, 'handle user policy error when login');
          }
        }

      } catch (err) {
        throw new LError(ECode.OPERATION_FORBIDDEN, 'handle user policy error when login. err:' + JSON.stringify(err));
      }
    } else {
      throw new LError(ECode.OPERATION_FORBIDDEN, 'handle user policy error when login. err:' + JSON.stringify(err));
    }
  }
}

