// Copyright (c) Microsoft Corporation
// All rights reserved.
//
// MIT License
//
// Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated
// documentation files (the "Software"), to deal in the Software without restriction, including without limitation
// the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and
// to permit persons to whom the Software is furnished to do so, subject to the following conditions:
// The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING
// BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
// NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
import * as apiService from '@/services/api';

export default {
    namespace: 'services',

    state: {
        loading:true,
        data:[]
    },

    effects: {
        *loadServices({payload}, { call, put }) {

            const onFailed = payload&&payload.onFailed?payload.onFailed:function onFailed(){};

            const servicesResponse = yield call(apiService.getServices);

            if(servicesResponse.success) {
                //console.log("getServices", servicesResponse);

                let items = servicesResponse.services.nodes;
                let nodeList = [];
                for (let item of items) {
                    nodeList.push(item);
                }


                let podsItems = servicesResponse.services.pods;
                let nodeDic = [];

                for (let pod of podsItems) {
                    let nodeName = pod.spec.nodeName;
                    if (nodeDic[nodeName] == null) {
                        nodeDic[nodeName] = [];
                    }
                    nodeDic[nodeName].push(pod);
                }

                let services = [];
                let index = 0;
                for (let node of nodeList) {
                    index++;
                    if (nodeDic[node.metadata.name] === undefined) {
                        nodeDic[node.metadata.name] = [];
                    }


                    let metaDataNode = node.metadata;


                    let serviceRecord = {
                        key: index,
                        nodeName: metaDataNode.name,
                        nodeUrl: "/openi/admin/hardware/detail?instance=" + metaDataNode.name,
                        roles: [],
                        services: [],
                    };

                    for (let labelKey in metaDataNode.labels) {
                        if (labelKey.indexOf('kubernetes') === -1) {
                            let labelStr = labelKey;
                            if (metaDataNode.labels[labelKey] !== 'true') {
                                labelStr += ': ' + metaDataNode.labels[labelKey];
                            }

                            serviceRecord.roles.push(labelStr);
                        }
                    }

                    let podList = nodeDic[node.metadata.name];

                    for (let j = 0; j < podList.length; j++) {
                        let pod = podList[j].metadata;
                        let colorString = "white";
                        let status = podList[j].status;
                        if (status.phase === "Pending") {
                            colorString = "red";
                        } else if (status.phase === "Running") {
                            colorString = "red";
                            for (let k = 0; k < status.conditions.length; k++) {
                                let cond = status.conditions[k];
                                if (cond.type === "Ready" && cond.status === "True") {
                                    let warning = false;
                                    // TODO: Insert code to detect warnings.
                                    if (warning === true) {
                                        colorString = "yellow";
                                    } else {
                                        colorString = "green";
                                    }
                                    break;
                                }
                            }
                        } else if (status.phase === "Succeeded") {
                            colorString = "green";
                        } else {
                            colorString = "red";
                        }

                        let servicePod = {
                            name: pod.name,
                            labelColor: colorString,
                            podUrl: ''
                        };

                        serviceRecord.services.push(servicePod);
                    }

                    services.push(serviceRecord);
                }

                //console.log("ServiceRecords", services);

                yield put({
                    type: 'updateServices',
                    payload: {loading: false, data: services},
                });
            }else{
                yield put({
                    type: 'updateServices',
                    payload: {loading: false, data: []},
                });

                onFailed && onFailed()
            }
        }
    },
    reducers:{
        updateServices(state,{payload}){
            return {
                ...state,
                ...payload
            }
        }
    }
}
