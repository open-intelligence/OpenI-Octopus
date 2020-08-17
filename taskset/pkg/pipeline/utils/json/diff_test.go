// MIT License
//
// Copyright (c) PCL. All rights reserved.
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE
//

package json

import (
	"testing"
)

const (
	oldStr string = `{
		"apiVersion": "octopus.openi.pcl.cn/v1alpha1",
		"kind": "TaskSet",
		"metadata": {
			"creationTimestamp": "2019-11-28T07:46:06Z",
			"generation": 15,
			"labels": {
				"job-name": "dgxmultitest755234",
				"job-type": "dgx",
				"platform-group": "m4xnivpjx1i",
				"platform-user": "B4AE2839C90A14C75566B93E97E2287A"
			},
			"name": "c04f7550010fb011ea0b9180b9fdee01977c",
			"namespace": "default",
			"resourceVersion": "27239645",
			"selfLink": "/apis/octopus.openi.pcl.cn/v1alpha1/namespaces/default/tasksets/c04f7550010fb011ea0b9180b9fdee01977c",
			"uid": "2264a609-11b3-11ea-abb6-b4969137ef9a"
		},
		"spec": {
			"retryPolicy": {
				"maxRetryCount": 0,
				"retry": false
			},
			"roles": [
				{
					"completionPolicy": {
						"maxFailed": 1,
						"minSucceeded": 1
					},
					"eventPolicy": [],
					"name": "dgxtestsub1",
					"replicas": 1,
					"retryPolicy": {
						"maxRetryCount": 0,
						"retry": false
					},
					"template": {
						"metadata": {
							"annotations": {
								"scheduling.k8s.io/group-name": "c04f7550010fb011ea0b9180b9fdee01977c"
							},
							"creationTimestamp": null
						},
						"spec": {
							"containers": [
								{
									"command": [
										"sh",
										"-c",
										"sleep 10;sleep 10; "
									],
									"image": "192.168.202.74:5000/user-images/deepo:v2.0",
									"name": "dgxtestsub1-container",
									"resources": {
										"limits": {
											"cpu": "1",
											"memory": "16Gi",
											"nvidia.com/gpu": "1"
										}
									},
									"volumeMounts": [
										{
											"mountPath": "/userhome",
											"name": "mount-1574848403811"
										},
										{
											"mountPath": "/model-hub",
											"name": "mount-1574848403812"
										},
										{
											"mountPath": "/gdata",
											"name": "mount-1574848403813",
											"readOnly": true
										},
										{
											"mountPath": "/etc/hosts",
											"name": "mount-1574848403814",
											"readOnly": true
										}
									]
								}
							],
							"initContainers": [
								{
									"command": [
										"sh",
										"-c",
										"/app/poddiscovery"
									],
									"image": "192.168.202.74:5000/openi/poddiscovery:v0.0.12",
									"name": "dgxtestsub1init-container-0",
									"resources": {},
									"volumeMounts": [
										{
											"mountPath": "/etc/hosts",
											"name": "mount-1574848403814"
										},
										{
											"mountPath": "/etc/hosts_json.json",
											"name": "mount-1574848403815"
										}
									]
								}
							],
							"nodeSelector": {
								"resourceType": "dgx"
							},
							"restartPolicy": "Never",
							"schedulerName": "kube-batch",
							"serviceAccountName": "poddiscovery",
							"volumes": [
								{
									"hostPath": {
										"path": "/ghome/yangxzh"
									},
									"name": "mount-1574848403811"
								},
								{
									"hostPath": {
										"path": "/gmodel/yangxzh"
									},
									"name": "mount-1574848403812"
								},
								{
									"hostPath": {
										"path": "/gdata"
									},
									"name": "mount-1574848403813"
								},
								{
									"hostPath": {
										"path": "/ghome/yangxzh/share_hosts/c04f7550-10fb-11ea-b918-b9fdee01977c",
										"type": "FileOrCreate"
									},
									"name": "mount-1574848403814"
								},
								{
									"hostPath": {
										"path": "/ghome/yangxzh/share_hosts/c04f7550-10fb-11ea-b918-b9fdee01977c.json",
										"type": "FileOrCreate"
									},
									"name": "mount-1574848403815"
								}
							]
						}
					}
				},
				{
					"completionPolicy": {
						"maxFailed": 1,
						"minSucceeded": 1
					},
					"eventPolicy": [],
					"name": "dgxtestsub1001574130000069",
					"replicas": 1,
					"retryPolicy": {
						"maxRetryCount": 0,
						"retry": false
					},
					"template": {
						"metadata": {
							"annotations": {
								"scheduling.k8s.io/group-name": "c04f7550010fb011ea0b9180b9fdee01977c"
							},
							"creationTimestamp": null
						},
						"spec": {
							"containers": [
								{
									"command": [
										"sh",
										"-c",
										"sleep 10;sleep 10;"
									],
									"image": "192.168.202.74:5000/user-images/deepo:v2.0",
									"name": "dgxtestsub1001574130000069-container",
									"resources": {
										"limits": {
											"cpu": "1",
											"memory": "16Gi",
											"nvidia.com/gpu": "1"
										}
									},
									"volumeMounts": [
										{
											"mountPath": "/userhome",
											"name": "mount-1574848403812"
										},
										{
											"mountPath": "/model-hub",
											"name": "mount-1574848403813"
										},
										{
											"mountPath": "/gdata",
											"name": "mount-1574848403814",
											"readOnly": true
										},
										{
											"mountPath": "/etc/hosts",
											"name": "mount-1574848403815",
											"readOnly": true
										}
									]
								}
							],
							"initContainers": [
								{
									"command": [
										"sh",
										"-c",
										"/app/poddiscovery"
									],
									"image": "192.168.202.74:5000/openi/poddiscovery:v0.0.12",
									"name": "dgxtestsub1001574130000069init-container-0",
									"resources": {},
									"volumeMounts": [
										{
											"mountPath": "/etc/hosts",
											"name": "mount-1574848403815"
										},
										{
											"mountPath": "/etc/hosts_json.json",
											"name": "mount-1574848403816"
										}
									]
								}
							],
							"nodeSelector": {
								"resourceType": "dgx"
							},
							"restartPolicy": "Never",
							"schedulerName": "kube-batch",
							"serviceAccountName": "poddiscovery",
							"volumes": [
								{
									"hostPath": {
										"path": "/ghome/yangxzh"
									},
									"name": "mount-1574848403812"
								},
								{
									"hostPath": {
										"path": "/gmodel/yangxzh"
									},
									"name": "mount-1574848403813"
								},
								{
									"hostPath": {
										"path": "/gdata"
									},
									"name": "mount-1574848403814"
								},
								{
									"hostPath": {
										"path": "/ghome/yangxzh/share_hosts/c04f7550-10fb-11ea-b918-b9fdee01977c",
										"type": "FileOrCreate"
									},
									"name": "mount-1574848403815"
								},
								{
									"hostPath": {
										"path": "/ghome/yangxzh/share_hosts/c04f7550-10fb-11ea-b918-b9fdee01977c.json",
										"type": "FileOrCreate"
									},
									"name": "mount-1574848403816"
								}
							]
						}
					}
				},
				{
					"completionPolicy": {
						"maxFailed": 1,
						"minSucceeded": 1
					},
					"eventPolicy": [],
					"name": "dgxtestsub1001574130001069",
					"replicas": 1,
					"retryPolicy": {
						"maxRetryCount": 0,
						"retry": false
					},
					"template": {
						"metadata": {
							"annotations": {
								"scheduling.k8s.io/group-name": "c04f7550010fb011ea0b9180b9fdee01977c"
							},
							"creationTimestamp": null
						},
						"spec": {
							"containers": [
								{
									"command": [
										"sh",
										"-c",
										"sleep 10;sleep 10; "
									],
									"image": "192.168.202.74:5000/user-images/deepo:v2.0",
									"name": "dgxtestsub1001574130001069-container",
									"resources": {
										"limits": {
											"cpu": "1",
											"memory": "16Gi"
										}
									},
									"volumeMounts": [
										{
											"mountPath": "/userhome",
											"name": "mount-1574848403812"
										},
										{
											"mountPath": "/model-hub",
											"name": "mount-1574848403813"
										},
										{
											"mountPath": "/gdata",
											"name": "mount-1574848403814",
											"readOnly": true
										},
										{
											"mountPath": "/etc/hosts",
											"name": "mount-1574848403815",
											"readOnly": true
										}
									]
								}
							],
							"initContainers": [
								{
									"command": [
										"sh",
										"-c",
										"/app/poddiscovery"
									],
									"image": "192.168.202.74:5000/openi/poddiscovery:v0.0.12",
									"name": "dgxtestsub1001574130001069init-container-0",
									"resources": {},
									"volumeMounts": [
										{
											"mountPath": "/etc/hosts",
											"name": "mount-1574848403815"
										},
										{
											"mountPath": "/etc/hosts_json.json",
											"name": "mount-1574848403816"
										}
									]
								}
							],
							"nodeSelector": {
								"resourceType": "dgx"
							},
							"restartPolicy": "Never",
							"schedulerName": "kube-batch",
							"serviceAccountName": "poddiscovery",
							"volumes": [
								{
									"hostPath": {
										"path": "/ghome/yangxzh"
									},
									"name": "mount-1574848403812"
								},
								{
									"hostPath": {
										"path": "/gmodel/yangxzh"
									},
									"name": "mount-1574848403813"
								},
								{
									"hostPath": {
										"path": "/gdata"
									},
									"name": "mount-1574848403814"
								},
								{
									"hostPath": {
										"path": "/ghome/yangxzh/share_hosts/c04f7550-10fb-11ea-b918-b9fdee01977c",
										"type": "FileOrCreate"
									},
									"name": "mount-1574848403815"
								},
								{
									"hostPath": {
										"path": "/ghome/yangxzh/share_hosts/c04f7550-10fb-11ea-b918-b9fdee01977c.json",
										"type": "FileOrCreate"
									},
									"name": "mount-1574848403816"
								}
							]
						}
					}
				},
				{
					"completionPolicy": {
						"maxFailed": 1,
						"minSucceeded": 1
					},
					"eventPolicy": [],
					"name": "dgxtestsub1001574130002181",
					"replicas": 1,
					"retryPolicy": {
						"maxRetryCount": 0,
						"retry": false
					},
					"template": {
						"metadata": {
							"annotations": {
								"scheduling.k8s.io/group-name": "c04f7550010fb011ea0b9180b9fdee01977c"
							},
							"creationTimestamp": null
						},
						"spec": {
							"containers": [
								{
									"command": [
										"sh",
										"-c",
										"sleep 10;sleep 10; "
									],
									"image": "192.168.202.74:5000/user-images/deepo:v2.0",
									"name": "dgxtestsub1001574130002181-container",
									"resources": {
										"limits": {
											"cpu": "1",
											"memory": "16Gi"
										}
									},
									"volumeMounts": [
										{
											"mountPath": "/userhome",
											"name": "mount-1574848403812"
										},
										{
											"mountPath": "/model-hub",
											"name": "mount-1574848403813"
										},
										{
											"mountPath": "/gdata",
											"name": "mount-1574848403814",
											"readOnly": true
										},
										{
											"mountPath": "/etc/hosts",
											"name": "mount-1574848403815",
											"readOnly": true
										}
									]
								}
							],
							"initContainers": [
								{
									"command": [
										"sh",
										"-c",
										"/app/poddiscovery"
									],
									"image": "192.168.202.74:5000/openi/poddiscovery:v0.0.12",
									"name": "dgxtestsub1001574130002181init-container-0",
									"resources": {},
									"volumeMounts": [
										{
											"mountPath": "/etc/hosts",
											"name": "mount-1574848403815"
										},
										{
											"mountPath": "/etc/hosts_json.json",
											"name": "mount-1574848403816"
										}
									]
								}
							],
							"nodeSelector": {
								"resourceType": "dgx"
							},
							"restartPolicy": "Never",
							"schedulerName": "kube-batch",
							"serviceAccountName": "poddiscovery",
							"volumes": [
								{
									"hostPath": {
										"path": "/ghome/yangxzh"
									},
									"name": "mount-1574848403812"
								},
								{
									"hostPath": {
										"path": "/gmodel/yangxzh"
									},
									"name": "mount-1574848403813"
								},
								{
									"hostPath": {
										"path": "/gdata"
									},
									"name": "mount-1574848403814"
								},
								{
									"hostPath": {
										"path": "/ghome/yangxzh/share_hosts/c04f7550-10fb-11ea-b918-b9fdee01977c",
										"type": "FileOrCreate"
									},
									"name": "mount-1574848403815"
								},
								{
									"hostPath": {
										"path": "/ghome/yangxzh/share_hosts/c04f7550-10fb-11ea-b918-b9fdee01977c.json",
										"type": "FileOrCreate"
									},
									"name": "mount-1574848403816"
								}
							]
						}
					}
				},
				{
					"completionPolicy": {
						"maxFailed": 1,
						"minSucceeded": 1
					},
					"eventPolicy": [],
					"name": "dgxtestsub2",
					"replicas": 1,
					"retryPolicy": {
						"maxRetryCount": 0,
						"retry": false
					},
					"template": {
						"metadata": {
							"annotations": {
								"scheduling.k8s.io/group-name": "c04f7550010fb011ea0b9180b9fdee01977c"
							},
							"creationTimestamp": null
						},
						"spec": {
							"containers": [
								{
									"command": [
										"sh",
										"-c",
										"sleep 20;exit 0"
									],
									"image": "192.168.202.74:5000/user-images/deepo:v2.0",
									"name": "dgxtestsub2-container",
									"resources": {
										"limits": {
											"cpu": "1",
											"memory": "16Gi"
										}
									},
									"volumeMounts": [
										{
											"mountPath": "/userhome",
											"name": "mount-1574848403812"
										},
										{
											"mountPath": "/model-hub",
											"name": "mount-1574848403813"
										},
										{
											"mountPath": "/gdata",
											"name": "mount-1574848403814",
											"readOnly": true
										},
										{
											"mountPath": "/etc/hosts",
											"name": "mount-1574848403815",
											"readOnly": true
										}
									]
								}
							],
							"initContainers": [
								{
									"command": [
										"sh",
										"-c",
										"/app/poddiscovery"
									],
									"image": "192.168.202.74:5000/openi/poddiscovery:v0.0.12",
									"name": "dgxtestsub2init-container-0",
									"resources": {},
									"volumeMounts": [
										{
											"mountPath": "/etc/hosts",
											"name": "mount-1574848403815"
										},
										{
											"mountPath": "/etc/hosts_json.json",
											"name": "mount-1574848403816"
										}
									]
								}
							],
							"nodeSelector": {
								"resourceType": "dgx"
							},
							"restartPolicy": "Never",
							"schedulerName": "kube-batch",
							"serviceAccountName": "poddiscovery",
							"volumes": [
								{
									"hostPath": {
										"path": "/ghome/yangxzh"
									},
									"name": "mount-1574848403812"
								},
								{
									"hostPath": {
										"path": "/gmodel/yangxzh"
									},
									"name": "mount-1574848403813"
								},
								{
									"hostPath": {
										"path": "/gdata"
									},
									"name": "mount-1574848403814"
								},
								{
									"hostPath": {
										"path": "/ghome/yangxzh/share_hosts/c04f7550-10fb-11ea-b918-b9fdee01977c",
										"type": "FileOrCreate"
									},
									"name": "mount-1574848403815"
								},
								{
									"hostPath": {
										"path": "/ghome/yangxzh/share_hosts/c04f7550-10fb-11ea-b918-b9fdee01977c.json",
										"type": "FileOrCreate"
									},
									"name": "mount-1574848403816"
								}
							]
						}
					}
				}
			]
		}
	}
	`

	oldStr1 string = `{
		"apiVersion": "octopus.openi.pcl.cn/v1alpha1",
		"kind": "TaskSet",
		"metadata": {
			"creationTimestamp": "2019-11-28T07:46:06Z",
			"generation": 15,
			"labels": {
				"job-name": "dgxmultitest755234",
				"job-type": "dgx",
				"platform-group": "m4xnivpjx1i",
				"platform-user": "B4AE2839C90A14C75566B93E97E2287A"
			},
			"name": "c04f7550010fb011ea0b9180b9fdee01977c",
			"namespace": "default",
			"resourceVersion": "27239645",
			"selfLink": "/apis/octopus.openi.pcl.cn/v1alpha1/namespaces/default/tasksets/c04f7550010fb011ea0b9180b9fdee01977c",
			"uid": "2264a609-11b3-11ea-abb6-b4969137ef9a"
		},
		"spec": {
			"retryPolicy": {
				"maxRetryCount": 0,
				"retry": false
			},
			"roles": [
				{
					"completionPolicy": {
						"maxFailed": 1,
						"minSucceeded": 1
					},
					"eventPolicy": [],
					"name": "dgxtestsub1",
					"replicas": 1,
					"retryPolicy": {
						"maxRetryCount": 0,
						"retry": false
					},
					"template": {
						"metadata": {
							"annotations": {
								"scheduling.k8s.io/group-name": "c04f7550010fb011ea0b9180b9fdee01977c"
							},
							"creationTimestamp": null
						},
						"spec": {
							"containers": [
								{
									"command": [
										"sh",
										"-c",
										"sleep 10;sleep 10; "
									],
									"image": "192.168.202.74:5000/user-images/deepo:v2.0",
									"name": "dgxtestsub1-container",
									"resources": {
										"limits": {
											"cpu": "1",
											"memory": "16Gi",
											"nvidia.com/gpu": "1"
										}
									},
									"volumeMounts": [
										{
											"mountPath": "/userhome",
											"name": "mount-1574848403811"
										},
										{
											"mountPath": "/model-hub",
											"name": "mount-1574848403812"
										},
										{
											"mountPath": "/gdata",
											"name": "mount-1574848403813",
											"readOnly": true
										},
										{
											"mountPath": "/etc/hosts",
											"name": "mount-1574848403814",
											"readOnly": true
										}
									]
								}
							],
							"initContainers": [
								{
									"command": [
										"sh",
										"-c",
										"/app/poddiscovery"
									],
									"image": "192.168.202.74:5000/openi/poddiscovery:v0.0.12",
									"name": "dgxtestsub1init-container-0",
									"resources": {},
									"volumeMounts": [
										{
											"mountPath": "/etc/hosts",
											"name": "mount-1574848403814"
										},
										{
											"mountPath": "/etc/hosts_json.json",
											"name": "mount-1574848403815"
										}
									]
								}
							],
							"nodeSelector": {
								"resourceType": "dgx"
							},
							"restartPolicy": "Never",
							"schedulerName": "kube-batch",
							"serviceAccountName": "poddiscovery",
							"volumes": [
								{
									"hostPath": {
										"path": "/ghome/yangxzh"
									},
									"name": "mount-1574848403811"
								},
								{
									"hostPath": {
										"path": "/gmodel/yangxzh"
									},
									"name": "mount-1574848403812"
								},
								{
									"hostPath": {
										"path": "/gdata"
									},
									"name": "mount-1574848403813"
								},
								{
									"hostPath": {
										"path": "/ghome/yangxzh/share_hosts/c04f7550-10fb-11ea-b918-b9fdee01977c",
										"type": "FileOrCreate"
									},
									"name": "mount-1574848403814"
								},
								{
									"hostPath": {
										"path": "/ghome/yangxzh/share_hosts/c04f7550-10fb-11ea-b918-b9fdee01977c.json",
										"type": "FileOrCreate"
									},
									"name": "mount-1574848403815"
								}
							]
						}
					}
				},
				{
					"completionPolicy": {
						"maxFailed": 1,
						"minSucceeded": 1
					},
					"eventPolicy": [],
					"name": "dgxtestsub1001574130000069",
					"replicas": 1,
					"retryPolicy": {
						"maxRetryCount": 0,
						"retry": false
					},
					"template": {
						"metadata": {
							"annotations": {
								"scheduling.k8s.io/group-name": "c04f7550010fb011ea0b9180b9fdee01977c"
							},
							"creationTimestamp": null
						},
						"spec": {
							"containers": [
								{
									"command": [
										"sh",
										"-c",
										"sleep 10;sleep 10;"
									],
									"image": "192.168.202.74:5000/user-images/deepo:v2.0",
									"name": "dgxtestsub1001574130000069-container",
									"resources": {
										"limits": {
											"cpu": "1",
											"memory": "16Gi",
											"nvidia.com/gpu": "1"
										}
									},
									"volumeMounts": [
										{
											"mountPath": "/userhome",
											"name": "mount-1574848403812"
										},
										{
											"mountPath": "/model-hub",
											"name": "mount-1574848403813"
										},
										{
											"mountPath": "/gdata",
											"name": "mount-1574848403814",
											"readOnly": true
										},
										{
											"mountPath": "/etc/hosts",
											"name": "mount-1574848403815",
											"readOnly": true
										}
									]
								}
							],
							"initContainers": [
								{
									"command": [
										"sh",
										"-c",
										"/app/poddiscovery"
									],
									"image": "192.168.202.74:5000/openi/poddiscovery:v0.0.12",
									"name": "dgxtestsub1001574130000069init-container-0",
									"resources": {},
									"volumeMounts": [
										{
											"mountPath": "/etc/hosts",
											"name": "mount-1574848403815"
										},
										{
											"mountPath": "/etc/hosts_json.json",
											"name": "mount-1574848403816"
										}
									]
								}
							],
							"nodeSelector": {
								"resourceType": "dgx"
							},
							"restartPolicy": "Never",
							"schedulerName": "kube-batch",
							"serviceAccountName": "poddiscovery",
							"volumes": [
								{
									"hostPath": {
										"path": "/ghome/yangxzh"
									},
									"name": "mount-1574848403812"
								},
								{
									"hostPath": {
										"path": "/gmodel/yangxzh"
									},
									"name": "mount-1574848403813"
								},
								{
									"hostPath": {
										"path": "/gdata"
									},
									"name": "mount-1574848403814"
								},
								{
									"hostPath": {
										"path": "/ghome/yangxzh/share_hosts/c04f7550-10fb-11ea-b918-b9fdee01977c",
										"type": "FileOrCreate"
									},
									"name": "mount-1574848403815"
								},
								{
									"hostPath": {
										"path": "/ghome/yangxzh/share_hosts/c04f7550-10fb-11ea-b918-b9fdee01977c.json",
										"type": "FileOrCreate"
									},
									"name": "mount-1574848403816"
								}
							]
						}
					}
				},
				{
					"completionPolicy": {
						"maxFailed": 1,
						"minSucceeded": 1
					},
					"eventPolicy": [],
					"name": "dgxtestsub1001574130001069",
					"replicas": 1,
					"retryPolicy": {
						"maxRetryCount": 0,
						"retry": false
					},
					"template": {
						"metadata": {
							"annotations": {
								"scheduling.k8s.io/group-name": "c04f7550010fb011ea0b9180b9fdee01977c"
							},
							"creationTimestamp": null
						},
						"spec": {
							"containers": [
								{
									"command": [
										"sh",
										"-c",
										"sleep 10;sleep 10; "
									],
									"image": "192.168.202.74:5000/user-images/deepo:v2.0",
									"name": "dgxtestsub1001574130001069-container",
									"resources": {
										"limits": {
											"cpu": "1",
											"memory": "16Gi"
										}
									},
									"volumeMounts": [
										{
											"mountPath": "/userhome",
											"name": "mount-1574848403812"
										},
										{
											"mountPath": "/model-hub",
											"name": "mount-1574848403813"
										},
										{
											"mountPath": "/gdata",
											"name": "mount-1574848403814",
											"readOnly": true
										},
										{
											"mountPath": "/etc/hosts",
											"name": "mount-1574848403815",
											"readOnly": true
										}
									]
								}
							],
							"initContainers": [
								{
									"command": [
										"sh",
										"-c",
										"/app/poddiscovery"
									],
									"image": "192.168.202.74:5000/openi/poddiscovery:v0.0.12",
									"name": "dgxtestsub1001574130001069init-container-0",
									"resources": {},
									"volumeMounts": [
										{
											"mountPath": "/etc/hosts",
											"name": "mount-1574848403815"
										},
										{
											"mountPath": "/etc/hosts_json.json",
											"name": "mount-1574848403816"
										}
									]
								}
							],
							"nodeSelector": {
								"resourceType": "dgx"
							},
							"restartPolicy": "Never",
							"schedulerName": "kube-batch",
							"serviceAccountName": "poddiscovery",
							"volumes": [
								{
									"hostPath": {
										"path": "/ghome/yangxzh"
									},
									"name": "mount-1574848403812"
								},
								{
									"hostPath": {
										"path": "/gmodel/yangxzh"
									},
									"name": "mount-1574848403813"
								},
								{
									"hostPath": {
										"path": "/gdata"
									},
									"name": "mount-1574848403814"
								},
								{
									"hostPath": {
										"path": "/ghome/yangxzh/share_hosts/c04f7550-10fb-11ea-b918-b9fdee01977c",
										"type": "FileOrCreate"
									},
									"name": "mount-1574848403815"
								},
								{
									"hostPath": {
										"path": "/ghome/yangxzh/share_hosts/c04f7550-10fb-11ea-b918-b9fdee01977c.json",
										"type": "FileOrCreate"
									},
									"name": "mount-1574848403816"
								}
							]
						}
					}
				},
				{
					"completionPolicy": {
						"maxFailed": 1,
						"minSucceeded": 1
					},
					"eventPolicy": [],
					"name": "dgxtestsub1001574130002181",
					"replicas": 1,
					"retryPolicy": {
						"maxRetryCount": 0,
						"retry": false
					},
					"template": {
						"metadata": {
							"annotations": {
								"scheduling.k8s.io/group-name": "c04f7550010fb011ea0b9180b9fdee01977c"
							},
							"creationTimestamp": null
						},
						"spec": {
							"containers": [
								{
									"command": [
										"sh",
										"-c",
										"sleep 10;sleep 10; "
									],
									"image": "192.168.202.74:5000/user-images/deepo:v2.0",
									"name": "dgxtestsub1001574130002181-container",
									"resources": {
										"limits": {
											"cpu": "1",
											"memory": "16Gi"
										}
									},
									"volumeMounts": [
										{
											"mountPath": "/userhome",
											"name": "mount-1574848403812"
										},
										{
											"mountPath": "/model-hub",
											"name": "mount-1574848403813"
										},
										{
											"mountPath": "/gdata",
											"name": "mount-1574848403814",
											"readOnly": true
										},
										{
											"mountPath": "/etc/hosts",
											"name": "mount-1574848403815",
											"readOnly": true
										}
									]
								}
							],
							"initContainers": [
								{
									"command": [
										"sh",
										"-c",
										"/app/poddiscovery"
									],
									"image": "192.168.202.74:5000/openi/poddiscovery:v0.0.12",
									"name": "dgxtestsub1001574130002181init-container-0",
									"resources": {},
									"volumeMounts": [
										{
											"mountPath": "/etc/hosts",
											"name": "mount-1574848403815"
										},
										{
											"mountPath": "/etc/hosts_json.json",
											"name": "mount-1574848403816"
										}
									]
								}
							],
							"nodeSelector": {
								"resourceType": "dgx"
							},
							"restartPolicy": "Never",
							"schedulerName": "kube-batch",
							"serviceAccountName": "poddiscovery",
							"volumes": [
								{
									"hostPath": {
										"path": "/ghome/yangxzh"
									},
									"name": "mount-1574848403812"
								},
								{
									"hostPath": {
										"path": "/gmodel/yangxzh"
									},
									"name": "mount-1574848403813"
								},
								{
									"hostPath": {
										"path": "/gdata"
									},
									"name": "mount-1574848403814"
								},
								{
									"hostPath": {
										"path": "/ghome/yangxzh/share_hosts/c04f7550-10fb-11ea-b918-b9fdee01977c",
										"type": "FileOrCreate"
									},
									"name": "mount-1574848403815"
								},
								{
									"hostPath": {
										"path": "/ghome/yangxzh/share_hosts/c04f7550-10fb-11ea-b918-b9fdee01977c.json",
										"type": "FileOrCreate"
									},
									"name": "mount-1574848403816"
								}
							]
						}
					}
				},
				{
					"completionPolicy": {
						"maxFailed": 1,
						"minSucceeded": 1
					},
					"eventPolicy": [],
					"name": "dgxtestsub2",
					"replicas": 1,
					"retryPolicy": {
						"maxRetryCount": 0,
						"retry": false
					},
					"template": {
						"metadata": {
							"annotations": {
								"scheduling.k8s.io/group-name": "c04f7550010fb011ea0b9180b9fdee01977c"
							},
							"creationTimestamp": null
						},
						"spec": {
							"containers": [
								{
									"command": [
										"sh",
										"-c",
										"echo hello;sleep 20;exit 0"
									],
									"image": "192.168.202.74:5000/user-images/deepo:v2.0",
									"name": "dgxtestsub2-container",
									"resources": {
										"limits": {
											"cpu": "1",
											"memory": "16Gi"
										}
									},
									"volumeMounts": [
										{
											"mountPath": "/userhome",
											"name": "mount-1574848403812"
										},
										{
											"mountPath": "/model-hub",
											"name": "mount-1574848403813"
										},
										{
											"mountPath": "/gdata",
											"name": "mount-1574848403814",
											"readOnly": true
										},
										{
											"mountPath": "/etc/hosts",
											"name": "mount-1574848403815",
											"readOnly": true
										}
									]
								}
							],
							"initContainers": [
								{
									"command": [
										"sh",
										"-c",
										"/app/poddiscovery"
									],
									"image": "192.168.202.74:5000/openi/poddiscovery:v0.0.12",
									"name": "dgxtestsub2init-container-0",
									"resources": {},
									"volumeMounts": [
										{
											"mountPath": "/etc/hosts",
											"name": "mount-1574848403815"
										},
										{
											"mountPath": "/etc/hosts_json.json",
											"name": "mount-1574848403816"
										}
									]
								}
							],
							"nodeSelector": {
								"resourceType": "dgx"
							},
							"restartPolicy": "Never",
							"schedulerName": "kube-batch",
							"serviceAccountName": "poddiscovery",
							"volumes": [
								{
									"hostPath": {
										"path": "/ghome/yangxzh"
									},
									"name": "mount-1574848403812"
								},
								{
									"hostPath": {
										"path": "/gmodel/yangxzh"
									},
									"name": "mount-1574848403813"
								},
								{
									"hostPath": {
										"path": "/gdata"
									},
									"name": "mount-1574848403814"
								},
								{
									"hostPath": {
										"path": "/ghome/yangxzh/share_hosts/c04f7550-10fb-11ea-b918-b9fdee01977c",
										"type": "FileOrCreate"
									},
									"name": "mount-1574848403815"
								},
								{
									"hostPath": {
										"path": "/ghome/yangxzh/share_hosts/c04f7550-10fb-11ea-b918-b9fdee01977c.json",
										"type": "FileOrCreate"
									},
									"name": "mount-1574848403816"
								}
							]
						}
					}
				}
			]
		}
	}
	`

	newStr string = `{
		"apiVersion": "octopus.openi.pcl.cn/v1alpha1",
		"kind": "TaskSet",
		"metadata": {
			"creationTimestamp": "2019-11-28T07:46:06Z",
			"generation": 15,
			"labels": {
				"job-name": "dgxmultitest755234",
				"job-type": "dgx",
				"platform-group": "m4xnivpjx1i",
				"platform-user": "B4AE2839C90A14C75566B93E97E2287A"
			},
			"name": "c04f7550010fb011ea0b9180b9fdee01977c",
			"namespace": "default",
			"resourceVersion": "27239645",
			"selfLink": "/apis/octopus.openi.pcl.cn/v1alpha1/namespaces/default/tasksets/c04f7550010fb011ea0b9180b9fdee01977c",
			"uid": "2264a609-11b3-11ea-abb6-b4969137ef9a"
		},
		"spec": {
			"retryPolicy": {
				"maxRetryCount": 0,
				"retry": false
			},
			"roles": [
				{
					"completionPolicy": {
						"maxFailed": 1,
						"minSucceeded": 1
					},
					"eventPolicy": [],
					"name": "dgxtestsub1",
					"replicas": 1,
					"retryPolicy": {
						"maxRetryCount": 0,
						"retry": false
					},
					"template": {
						"metadata": {
							"annotations": {
								"scheduling.k8s.io/group-name": "c04f7550010fb011ea0b9180b9fdee01977c"
							},
							"creationTimestamp": "xxxxxaaaaaaaaaaa"
						},
						"spec": {
							"containers": [
								{
									"command": [
										"sh",
										"-c",
										"sleep 10;sleep 111111;sleep 10; "
									],
									"image": "192.168.202.74:5000/user-images/deepo:v2.0",
									"name": "dgxtestsub1-container",
									"resources": {
										"limits": {
											"cpu": "1",
											"memory": "16Gi",
											"nvidia.com/gpu": "1"
										}
									},
									"volumeMounts": [
										{
											"mountPath": "/userhome",
											"name": "mount-1574848403811"
										},
										{
											"mountPath": "/model-hub",
											"name": "mount-1574848403812"
										},
										{
											"mountPath": "/model-hub1234",
											"name": "mount-15748484038121234"
										},
										{
											"mountPath": "/gdata",
											"name": "mount-1574848403813",
											"readOnly": true
										},
										{
											"mountPath": "/etc/hosts",
											"name": "mount-1574848403814",
											"readOnly": true
										}
									]
								}
							],
							"initContainers": [
								{
									"command": [
										"sh",
										"-c",
										"/app/poddiscovery"
									],
									"image": "192.168.202.74:5000/openi/poddiscovery:v0.0.12",
									"name": "dgxtestsub1init-container-0",
									"resources": {},
									"volumeMounts": [
										{
											"mountPath": "/etc/hosts",
											"name": "mount-1574848403814"
										},
										{
											"mountPath": "/etc/hosts_json.json",
											"name": "mount-1574848403815"
										}
									]
								}
							],
							"nodeSelector": {
								"resourceType": "dgx"
							},
							"restartPolicy": "Never",
							"schedulerName": "kube-batch",
							"serviceAccountName": "poddiscovery",
							"volumes": [
								{
									"hostPath": {
										"path": "/ghome/yangxzh"
									},
									"name": "mount-1574848403811"
								},
								{
									"hostPath": {
										"path": "/gmodel/yangxzh"
									},
									"name": "mount-1574848403812"
								},
								{
									"hostPath": {
										"path": "/gdata"
									},
									"name": "mount-1574848403813"
								},
								{
									"hostPath": {
										"path": "/ghome/yangxzh/share_hosts/c04f7550-10fb-11ea-b918-b9fdee01977c",
										"type": "FileOrCreate"
									},
									"name": "mount-1574848403814"
								},
								{
									"hostPath": {
										"path": "/ghome/yangxzh/share_hosts/c04f7550-10fb-11ea-b918-b9fdee01977c.json",
										"type": "FileOrCreate"
									},
									"name": "mount-1574848403815"
								}
							]
						}
					}
				},
				{
					"completionPolicy": {
						"maxFailed": 1,
						"minSucceeded": 1
					},
					"eventPolicy": [],
					"name": "dgxtestsub1001574130000069",
					"replicas": 1,
					"retryPolicy": {
						"maxRetryCount": 0,
						"retry": false
					},
					"template": {
						"metadata": {
							"annotations": {
								"scheduling.k8s.io/group-name": "c04f7550010fb011ea0b9180b9fdee01977c"
							},
							"creationTimestamp": null
						},
						"spec": {
							"containers": [
								{
									"command": [
										"sh",
										"-c",
										"sleep 10;sleep 10;"
									],
									"image": "192.168.202.74:5000/user-images/deepo:v2.0",
									"name": "dgxtestsub1001574130000069-container",
									"resources": {
										"limits": {
											"cpu": "1",
											"memory": "16Gi",
											"nvidia.com/gpu": "1"
										}
									},
									"volumeMounts": [
										{
											"mountPath": "/userhome",
											"name": "mount-1574848403812"
										},
										{
											"mountPath": "/model-hub",
											"name": "mount-1574848403813"
										},
										{
											"mountPath": "/gdata",
											"name": "mount-1574848403814",
											"readOnly": true
										},
										{
											"mountPath": "/etc/hosts",
											"name": "mount-1574848403815",
											"readOnly": true
										}
									]
								}
							],
							"initContainers": [
								{
									"command": [
										"sh",
										"-c",
										"/app/poddiscovery"
									],
									"image": "192.168.202.74:5000/openi/poddiscovery:v0.0.12",
									"name": "dgxtestsub1001574130000069init-container-0",
									"resources": {},
									"volumeMounts": [
										{
											"mountPath": "/etc/hosts",
											"name": "mount-1574848403815"
										},
										{
											"mountPath": "/etc/hosts_json.json",
											"name": "mount-1574848403816"
										}
										{
											"mountPath": "/etc/hosts_json.json11111",
											"name": "mount-15748484038161111"
										}
									]
								}
							],
							"nodeSelector": {
								"resourceType": "dgx"
							},
							"restartPolicy": "Never",
							"schedulerName": "kube-batch",
							"serviceAccountName": "poddiscovery",
							"volumes": [
								{
									"hostPath": {
										"path": "/ghome/yangxzh"
									},
									"name": "mount-1574848403812"
								},
								{
									"hostPath": {
										"path": "/gmodel/yangxzh"
									},
									"name": "mount-1574848403813"
								},
								{
									"hostPath": {
										"path": "/gdata"
									},
									"name": "mount-1574848403814"
								},
								{
									"hostPath": {
										"path": "/ghome/yangxzh/share_hosts/c04f7550-10fb-11ea-b918-b9fdee01977c",
										"type": "FileOrCreate"
									},
									"name": "mount-1574848403815"
								},
								{
									"hostPath": {
										"path": "/ghome/yangxzh/share_hosts/c04f7550-10fb-11ea-b918-b9fdee01977c.json",
										"type": "FileOrCreate"
									},
									"name": "mount-1574848403816"
								}
							]
						}
					}
				},
				{
					"completionPolicy": {
						"maxFailed": 1,
						"minSucceeded": 1
					},
					"eventPolicy": [],
					"name": "dgxtestsub1001574130001069",
					"replicas": 1,
					"retryPolicy": {
						"maxRetryCount": 0,
						"retry": false
					},
					"template": {
						"metadata": {
							"annotations": {
								"scheduling.k8s.io/group-name": "c04f7550010fb011ea0b9180b9fdee01977c"
							},
							"creationTimestamp": null
						},
						"spec": {
							"containers": [
								{
									"command": [
										"sh",
										"-c",
										"sleep 10;sleep 10; "
									],
									"image": "192.168.202.74:5000/user-images/deepo:v2.0",
									"name": "dgxtestsub1001574130001069-container",
									"resources": {
										"limits": {
											"cpu": "1",
											"memory": "16Gi"
										}
									},
									"volumeMounts": [
										{
											"mountPath": "/userhome",
											"name": "mount-1574848403812"
										},
										{
											"mountPath": "/model-hub",
											"name": "mount-1574848403813"
										},
										{
											"mountPath": "/gdata",
											"name": "mount-1574848403814",
											"readOnly": true
										},
										{
											"mountPath": "/etc/hosts",
											"name": "mount-1574848403815",
											"readOnly": true
										}
									]
								}
							],
							"initContainers": [
								{
									"command": [
										"sh",
										"-c",
										"/app/poddiscovery"
									],
									"image": "192.168.202.74:5000/openi/poddiscovery:v0.0.12",
									"name": "dgxtestsub1001574130001069init-container-0",
									"resources": {},
									"volumeMounts": [
										{
											"mountPath": "/etc/hosts",
											"name": "mount-1574848403815"
										},
										{
											"mountPath": "/etc/hosts_json.json",
											"name": "mount-1574848403816"
										}
									]
								}
							],
							"nodeSelector": {
								"resourceType": "dgx"
							},
							"restartPolicy": "Never",
							"schedulerName": "kube-batch",
							"serviceAccountName": "poddiscovery",
							"volumes": [
								{
									"hostPath": {
										"path": "/ghome/yangxzh"
									},
									"name": "mount-1574848403812"
								},
								{
									"hostPath": {
										"path": "/gmodel/yangxzh"
									},
									"name": "mount-1574848403813"
								},
								{
									"hostPath": {
										"path": "/gdata"
									},
									"name": "mount-1574848403814"
								},
								{
									"hostPath": {
										"path": "/ghome/yangxzh/share_hosts/c04f7550-10fb-11ea-b918-b9fdee01977c",
										"type": "FileOrCreate"
									},
									"name": "mount-1574848403815"
								},
								{
									"hostPath": {
										"path": "/ghome/yangxzh/share_hosts/c04f7550-10fb-11ea-b918-b9fdee01977c.json",
										"type": "FileOrCreate"
									},
									"name": "mount-1574848403816"
								}
							]
						}
					}
				},
				{
					"completionPolicy": {
						"maxFailed": 1,
						"minSucceeded": 1，
						"minSucceeded1111": 11111
					},
					"eventPolicy": [],
					"name": "dgxtestsub1001574130002181",
					"replicas": 1,
					"retryPolicy": {
						"maxRetryCount": 0,
						"retry": false
					},
					"template": {
						"metadata": {
							"annotations": {
								"scheduling.k8s.io/group-name": "c04f7550010fb011ea0b9180b9fdee01977c"
							},
							"creationTimestamp": null
						},
						"spec": {
							"containers": [
								{
									"command": [
										"sh",
										"-c",
										"sleep 10;sleep 10; "
									],
									"image": "192.168.202.74:5000/user-images/deepo:v2.0",
									"name": "dgxtestsub1001574130002181-container",
									"resources": {
										"limits": {
											"cpu": "1",
											"memory": "16Gi"
										}
									},
									"volumeMounts": [
										{
											"mountPath": "/userhome",
											"name": "mount-1574848403812"
										},
										{
											"mountPath": "/model-hub",
											"name": "mount-1574848403813"
										},
										{
											"mountPath": "/gdata",
											"name": "mount-1574848403814",
											"readOnly": true
										},
										{
											"mountPath": "/etc/hosts",
											"name": "mount-1574848403815",
											"readOnly": true
										}
									]
								}
							],
							"initContainers": [
								{
									"command": [
										"sh",
										"-c",
										"/app/poddiscovery"
									],
									"image": "192.168.202.74:5000/openi/poddiscovery:v0.0.12",
									"name": "dgxtestsub1001574130002181init-container-0",
									"resources": {},
									"volumeMounts": [
										{
											"mountPath": "/etc/hosts",
											"name": "mount-1574848403815"
										},
										{
											"mountPath": "/etc/hosts_json.json",
											"name": "mount-1574848403816"
										}
									]
								}
							],
							"nodeSelector": {
								"resourceType": "dgx"
							},
							"restartPolicy": "Never",
							"schedulerName": "kube-batch",
							"serviceAccountName": "poddiscovery",
							"volumes": [
								{
									"hostPath": {
										"path": "/ghome/yangxzh"
									},
									"name": "mount-1574848403812"
								},
								{
									"hostPath": {
										"path": "/gmodel/yangxzh"
									},
									"name": "mount-1574848403813"
								},
								{
									"hostPath": {
										"path": "/gdata"
									},
									"name": "mount-1574848403814"
								},
								{
									"hostPath": {
										"path": "/ghome/yangxzh/share_hosts/c04f7550-10fb-11ea-b918-b9fdee01977c",
										"type": "FileOrCreate"
									},
									"name": "mount-1574848403815"
								},
								{
									"hostPath": {
										"path": "/ghome/yangxzh/share_hosts/c04f7550-10fb-11ea-b918-b9fdee01977c.json",
										"type": "FileOrCreate"
									},
									"name": "mount-1574848403816"
								}
							]
						}
					}
				},
				{
					"completionPolicy": {
						"maxFailed": 1,
						"minSucceeded": 1
					},
					"eventPolicy": [],
					"name": "dgxtestsub2",
					"replicas": 1,
					"retryPolicy": {
						"maxRetryCount": 0,
						"retry": false
					},
					"template": {
						"metadata": {
							"annotations": {
								"scheduling.k8s.io/group-name": "c04f7550010fb011ea0b9180b9fdee01977c"
							},
							"creationTimestamp": null
						},
						"spec": {
							"containers": [
								{
									"command": [
										"sh",
										"-c",
										"sleep 10;sleep 10; "
									],
									"image": "192.168.202.74:5000/user-images/deepo:v2.0",
									"name": "dgxtestsub2-container",
									"resources": {
										"limits": {
											"cpu": "1",
											"memory": "16Gi"
										}
									},
									"volumeMounts": [
										{
											"mountPath": "/userhome",
											"name": "mount-1574848403812"
										},
										{
											"mountPath": "/model-hub",
											"name": "mount-1574848403813"
										},
										{
											"mountPath": "/gdata",
											"name": "mount-1574848403814",
											"readOnly": true
										},
										{
											"mountPath": "/etc/hosts",
											"name": "mount-1574848403815",
											"readOnly": true
										}
									]
								}
							],
							"initContainers": [
								{
									"command": [
										"sh",
										"-c",
										"/app/poddiscovery"
									],
									"image": "192.168.202.74:5000/openi/poddiscovery:v0.0.12",
									"name": "dgxtestsub2init-container-0",
									"resources": {},
									"volumeMounts": [
										{
											"mountPath": "/etc/hosts",
											"name": "mount-1574848403815"
										},
										{
											"mountPath": "/etc/hosts_json.json",
											"name": "mount-1574848403816"
										}
									]
								}
							],
							"nodeSelector": {
								"resourceType": "dgx"
							},
							"restartPolicy": "Never",
							"schedulerName": "kube-batch",
							"serviceAccountName": "poddiscovery",
							"volumes": [
								{
									"hostPath": {
										"path": "/ghome/yangxzh"
									},
									"name": "mount-1574848403812"
								},
								{
									"hostPath": {
										"path": "/gmodel/yangxzh"
									},
									"name": "mount-1574848403813"
								},
								{
									"hostPath": {
										"path": "/gdata"
									},
									"name": "mount-1574848403814"
								},
								{
									"hostPath": {
										"path": "/ghome/yangxzh/share_hosts/c04f7550-10fb-11ea-b918-b9fdee01977c",
										"type": "FileOrCreate"
									},
									"name": "mount-1574848403815"
								},
								{
									"hostPath": {
										"path": "/ghome/yangxzh/share_hosts/c04f7550-10fb-11ea-b918-b9fdee01977c.json",
										"type": "FileOrCreate"
									},
									"name": "mount-1574848403816"
								}
							]
						}
					}
				}
			]
		}
	}
	`
	diffResult string = `{"spec": {"roles": [{"template": {"metadata": {"creationTimestamp": "xxxxxaaaaaaaaaaa"}, "spec": {"containers": [{"command": ["sh", "-c", "sleep 10;sleep 111111;sleep 10; "], "volumeMounts": [{"mountPath": "/model-hub1234", "name": "mount-15748484038121234"}]}]}}}, {"template": {"spec": {"initContainers": [{"volumeMounts": [{"mountPath": "/etc/hosts_json.json11111", "name": "mount-15748484038161111"}]}]}}}, {"completionPolicy": {"minSucceeded1111": 11111}}]}}`
)

func TestIsNewJSONIncrFromOldJSON(t *testing.T) {
	isSubTree := IsNewJSONIncrFromOldJSON(oldStr, newStr)
	if isSubTree == false {
		t.Error("TestIsNewJSONIncrFromOldJSON ERROR!!!!!")
	}
}

func Test1IsNewJSONIncrFromOldJSON(t *testing.T) {
	isSubTree := IsNewJSONIncrFromOldJSON(oldStr, oldStr1)
	if isSubTree == false {
		t.Error("TestIsNewJSONIncrFromOldJSON ERROR!!!!!")
	}
}

func TestDiff(t *testing.T) {
	diff := Diff(oldStr, newStr)
	if diff != diffResult {
		t.Error("TestDiff ERROR!!!!!")
	}
}
