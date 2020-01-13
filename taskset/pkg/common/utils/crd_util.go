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

package utils

import (
	"reflect"
	"time"

	apiExtensions "k8s.io/apiextensions-apiserver/pkg/apis/apiextensions/v1beta1"
	apiClient "k8s.io/apiextensions-apiserver/pkg/client/clientset/clientset"
	apiErrors "k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/util/wait"
	"k8s.io/client-go/rest"
)

//RegisterCRD register crd to k8s
func RegisterCRD(config *rest.Config, crd *apiExtensions.CustomResourceDefinition) error {

	client := apiClient.NewForConfigOrDie(config)

	oldCrd, err := client.ApiextensionsV1beta1().CustomResourceDefinitions().Get(crd.Name, metav1.GetOptions{})

	if err != nil && !apiErrors.IsNotFound(err) {
		return err
	}
	//not exist ,just create
	if err != nil && apiErrors.IsNotFound(err) {
		oldCrd, err = client.ApiextensionsV1beta1().CustomResourceDefinitions().Create(crd)
		if err != nil {
			return err
		}
	} else if err == nil && !reflect.DeepEqual(oldCrd.Spec, crd.Spec) {
		oldCopy := oldCrd.DeepCopy()
		oldCopy.Spec = crd.Spec

		oldCrd, err = client.ApiextensionsV1beta1().CustomResourceDefinitions().Update(oldCopy)

		if err != nil {
			return err
		}
	}

	established := false

	for _, cond := range oldCrd.Status.Conditions {
		if cond.Status == apiExtensions.ConditionTrue &&
			cond.Type == apiExtensions.Established {
			established = true
			break
		}
	}

	if true == established {
		return nil
	}

	return waitEstablished(client, crd.Name)

}

func waitEstablished(client apiClient.Interface, crdName string) error {
	return wait.Poll(
		time.Duration(10)*time.Second,
		time.Duration(70)*time.Second,
		func() (bool, error) {

			crd, err := client.ApiextensionsV1beta1().CustomResourceDefinitions().Get(crdName, metav1.GetOptions{})

			if err != nil {
				return false, err
			}

			established := false

			for _, cond := range crd.Status.Conditions {
				if cond.Status == apiExtensions.ConditionTrue &&
					cond.Type == apiExtensions.Established {
					established = true
					break
				}
			}

			return established, nil
		})
}
