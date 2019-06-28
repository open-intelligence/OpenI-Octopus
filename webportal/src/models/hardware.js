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
import { getAuthority } from '@/utils/authority';

//idPrefixes = ["ip","machine","cpu", "mem", "gpu", "gpumem", "disk", "eth"];

const getStatus = (percentage) => {
    if (percentage < 10) {
        return 'success';
    } else if (percentage >= 10 && percentage < 90) {
        return 'warning';
    } else if (percentage >= 90) {
        return 'error';
    }
};

export default {
    namespace: 'hardware',

    state: {
        admin:false,
        loading:true,
        data:[]
    },

    effects: {
        *loadData({payload}, { call, put }) {

            const onFailed = payload&&payload.onFailed?payload.onFailed:function onFailed(){};

            const currentUser = getAuthority();

            if(!currentUser.admin)
            {
                yield put({
                    type: 'isAdmin',
                    payload: {admin:false,loading: false, data: []},
                });
            }else {

                let HarewareInfoDic = {};

                const response = yield call(apiService.loadHardwareInfo);

                if(response.success)
                {
                    const hardwareInfo = response.hardwareInfo;

                    const {
                        Instances,
                        CpuData,
                        MemUsedData,
                        MemTotalData,
                        GPUData,
                        GPUMemData,
                        DiskReadBytesData,
                        DiskWrittenBytesData,
                        EthRecievedBytesData,
                        EthSentBytesData,
                    } = hardwareInfo;

                    for (let i = 0; i < Instances.length; i++) {
                        let instanceIp = Instances[i].metric.instance;
                        let machineName = Instances[i].metric.nodename;
                        HarewareInfoDic[instanceIp] = {
                            key: i + 1,
                            ip: instanceIp,
                            ipNodeUrl: "/openi/admin/hardware/detail?instance=" + instanceIp,
                            machine: machineName,
                            cpu: {status: 'default', percent: "NaN"},
                            mem: {status: 'default', percent: "NaN"},
                            gpu: {status: 'default', percent: "NaN"},
                            gpumem: {status: 'default', percent: "NaN"},
                            disk: {status: 'default', percent: "NaN"},
                            eth: {status: 'default', percent: "NaN"}
                        };
                    }

                    for (let i = 0; i < CpuData.length; i++) {
                        const item = CpuData[i];
                        let instanceIp = item.metric.instance;
                        const percentage = parseFloat(item.values[0][1]);
                        HarewareInfoDic[instanceIp]['cpu']['percent'] = percentage.toFixed(3) + "%";
                        HarewareInfoDic[instanceIp]['cpu']['status'] = getStatus(percentage);
                    }

                    let dictOfMemUsed = {};
                    for (let i = 0; i < MemUsedData.length; i++) {
                        const item = MemUsedData[i];
                        dictOfMemUsed[item.metric.instance] = item.values[0][1];
                    }

                    for (let i = 0; i < MemTotalData.length; i++) {
                        const item = MemTotalData[i];
                        let instanceIp = item.metric.instance;
                        const percentage = dictOfMemUsed[item.metric.instance] / item.values[0][1] * 100;
                        HarewareInfoDic[instanceIp]['mem']['percent'] = percentage.toFixed(3) + "%";
                        HarewareInfoDic[instanceIp]['mem']['status'] = getStatus(percentage);
                    }

                    for (let i = 0; i < GPUData.length; i++) {
                        const item = GPUData[i];
                        let instanceIp = item.metric.instance;
                        const percentage = parseFloat(item.values[0][1]);
                        HarewareInfoDic[instanceIp]['gpu']['percent'] = percentage.toFixed(3) + "%";
                        HarewareInfoDic[instanceIp]['gpu']['status'] = getStatus(percentage);
                    }

                    for (let i = 0; i < GPUMemData.length; i++) {
                        const item = GPUMemData[i];
                        let instanceIp = item.metric.instance;
                        const percentage = parseFloat(item.values[0][1]);
                        HarewareInfoDic[instanceIp]['gpumem']['percent'] = percentage.toFixed(3) + "%";
                        HarewareInfoDic[instanceIp]['gpumem']['status'] = getStatus(percentage);
                    }

                    let dictOfDiskBytesRead = {};
                    for (let i = 0; i < DiskReadBytesData.length; i++) {
                        const item = DiskReadBytesData[i];
                        dictOfDiskBytesRead[item.metric.instance] = item.values[0][1];
                    }

                    for (let i = 0; i < DiskWrittenBytesData.length; i++) {
                        const item = DiskWrittenBytesData[i];
                        let instanceIp = item.metric.instance;
                        const diskBytesRead = dictOfDiskBytesRead[item.metric.instance];
                        const diskBytesWritten = item.values[0][1];
                        if (diskBytesRead && diskBytesWritten) {
                            const p1 = Math.min(1, (diskBytesRead / 1024 / 1024) / 500) * 100;
                            const p2 = Math.min(1, (diskBytesWritten / 1024 / 1024) / 500) * 100;
                            const percentage = Math.max(p1, p2);

                            HarewareInfoDic[instanceIp]['disk']['percent'] = percentage.toFixed(3) + "%";
                            HarewareInfoDic[instanceIp]['disk']['status'] = getStatus(percentage);
                        }
                    }

                    let dictOfEthBytesRecieved = {};
                    for (let i = 0; i < EthRecievedBytesData.length; i++) {
                        const item = EthRecievedBytesData[i];
                        dictOfEthBytesRecieved[item.metric.instance] = item.values[0][1];
                    }

                    for (let i = 0; i < EthSentBytesData.length; i++) {
                        const item = EthSentBytesData[i];
                        let instanceIp = item.metric.instance;
                        const ethBytesReceived = dictOfEthBytesRecieved[item.metric.instance];
                        const ethBytesSent = item.values[0][1];
                        if (ethBytesReceived && ethBytesSent) {
                            const p1 = Math.min(1, (ethBytesReceived / 1024 / 1024) / 100) * 100;
                            const p2 = Math.min(1, (ethBytesSent / 1024 / 1024) / 100) * 100;
                            const percentage = Math.max(p1, p2);

                            HarewareInfoDic[instanceIp]['eth']['percent'] = percentage.toFixed(3) + "%";
                            HarewareInfoDic[instanceIp]['eth']['status'] = getStatus(percentage);
                        }
                    }

                    //console.log("queryHardware",HarewareInfoDic,response);

                    yield put({
                        type: 'updateHarewareInfo',
                        payload: {loading: false, data: Object.values(HarewareInfoDic)},
                    });
                }else{
                    yield put({
                        type: 'updateHarewareInfo',
                        payload: {loading: false, data: []},
                    });

                    onFailed && onFailed();
                }
            }
        }
    },

    reducers:{
        isAdmin(state,{payload}){
            return {
                ...state,
                ...payload
            }
        },
        updateHarewareInfo(state,{payload}){
            return {
                ...state,
                ...payload
            }
        }
    },
}
