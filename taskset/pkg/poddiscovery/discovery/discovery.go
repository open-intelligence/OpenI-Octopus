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
	"context"
	"fmt"
	"os"
	libClientsets "scheduler/pkg/crd/generated/clientset/versioned"
	"scheduler/pkg/poddiscovery/leaderelection"
	leaselock "scheduler/pkg/poddiscovery/leaderelection/leaselock"
	libTaskSetController "scheduler/pkg/tasksetcontroller/controller"
	"strings"
	"time"

	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/rest"
)

//NewPodDiscovery init the poddiscovery component
func NewPodDiscovery(config *rest.Config) *Discovery {

	disc := &Discovery{
		config:       config,
		coClientV1:   leaderelection.NewCoordinationClient(config, "v1"),
		coClientBeta: leaderelection.NewCoordinationClient(config, "v1beta1"),
		tsClient:     libClientsets.NewForConfigOrDie(config),
		completed:    false,
	}

	disc.namespace = os.Getenv(libTaskSetController.EnvNameNamespace)

	disc.taskset = os.Getenv(libTaskSetController.EnvNameTaskSetName)

	disc.role = os.Getenv(libTaskSetController.EnvNameTaskRoleName)

	disc.replicaIndex = os.Getenv(libTaskSetController.EnvNameTaskRoleReplicaIndex)

	disc.localIP = getlocalIP()

	// the identity for election

	disc.identity = genHostName(disc.taskset, disc.role, disc.replicaIndex)

	_, err1 := disc.coClientV1.Leases(disc.namespace).Get(disc.taskset, metav1.GetOptions{})

	_, err2 := disc.coClientBeta.Leases(disc.namespace).Get(disc.taskset, metav1.GetOptions{})

	if err1 != nil && nil == err2 {
		disc.coClientV1 = nil
	} else if err1 == nil {
		disc.coClientBeta = nil
	} else {
		if strings.Contains(fmt.Sprintf("%v", err1), "could not find") {
			disc.coClientV1 = nil
		} else {
			disc.coClientBeta = nil
		}
	}

	disc.leaseLock = &leaselock.LeaseLock{
		LeaseMeta: metav1.ObjectMeta{
			Namespace: disc.namespace,
			Name:      disc.taskset,
		},
		Client: disc.getClient(),
		LockConfig: leaselock.ResourceLockConfig{
			Identity: disc.identity,
		},
	}

	pairs, err := disc.getPodIPPairs()

	if err != nil {
		panic(err)
	}

	disc.ipPairs = pairs

	return disc
}

//Run starts to inject all pods' ipv4 address into `/etc/hosts`
func (d *Discovery) Run() {

	ctx := context.TODO()

	ctxs, cancel := context.WithCancel(ctx)

	stopChan := make(chan int, 0)

	go d.startElection(ctxs, cancel, stopChan)
	go d.startHostsFileMonitor(ctxs, cancel, stopChan)

	<-ctxs.Done()

	var count int = 0

	for {

		if 2 == count {
			break
		}

		<-stopChan

		count++
	}

	if true == d.completed {
		d.deleteLock()
		return
	}

	err := d.releaseLock()

	if nil == err {
		return
	}

	fmt.Println(err)

	d.deleteLock()

}

func (d *Discovery) startElection(ctx context.Context, cancel context.CancelFunc, stopChan chan int) {

	leaderelection.RunOrDie(ctx, leaderelection.LeaderElectionConfig{
		Lock:            d.leaseLock,
		LeaseDuration:   15 * time.Second,
		RenewDeadline:   10 * time.Second,
		RetryPeriod:     2 * time.Second,
		ReleaseOnCancel: false,
		Callbacks: leaderelection.LeaderCallbacks{
			OnStartedLeading: func(ctx context.Context) {
				completed, err := d.onStartLeading()

				if nil != err {
					fmt.Println(err)
					panic(err)
				}

				d.completed = completed

				cancel()
			},
			OnStoppedLeading: func() {
				stopChan <- 1
			},
		},
	})

}

func (d *Discovery) startHostsFileMonitor(ctx context.Context, cancel context.CancelFunc, stopChan chan int) {

	defer func() {
		stopChan <- 1
	}()

	var started bool = false

	for {

		if true == started {
			time.Sleep(time.Duration(3) * time.Second)
		} else {
			started = true
		}

		//just read file directly,more robust than file event wathcer

		needUpdate, ipPairs, err := d.checkDiff()

		if err != nil {
			fmt.Println(err)
		} else {
			if false == needUpdate {

				d.completed = d.isCompleted(ipPairs)

				cancel()
				return
			}
		}
	}

}
