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

package discovery

import (
	typeTaskSet "scheduler/pkg/crd/apis/taskset/v1alpha1"
	electionClient "scheduler/pkg/poddiscovery/leaderelection"
	"time"

	jsoniter "github.com/json-iterator/go"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

func (d *Discovery) getTaskSet() (taskset *typeTaskSet.TaskSet, err error) {

	for i := 0; i < 3; i++ {

		taskset, err = d.tsClient.OctopusV1alpha1().TaskSets(d.namespace).Get(d.taskset, metav1.GetOptions{})

		if err != nil {
			time.Sleep(time.Second * time.Duration(3))
			continue
		}
		break
	}

	return
}

func (d *Discovery) getPodIPPairs() (map[string]string, error) {

	taskset, err := d.getTaskSet()

	if err != nil {
		return nil, err
	}

	d.cache = taskset

	pairs := map[string]string{}

	for i := 0; i < len(taskset.Spec.Roles); i++ {
		role := &taskset.Spec.Roles[i]
		replicas := int(role.Replicas)
		for id := 0; id < replicas; id++ {
			host := genHostName(taskset.Name, role.Name, id)
			pairs[host] = ""
		}
	}

	if nil == taskset.Status {
		return pairs, nil
	}

	self := genHostName(taskset.Name, d.role, d.replicaIndex)

	for i := 0; i < len(taskset.Status.TaskRoleStatus); i++ {
		status := &taskset.Status.TaskRoleStatus[i]
		for k := 0; k < len(status.ReplicaStatuses); k++ {
			replicaStatus := &status.ReplicaStatuses[k]
			host := genHostName(taskset.Name, status.Name, int(replicaStatus.Index))
			if host == self && "" == replicaStatus.PodIP {
				pairs[host] = d.localIP
			} else {
				pairs[host] = replicaStatus.PodIP //cluster ip
			}

		}
	}

	return pairs, nil

}

func (d *Discovery) diff(hostsIPPairsInFile map[string]string) (bool, map[string]string) {

	needUpdate := false

	pairs := map[string]string{}

	for host, ip := range hostsIPPairsInFile {
		pairs[host] = ip
	}

	for host, ip := range d.ipPairs {
		if ip == "" {
			continue
		}

		if ip != hostsIPPairsInFile[host] {
			pairs[host] = ip
			needUpdate = true
		}
	}

	return needUpdate, pairs
}

func (d *Discovery) checkDiff() (bool, map[string]string, error) {
	hostsJSON, err := readJSONHosts()

	if err != nil {
		return false, nil, err
	}

	var json = jsoniter.ConfigCompatibleWithStandardLibrary

	hostsIPPairsInFile := map[string]string{}

	err = json.Unmarshal(hostsJSON, &hostsIPPairsInFile)

	if nil != err {
		hostsIPPairsInFile = map[string]string{}
	}

	needUpdate, ipPairs := d.diff(hostsIPPairsInFile)

	return needUpdate, ipPairs, nil

}

func (d *Discovery) onStartLeading() (bool, error) {

	needUpdate, ipPairs, err := d.checkDiff()

	if err != nil {

		return false, err
	}

	if false == needUpdate {
		return false, nil
	}

	var json = jsoniter.ConfigCompatibleWithStandardLibrary

	buf, err := json.Marshal(ipPairs)

	if err != nil {
		return false, err
	}

	err = writeJSONHosts(buf)

	if err != nil {
		return false, err
	}

	err = writeHostIPPairs(ipPairs)

	if err != nil {
		return false, err
	}

	if true == d.isCompleted(ipPairs) {

		return true, nil
	}

	return false, nil
}

func (d *Discovery) isCompleted(ipPairs map[string]string) bool {

	fullPairs := map[string]bool{}

	taskset := d.cache

	for i := 0; i < len(taskset.Spec.Roles); i++ {
		role := &taskset.Spec.Roles[i]
		replicas := int(role.Replicas)
		for id := 0; id < replicas; id++ {
			host := genHostName(taskset.Name, role.Name, id)
			fullPairs[host] = false
		}
	}

	for host, ip := range ipPairs {
		if ip != "" {
			fullPairs[host] = true
		}
	}

	completed := true

	for _, exist := range fullPairs {
		if false == exist {
			completed = false
			break
		}
	}

	return completed
}

func (d *Discovery) getClient() *electionClient.CoordinationClient {
	if nil != d.coClientV1 {

		return d.coClientV1
	}
	return d.coClientBeta
}

func (d *Discovery) releaseLock() error {

	lease, err := d.getClient().Leases(d.namespace).Get(d.taskset, metav1.GetOptions{})

	if err != nil {
		return err
	}

	lease.Spec.HolderIdentity = nil

	_, err = d.getClient().Leases(d.namespace).Update(lease)

	return err
}

func (d *Discovery) deleteLock() {
	d.getClient().Leases(d.namespace).Delete(d.taskset, &metav1.DeleteOptions{})
}
